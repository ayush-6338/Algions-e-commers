import mongoose from 'mongoose';
import { User, Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog } from '../../../database/models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errors.js';
import { calculateTotals } from '../services/pricing.js';
import { assertTransition } from '../services/orderState.js';

const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const audit = (actor, action, entityType, entityId, details = {}, ip) => AuditLog.create({ actor, action, entityType, entityId, details, ip });

const handlers = {
  profile: async (req, res) => res.json({ success: true, data: safeUser(req.user) }),
  updateProfile: async (req, res) => { if (typeof req.body.name === 'string') req.user.name = req.body.name; await req.user.save(); res.json({ success: true, data: safeUser(req.user) }); },
  listAddresses: async (req, res) => res.json({ success: true, data: await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: 1 }) }),
  addAddress: async (req, res) => { const hasAddress = await Address.exists({ user: req.user._id }); if (!hasAddress || req.body.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } }); const address = await Address.create({ ...req.body, user: req.user._id, isDefault: !hasAddress || Boolean(req.body.isDefault) }); res.status(201).json({ success: true, data: address }); },
  editAddress: async (req, res) => { const address = await Address.findOne({ _id: req.params.id, user: req.user._id }); if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND'); if (req.body.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } }); Object.assign(address, req.body); await address.save(); res.json({ success: true, data: address }); },
  deleteAddress: async (req, res) => { const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND'); if (address.isDefault) { const next = await Address.findOne({ user: req.user._id }).sort('createdAt'); if (next) { next.isDefault = true; await next.save(); } } res.json({ success: true, data: { deleted: true } }); },
  defaultAddress: async (req, res) => { const address = await Address.findOne({ _id: req.params.id, user: req.user._id }); if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND'); await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } }); address.isDefault = true; await address.save(); res.json({ success: true, data: address }); },
  createCategory: async (req, res) => { const category = await Category.create(req.body); await audit(req.user._id, 'category.created', 'Category', category._id, {}, req.ip); res.status(201).json({ success: true, data: category }); },
  updateCategory: async (req, res) => { const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND'); await audit(req.user._id, 'category.updated', 'Category', category._id, {}, req.ip); res.json({ success: true, data: category }); },
  getCart: async (req, res) => { const cart = await Cart.findOne({ user: req.user._id }).populate('items.product'); res.json({ success: true, data: await cartPayload(cart) }); },
  addCartItem: async (req, res) => {
    const { productId, variantId, quantity } = req.body; const product = await Product.findOne({ _id: productId, active: true, isActive: true });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    const variant = variantId ? product.variants.id(variantId) : null; if (variantId && !variant) throw new AppError('Variant not found', 404, 'NOT_FOUND');
    const stock = variant ? variant.stock : product.stock; if (quantity > stock) throw new AppError('Requested quantity exceeds available stock', 409, 'INSUFFICIENT_STOCK');
    const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { $setOnInsert: { user: req.user._id } }, { upsert: true, new: true });
    const item = cart.items.find((x) => x.product.toString() === productId && String(x.variantId || '') === String(variantId || ''));
    if (item) item.quantity += quantity; else cart.items.push({ product: productId, variantId: variant?._id, quantity });
    if (item && item.quantity > stock) throw new AppError('Requested quantity exceeds available stock', 409, 'INSUFFICIENT_STOCK');
    await cart.save(); res.status(201).json({ success: true, data: await cartPayload(await cart.populate('items.product')) });
  },
  updateCartItem: async (req, res) => { const quantity = Number(req.body.quantity); if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new AppError('Quantity must be an integer from 1 to 100', 400, 'VALIDATION_ERROR'); const requestedVariant = req.params.variantId === 'base' ? '' : req.params.variantId || ''; const cart = await Cart.findOne({ user: req.user._id }); const item = cart?.items.find((x) => x.product.toString() === req.params.productId && String(x.variantId || '') === requestedVariant); if (!item) throw new AppError('Cart item not found', 404, 'NOT_FOUND'); const product = await Product.findById(item.product); const variant = item.variantId ? product?.variants.id(item.variantId) : null; if (!product || !product.isActive || !product.active || (item.variantId && !variant) || quantity > (variant?.stock ?? product.stock)) throw new AppError('Requested quantity exceeds available stock', 409, 'INSUFFICIENT_STOCK'); item.quantity = quantity; await cart.save(); res.json({ success: true, data: await cartPayload(await cart.populate('items.product')) }); },
  removeCartItem: async (req, res) => { const requestedVariant = req.params.variantId === 'base' ? '' : req.params.variantId || ''; const cart = await Cart.findOne({ user: req.user._id }); if (cart) { cart.items = cart.items.filter((x) => !(x.product.toString() === req.params.productId && String(x.variantId || '') === requestedVariant)); await cart.save(); } res.json({ success: true, data: await cartPayload(await cart?.populate('items.product')) }); },
  applyCoupon: async (req, res) => {
    if (typeof req.body.code !== 'string') throw new AppError('Coupon code is required', 400, 'VALIDATION_ERROR');
    const code = req.body.code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code, isActive: true, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }, { $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }] });
    if (!coupon) throw new AppError('Coupon is invalid or expired', 400, 'INVALID_COUPON');
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart?.items.length) throw new AppError('Cart is empty', 400, 'EMPTY_CART');
    const items = cart.items.map((item) => { const variant = item.variantId ? item.product?.variants.id(item.variantId) : null; return { unitPrice: variant?.price ?? item.product?.price ?? 0, quantity: item.quantity }; });
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    if (subtotal < (coupon.minOrder ?? coupon.minimumSubtotal ?? 0)) throw new AppError('This coupon does not meet its minimum order amount', 400, 'INVALID_COUPON');
    cart.couponCode = code;
    await cart.save();
    res.json({ success: true, data: await cartPayload(cart) });
  },
  removeCoupon: async (req, res) => { const cart = await Cart.findOne({ user: req.user._id }).populate('items.product'); if (cart) { cart.couponCode = undefined; await cart.save(); } res.json({ success: true, data: await cartPayload(cart) }); },
  setOrderStatus: async (req, res) => { const session = await mongoose.startSession(); let order; try { await session.withTransaction(async () => { order = await Order.findById(req.params.id).session(session); if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND'); assertTransition(order.status, req.body.status); if (req.body.status === 'cancelled') { for (const item of order.items) { const sku = item.variantSku || item.sku; const filter = sku ? { _id: item.product, variants: { $elemMatch: { sku, stock: { $gte: 0 } } }, salesCount: { $gte: item.quantity } } : { _id: item.product, salesCount: { $gte: item.quantity } }; const update = sku ? { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity, totalStock: item.quantity, salesCount: -item.quantity } } : { $inc: { stock: item.quantity, totalStock: item.quantity, salesCount: -item.quantity } }; const restored = await Product.updateOne(filter, update, { session }); if (!restored.modifiedCount) throw new AppError(`Could not restore stock for ${item.name}`, 409, 'OUT_OF_STOCK'); } if (order.paymentStatus === 'paid' || order.paymentStatus === 'succeeded') { order.paymentStatus = 'refunded'; await Payment.updateOne({ order: order._id }, { $set: { status: 'failed' } }, { session }); } order.cancelledAt = new Date(); order.cancelReason = req.body.note || ''; } order.status = req.body.status; order.statusHistory.push({ status: order.status, by: req.user._id, note: req.body.note || 'Updated by admin' }); await order.save({ session }); }); } finally { await session.endSession(); } await audit(req.user._id, req.body.status === 'cancelled' ? 'order.cancelled' : 'order.status_changed', 'Order', order._id, { status: order.status }, req.ip); res.json({ success: true, data: order }); },
  dashboard: async (_req, res) => { const [totalOrders, revenue, ordersByStatus, lowStock] = await Promise.all([Order.countDocuments(), Order.aggregate([{ $match: { paymentStatus: { $in: ['paid', 'succeeded'] }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totals.total' } } }]), Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]), Product.find({ active: true, stock: { $lte: 5 } }).select('name stock').sort('stock').limit(10)]); res.json({ success: true, data: { totalOrders, revenue: revenue[0]?.total || 0, ordersByStatus: Object.fromEntries(ordersByStatus.map((x) => [x._id, x.count])), lowStock } }); },
  customers: async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1); const users = await User.find({ role: 'customer' }).select('name email createdAt').sort('-createdAt').skip((page - 1) * 20).limit(20); res.json({ success: true, data: users }); },
  createProduct: async (req, res) => { const product = await Product.create(req.body); await audit(req.user._id, 'product.created', 'Product', product._id, {}, req.ip); res.status(201).json({ success: true, data: product }); },
  updateProduct: async (req, res) => { const previous = await Product.findById(req.params.id); if (!previous) throw new AppError('Product not found', 404, 'NOT_FOUND'); const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); await audit(req.user._id, 'product.updated', 'Product', product._id, {}, req.ip); if (req.body.stock !== undefined && req.body.stock !== previous.stock) await audit(req.user._id, 'inventory.changed', 'Product', product._id, { previous: previous.stock, current: product.stock }, req.ip); if (req.body.variants) await audit(req.user._id, 'inventory.changed', 'Product', product._id, { variants: true }, req.ip); res.json({ success: true, data: product }); },
  deleteProduct: async (req, res) => { const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND'); await audit(req.user._id, 'product.archived', 'Product', product._id, {}, req.ip); res.json({ success: true, data: { archived: true } }); },
  auditLogs: async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1); const filter = {}; if (req.query.action) filter.action = String(req.query.action); if (req.query.entityType) filter.entityType = String(req.query.entityType); const [items, total] = await Promise.all([AuditLog.find(filter).populate('actor', 'name email').sort('-createdAt').skip((page - 1) * 25).limit(25), AuditLog.countDocuments(filter)]); res.json({ success: true, data: { items, page, total, pages: Math.ceil(total / 25) } }); },
};

async function cartPayload(cart) {
  if (!cart) return { items: [], totals: calculateTotals([]) };
  const items = cart.items.filter((i) => i.product).map((i) => { const variant = i.variantId ? i.product.variants.id(i.variantId) : null; return { product: i.product, variant, quantity: i.quantity, unitPrice: variant?.price ?? i.product.price }; });
  const coupon = cart.couponCode ? await Coupon.findOne({ code: cart.couponCode, isActive: true, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }, { $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }] }) : null;
  return { items, couponCode: cart.couponCode, totals: calculateTotals(items, coupon) };
}

export default Object.fromEntries(Object.entries(handlers).map(([name, fn]) => [name, asyncHandler(fn)]));
