import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { User } from './User.js';
import { Category } from './Category.js';
import { Product } from './Product.js';

const { Schema, model, models } = mongoose;
const addressFields = {
  label: { type: String, default: 'Home', trim: true }, fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ }, line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true, default: '' }, city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true }, pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
  country: { type: String, required: true, trim: true, default: 'India' }, isDefault: { type: Boolean, default: false },
};

const addressSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, ...addressFields }, { timestamps: true });
addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });
const cartItemSchema = new Schema({ product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, variantId: { type: Schema.Types.ObjectId }, quantity: { type: Number, min: 1, required: true } }, { _id: false });
const cartSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, items: { type: [cartItemSchema], default: [] }, couponCode: { type: String, uppercase: true, trim: true } }, { timestamps: true });
const statusHistorySchema = new Schema({ status: { type: String, required: true }, at: { type: Date, default: Date.now }, by: { type: Schema.Types.ObjectId, ref: 'User' }, note: String }, { _id: false });
const shippingSnapshotSchema = new Schema({ fullName: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String, country: String }, { _id: false });
const legacyAddressSchema = new Schema({ recipient: String, phone: String, line1: String, line2: String, city: String, state: String, postalCode: String, country: String }, { _id: false });
const orderItemSchema = new Schema({ product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, name: { type: String, required: true }, image: String, variantSku: String, variantLabel: String, sku: String, variantId: Schema.Types.ObjectId, options: { type: Map, of: String }, quantity: { type: Number, min: 1, required: true }, unitPrice: { type: Number, min: 0, required: true }, lineTotal: { type: Number, min: 0, required: true } }, { _id: false });
const orderSchema = new Schema({
  orderNumber: { type: String, unique: true, default: () => `SK-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}` },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, items: { type: [orderItemSchema], default: [] },
  shippingAddress: shippingSnapshotSchema, address: legacyAddressSchema,
  status: { type: String, enum: ['placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'succeeded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['card_sandbox', 'upi_sandbox', 'cod'] },
  statusHistory: { type: [statusHistorySchema], default: [] },
  pricing: { subtotal: Number, discount: Number, tax: Number, shipping: Number, total: Number },
  totals: { subtotal: Number, discount: Number, tax: Number, shipping: Number, total: Number },
  couponCode: String, idempotencyKey: String, requestHash: String, cancelledAt: Date, cancelReason: String,
}, { timestamps: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
// The unique user/key index on Order is the durable idempotency guard, so no separate TTL key collection is needed.
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
const paymentSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, amount: { type: Number, required: true }, method: { type: String, enum: ['card_sandbox', 'upi_sandbox', 'cod'], required: true }, status: { type: String, enum: ['initiated', 'success', 'failed'], required: true }, transactionId: String, failureReason: String, idempotencyKey: String }, { timestamps: true });
paymentSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
const couponSchema = new Schema({ code: { type: String, required: true, unique: true, uppercase: true }, type: { type: String, enum: ['percent', 'flat', 'fixed'], required: true }, value: { type: Number, min: 0, required: true }, minOrder: { type: Number, min: 0, default: 0 }, minimumSubtotal: { type: Number, min: 0, default: 0 }, maxDiscount: { type: Number, min: 0 }, expiresAt: Date, isActive: { type: Boolean, default: true }, active: { type: Boolean, default: true }, usageLimit: { type: Number, min: 1 }, usedCount: { type: Number, min: 0, default: 0 } }, { timestamps: true });
const auditSchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: 'User' }, action: { type: String, required: true }, entityType: { type: String, required: true }, entityId: { type: Schema.Types.ObjectId }, details: { type: Schema.Types.Mixed, default: {} }, ip: String }, { timestamps: true });
auditSchema.index({ createdAt: -1, action: 1 });

export { User };
export const Address = models.Address || model('Address', addressSchema);
export { Category, Product };
export const Cart = models.Cart || model('Cart', cartSchema);
export const Order = models.Order || model('Order', orderSchema);
export const Payment = models.Payment || model('Payment', paymentSchema);
export const Coupon = models.Coupon || model('Coupon', couponSchema);
export const AuditLog = models.AuditLog || model('AuditLog', auditSchema);
