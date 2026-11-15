import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Address, Cart, Coupon, Order, Payment, Product } from '../../../database/models/index.js';
import { AppError } from '../middleware/errors.js';
import { calculateTotals } from './pricing.js';
import { transition } from './orderStateMachine.js';
import auditService from './auditService.js';

const keyPattern = /^[\w:-]{8,64}$/;
const invalidKey = () => new AppError('Idempotency-Key must contain 8 to 64 letters, numbers, dashes, underscores, or colons', 400, 'MISSING_IDEMPOTENCY_KEY');
const idempotentReplay = (res) => res.set('Idempotent-Replay', 'true');
const couponIsActive = (coupon) => (coupon.isActive ?? coupon.active) && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);
const snapshotAddress = (address) => ({ fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2 || '', city: address.city, state: address.state, pincode: address.pincode, country: address.country || 'India' });
const requestHash = (body) => crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const isDemo = () => process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';

function itemConflict(name, message) {
  throw new AppError(`${message}: ${name}`, 409, 'OUT_OF_STOCK', [{ item: name, message }]);
}

async function reserveItems(items, session) {
  for (const item of items) {
    const { product, variant, quantity } = item;
    const filter = variant
      ? { _id: product._id, isActive: true, active: true, stock: { $gte: quantity }, totalStock: { $gte: quantity }, variants: { $elemMatch: { sku: variant.sku, stock: { $gte: quantity } } } }
      : { _id: product._id, isActive: true, active: true, stock: { $gte: quantity }, totalStock: { $gte: quantity } };
    const update = variant
      ? { $inc: { 'variants.$.stock': -quantity, stock: -quantity, totalStock: -quantity, salesCount: quantity } }
      : { $inc: { stock: -quantity, totalStock: -quantity, salesCount: quantity } };
    const result = await Product.updateOne(filter, update, { session });
    if (!result.modifiedCount) itemConflict(item.name, 'Insufficient stock for');
  }
}

async function validateCoupon(code, subtotal, session) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() }).session(session);
  if (!coupon || !couponIsActive(coupon) || subtotal < (coupon.minOrder ?? coupon.minimumSubtotal ?? 0)) {
    throw new AppError('This coupon is invalid, expired, exhausted, or does not meet its minimum order', 400, 'INVALID_COUPON');
  }
  return coupon;
}

async function recordPayment({ order, userId, key, simulateFailure, res }) {
  if (key) {
    const previous = await Payment.findOne({ user: userId, idempotencyKey: key });
    if (previous) {
      if (previous.order.toString() !== order._id.toString()) throw new AppError('Idempotency-Key was already used for another payment', 409, 'IDEMPOTENCY_CONFLICT');
      const existingOrder = await Order.findOne({ _id: previous.order, user: userId });
      if (existingOrder) { if (res) idempotentReplay(res); return existingOrder; }
    }
  }
  let payment;
  try { [payment] = await Payment.create([{ order: order._id, user: userId, amount: order.pricing.total, method: order.paymentMethod, status: 'initiated', idempotencyKey: key }]); }
  catch (error) {
    if (error.code !== 11000 || !key) throw error;
    const replay = await Payment.findOne({ user: userId, idempotencyKey: key });
    if (!replay || replay.order.toString() !== order._id.toString()) throw new AppError('Idempotency-Key was already used for another payment', 409, 'IDEMPOTENCY_CONFLICT');
    if (res) idempotentReplay(res);
    return Order.findOne({ _id: replay.order, user: userId });
  }
  if (order.paymentMethod === 'cod') return order;
  const failed = simulateFailure === true && isDemo();
  if (failed) {
    payment.status = 'failed';
    payment.failureReason = 'Simulated sandbox payment failure';
    await payment.save();
    order.paymentStatus = 'failed';
    await order.save();
    await auditService.log({ actor: userId, action: 'payment.failed', entityType: 'Payment', entityId: payment._id, meta: { orderNumber: order.orderNumber, reason: payment.failureReason } });
    return order;
  }
  payment.status = 'success';
  payment.transactionId = `SKPAY-${crypto.randomUUID()}`;
  await payment.save();
  order.status = transition(order.status, 'paid');
  order.paymentStatus = 'paid';
  order.statusHistory.push({ status: 'paid', by: userId, note: 'Sandbox payment successful' });
  await order.save();
  await auditService.log({ actor: userId, action: 'payment.success', entityType: 'Payment', entityId: payment._id, meta: { orderNumber: order.orderNumber, method: order.paymentMethod } });
  return order;
}

export async function checkout({ userId, body, key, res }) {
  if (!keyPattern.test(key || '')) throw invalidKey();
  const hash = requestHash(body);
  const existing = await Order.findOne({ user: userId, idempotencyKey: key });
  if (existing) {
    if (existing.requestHash && existing.requestHash !== hash) throw new AppError('Idempotency-Key was already used for a different checkout', 409, 'IDEMPOTENCY_CONFLICT');
    idempotentReplay(res);
    return { order: existing, replayed: true };
  }

  const session = await mongoose.startSession();
  let placedOrder;
  let replayed = false;
  try {
    await session.withTransaction(async () => {
      const transactionReplay = await Order.findOne({ user: userId, idempotencyKey: key }).session(session);
      if (transactionReplay) {
        if (transactionReplay.requestHash && transactionReplay.requestHash !== hash) throw new AppError('Idempotency-Key was already used for a different checkout', 409, 'IDEMPOTENCY_CONFLICT');
        placedOrder = transactionReplay;
        replayed = true;
        return;
      }
      const address = await Address.findOne({ _id: body.addressId, user: userId }).session(session);
      if (!address) throw new AppError('Choose a saved delivery address', 400, 'ADDRESS_NOT_FOUND');
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart?.items.length) throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
      const lines = [];
      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.product).session(session);
        if (!product || !product.isActive || !product.active) itemConflict(product?.name || 'Product', 'Product is unavailable');
        const variant = cartItem.variantId ? product.variants.id(cartItem.variantId) : null;
        if ((cartItem.variantId && !variant) || (!cartItem.variantId && product.variants.length)) itemConflict(product.name, 'Selected product option is unavailable');
        const unitPrice = variant?.price ?? product.price;
        lines.push({ product, variant, quantity: cartItem.quantity, name: product.name, unitPrice, lineTotal: unitPrice * cartItem.quantity });
      }
      const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
      const couponCode = Object.hasOwn(body, 'couponCode') ? body.couponCode : cart.couponCode;
      const coupon = await validateCoupon(couponCode, subtotal, session);
      const pricing = calculateTotals(lines, coupon);
      await reserveItems(lines, session);
      if (coupon) {
        const limitFilter = coupon.usageLimit ? { usedCount: { $lt: coupon.usageLimit } } : {};
        const updated = await Coupon.updateOne({ _id: coupon._id, isActive: true, ...limitFilter }, { $inc: { usedCount: 1 } }, { session });
        if (!updated.modifiedCount) throw new AppError('This coupon has reached its usage limit', 400, 'INVALID_COUPON');
      }
      const orderData = {
        user: userId, items: lines.map((item) => ({ product: item.product._id, name: item.name, image: item.product.images?.[0] || '/images/placeholder.svg', variantSku: item.variant?.sku, variantLabel: item.variant?.label, sku: item.variant?.sku, variantId: item.variant?._id, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })),
        shippingAddress: snapshotAddress(address), address: { recipient: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, postalCode: address.pincode, country: address.country },
        pricing, totals: pricing, couponCode: coupon?.code, paymentMethod: body.paymentMethod, paymentStatus: 'pending', status: 'placed', idempotencyKey: key, requestHash: hash,
        statusHistory: [{ status: 'placed', by: userId, note: 'Order placed' }],
      };
      [placedOrder] = await Order.create([orderData], { session });
      await Cart.updateOne({ user: userId }, { $set: { items: [] }, $unset: { couponCode: 1 } }, { session });
    });
  } catch (error) {
    if (error.code === 11000) {
      const raced = await Order.findOne({ user: userId, idempotencyKey: key });
      if (raced) {
        if (raced.requestHash && raced.requestHash !== hash) throw new AppError('Idempotency-Key was already used for a different checkout', 409, 'IDEMPOTENCY_CONFLICT');
        idempotentReplay(res);
        return { order: raced, replayed: true };
      }
    }
    throw error;
  } finally { await session.endSession(); }

  if (replayed) {
    idempotentReplay(res);
    return { order: await Order.findById(placedOrder._id), replayed: true };
  }

  await auditService.log({ actor: userId, action: 'order.placed', entityType: 'Order', entityId: placedOrder._id, meta: { orderNumber: placedOrder.orderNumber, total: placedOrder.pricing.total } });
  const order = await recordPayment({ order: placedOrder, userId, key, simulateFailure: body.simulateFailure, res });
  return { order, replayed: false };
}

export async function retryPayment({ userId, orderId, key, simulateFailure, res }) {
  if (!keyPattern.test(key || '')) throw invalidKey();
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  const previous = await Payment.findOne({ user: userId, idempotencyKey: key });
  if (previous) {
    if (previous.order.toString() !== order._id.toString()) throw new AppError('Idempotency-Key was already used for another payment', 409, 'IDEMPOTENCY_CONFLICT');
    idempotentReplay(res); return Order.findOne({ _id: previous.order, user: userId });
  }
  if (order.status !== 'placed' || !['failed', 'pending'].includes(order.paymentStatus) || order.paymentMethod === 'cod') {
    throw new AppError('Payment can only be retried for a pending or failed non-COD placed order', 409, 'INVALID_STATE_TRANSITION');
  }
  return recordPayment({ order, userId, key, simulateFailure, res });
}

export async function listOrders(userId, query) {
  const { page, limit, status } = query;
  const filter = { user: userId, ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getOrder(userId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) throw new AppError('Order not found', 404, 'NOT_FOUND');
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  return order;
}

export async function cancelOrder({ userId, orderId, reason = '' }) {
  if (!mongoose.isValidObjectId(orderId)) throw new AppError('Order not found', 404, 'NOT_FOUND');
  const session = await mongoose.startSession();
  let cancelled;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, user: userId }).session(session);
      if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
      order.status = transition(order.status, 'cancelled');
      for (const item of order.items) {
        const filter = item.variantSku
          ? { _id: item.product, variants: { $elemMatch: { sku: item.variantSku, stock: { $gte: 0 } } }, salesCount: { $gte: item.quantity } }
          : { _id: item.product, salesCount: { $gte: item.quantity } };
        const update = item.variantSku
          ? { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity, totalStock: item.quantity, salesCount: -item.quantity } }
          : { $inc: { stock: item.quantity, totalStock: item.quantity, salesCount: -item.quantity } };
        const restored = await Product.updateOne(filter, update, { session });
        if (!restored.modifiedCount) throw new AppError(`Could not safely restore stock for ${item.name}`, 409, 'OUT_OF_STOCK');
      }
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'succeeded') order.paymentStatus = 'refunded';
      order.cancelledAt = new Date();
      order.cancelReason = reason;
      order.statusHistory.push({ status: 'cancelled', by: userId, note: reason || 'Cancelled by customer' });
      await order.save({ session });
      cancelled = order;
    });
  } finally { await session.endSession(); }
  await auditService.log({ actor: userId, action: 'order.cancelled', entityType: 'Order', entityId: cancelled._id, meta: { orderNumber: cancelled.orderNumber, reason: reason || undefined } });
  return cancelled;
}
