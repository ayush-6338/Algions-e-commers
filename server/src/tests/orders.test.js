import { afterAll, beforeAll, beforeEach, expect, test } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDatabase, disconnectDatabase } from '../../../database/connection.js';
import { Address, AuditLog, Cart, Category, Coupon, Order, Payment, Product, User } from '../../../database/models/index.js';
import { canTransition, transition } from '../services/orderStateMachine.js';

let replica;
let models;
let userOne;
let userTwo;
let category;
let product;

async function createCustomer(name, email) {
  const response = await request(app).post('/api/v1/auth/register').send({ name, email, password: 'BuyerPass123!' });
  const token = response.body.data.token;
  const addressResponse = await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${token}`).send({
    label: 'Home', fullName: name, phone: '9876543210', line1: '12 Market Road', line2: '', city: 'Pune', state: 'Maharashtra', pincode: '411001',
  });
  expect(addressResponse.status).toBe(201);
  return { token, userId: response.body.data.user.id, addressId: addressResponse.body.data._id };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const checkoutRequest = (customer, key, body = {}) => request(app).post('/api/v1/orders/checkout').set(auth(customer.token)).set('Idempotency-Key', key).send({ addressId: customer.addressId, paymentMethod: 'card_sandbox', ...body });

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDatabase(replica.getUri());
  models = [User, Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog];
  await Promise.all(models.map((Model) => Model.init()));
});
afterAll(async () => { await disconnectDatabase(); await replica?.stop(); });

beforeEach(async () => {
  await Promise.all(models.map((Model) => Model.deleteMany({})));
  [userOne, userTwo] = await Promise.all([
    createCustomer('Casey Buyer', 'casey-orders@example.com'),
    createCustomer('Taylor Buyer', 'taylor-orders@example.com'),
  ]);
  category = await Category.create({ name: 'Home', slug: 'home' });
  product = await Product.create({ name: 'Desk Light', slug: 'desk-light', category: category._id, price: 100, stock: 10, totalStock: 10, images: ['/images/products/desk-light-1.svg'] });
});

async function addToCart(customer, quantity = 1) {
  return request(app).post('/api/v1/cart/items').set(auth(customer.token)).send({ productId: product._id, quantity });
}

test('address CRUD enforces ownership and exactly one default; deleting default promotes another', async () => {
  const second = await request(app).post('/api/v1/addresses').set(auth(userOne.token)).send({ label: 'Work', fullName: 'Casey Buyer', phone: '9876543210', line1: '20 Office Road', city: 'Pune', state: 'Maharashtra', pincode: '411002' });
  expect(second.status).toBe(201);
  const updated = await request(app).put(`/api/v1/addresses/${second.body.data._id}`).set(auth(userOne.token)).send({ label: 'Office', fullName: 'Casey Buyer', phone: '9876543210', line1: '22 Office Road', city: 'Pune', state: 'Maharashtra', pincode: '411002' });
  expect(updated.status).toBe(200);
  expect(updated.body.data.line1).toBe('22 Office Road');
  const first = await Address.findOne({ user: userOne.userId, isDefault: true });
  expect(first).not.toBeNull();
  expect(second.body.data.isDefault).toBe(false);
  expect((await request(app).get('/api/v1/addresses').set(auth(userTwo.token))).body.data).toHaveLength(1);
  expect((await request(app).put(`/api/v1/addresses/${first._id}`).set(auth(userTwo.token)).send({ label: 'Wrong owner', fullName: 'Taylor Buyer', phone: '9876543210', line1: '2 Main Street', city: 'Pune', state: 'Maharashtra', pincode: '411001' })).status).toBe(404);
  expect((await request(app).delete(`/api/v1/addresses/${first._id}`).set(auth(userTwo.token))).status).toBe(404);
  expect((await request(app).patch(`/api/v1/addresses/${second.body.data._id}/default`).set(auth(userOne.token))).status).toBe(200);
  expect(await Address.countDocuments({ user: userOne.userId, isDefault: true })).toBe(1);
  expect((await request(app).delete(`/api/v1/addresses/${second.body.data._id}`).set(auth(userOne.token))).status).toBe(200);
  expect(await Address.countDocuments({ user: userOne.userId, isDefault: true })).toBe(1);
});

test('address book rejects an eleventh saved address', async () => {
  for (let index = 1; index < 10; index += 1) {
    const added = await request(app).post('/api/v1/addresses').set(auth(userOne.token)).send({ label: `Place ${index}`, fullName: 'Casey Buyer', phone: '9876543210', line1: `${index} Other Road`, city: 'Pune', state: 'Maharashtra', pincode: `41100${index}` });
    expect(added.status).toBe(201);
  }
  const rejected = await request(app).post('/api/v1/addresses').set(auth(userOne.token)).send({ label: 'Extra', fullName: 'Casey Buyer', phone: '9876543210', line1: '99 Other Road', city: 'Pune', state: 'Maharashtra', pincode: '411099' });
  expect(rejected.status).toBe(400);
  expect(rejected.body.code).toBe('ADDRESS_LIMIT_REACHED');
});

test('checkout snapshots server prices, decrements stock, clears cart and returns a paid order', async () => {
  await addToCart(userOne, 2);
  const response = await checkoutRequest(userOne, 'server-pricing-001', { unitPrice: 1, total: 1, quantity: 100 });
  expect(response.status).toBe(201);
  const order = response.body.data.order;
  expect(order.status).toBe('paid');
  expect(order.paymentStatus).toBe('paid');
  expect(order.items[0]).toMatchObject({ name: 'Desk Light', unitPrice: 100, quantity: 2, lineTotal: 200 });
  expect(order.pricing).toEqual({ subtotal: 200, discount: 0, tax: 10, shipping: 49, total: 259 });
  expect((await Product.findById(product._id)).stock).toBe(8);
  expect((await Product.findById(product._id)).salesCount).toBe(2);
  expect((await request(app).get('/api/v1/cart').set(auth(userOne.token))).body.data.items).toHaveLength(0);
});

test('checkout requires an Idempotency-Key header', async () => {
  await addToCart(userOne);
  const response = await request(app).post('/api/v1/orders/checkout').set(auth(userOne.token)).send({ addressId: userOne.addressId, paymentMethod: 'card_sandbox' });
  expect(response.status).toBe(400);
  expect(response.body.code).toBe('MISSING_IDEMPOTENCY_KEY');
});

test('same checkout key replays sequential and parallel requests without a second reservation', async () => {
  await addToCart(userOne);
  const key = 'duplicate-checkout-001';
  const parallel = await Promise.all([checkoutRequest(userOne, key), checkoutRequest(userOne, key)]);
  expect(parallel.every((response) => [200, 201].includes(response.status))).toBe(true);
  expect(parallel.some((response) => response.headers['idempotent-replay'] === 'true')).toBe(true);
  const replay = await checkoutRequest(userOne, key);
  expect(replay.status).toBe(200);
  expect(replay.headers['idempotent-replay']).toBe('true');
  expect(await Order.countDocuments({ user: userOne.userId })).toBe(1);
  expect((await Product.findById(product._id)).stock).toBe(9);
});

test('concurrent buyers cannot reserve the same last unit', async () => {
  await Product.updateOne({ _id: product._id }, { $set: { stock: 1, totalStock: 1 } });
  await Promise.all([addToCart(userOne), addToCart(userTwo)]);
  const [one, two] = await Promise.all([checkoutRequest(userOne, 'last-unit-casey'), checkoutRequest(userTwo, 'last-unit-taylor')]);
  expect([one.status, two.status].sort()).toEqual([201, 409]);
  const conflict = one.status === 409 ? one : two;
  expect(conflict.body.code).toBe('OUT_OF_STOCK');
  expect((await Product.findById(product._id)).stock).toBe(0);
  expect(await Order.countDocuments()).toBe(1);
});

test('empty cart and inactive product return clear checkout errors', async () => {
  const empty = await checkoutRequest(userOne, 'empty-cart-key-01');
  expect(empty.status).toBe(400);
  expect(empty.body.code).toBe('EMPTY_CART');
  await addToCart(userOne);
  await Product.updateOne({ _id: product._id }, { $set: { isActive: false, active: false } });
  const inactive = await checkoutRequest(userOne, 'inactive-item-key');
  expect(inactive.status).toBe(409);
  expect(inactive.body.code).toBe('OUT_OF_STOCK');
});

test.each(['NO-SUCH-COUPON', 'EXPIRED10'])('invalid or expired coupon %s is rejected', async (code) => {
  await addToCart(userOne);
  if (code === 'EXPIRED10') await Coupon.create({ code, type: 'percent', value: 10, isActive: true, active: true, expiresAt: new Date(Date.now() - 1000) });
  const response = await checkoutRequest(userOne, `coupon-${code}-001`, { couponCode: code });
  expect(response.status).toBe(400);
  expect(response.body.code).toBe('INVALID_COUPON');
});

test('valid coupons honor the minimum and maximum discount and consume one use', async () => {
  product.price = 200; await product.save();
  await Coupon.create({ code: 'SAVE10', type: 'percent', value: 10, minOrder: 500, maxDiscount: 50, usageLimit: 1, usedCount: 0, isActive: true, active: true });
  await addToCart(userOne, 3);
  const response = await checkoutRequest(userOne, 'valid-coupon-casey-01', { couponCode: 'SAVE10' });
  expect(response.status).toBe(201);
  expect(response.body.data.order.pricing).toEqual({ subtotal: 600, discount: 50, tax: 27.5, shipping: 49, total: 626.5 });
  expect((await Coupon.findOne({ code: 'SAVE10' })).usedCount).toBe(1);
});

test('failed payment keeps the placed order and reserved stock; retry succeeds', async () => {
  await addToCart(userOne, 2);
  const failed = await checkoutRequest(userOne, 'failed-payment-checkout', { simulateFailure: true });
  const order = failed.body.data.order;
  expect(order.status).toBe('placed');
  expect(order.paymentStatus).toBe('failed');
  expect((await Product.findById(product._id)).stock).toBe(8);
  const paid = await request(app).post(`/api/v1/orders/${order._id}/pay-retry`).set(auth(userOne.token)).set('Idempotency-Key', 'payment-retry-casey-01').send({});
  expect(paid.status).toBe(200);
  expect(paid.body.data.order.status).toBe('paid');
  expect(paid.body.data.order.paymentStatus).toBe('paid');
  expect(await AuditLog.countDocuments({ action: 'payment.failed' })).toBe(1);
  expect(await AuditLog.countDocuments({ action: 'payment.success' })).toBe(1);
});

test('cancelling a paid order restores stock once, refunds payment, and audits cancellation', async () => {
  await addToCart(userOne, 2);
  const placed = await checkoutRequest(userOne, 'cancel-paid-order-01');
  const orderId = placed.body.data.order._id;
  expect((await Product.findById(product._id)).stock).toBe(8);
  const cancelled = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(userOne.token)).send({ reason: 'Changed my mind' });
  expect(cancelled.status).toBe(200);
  expect(cancelled.body.data.order.status).toBe('cancelled');
  expect(cancelled.body.data.order.paymentStatus).toBe('refunded');
  expect((await Product.findById(product._id)).stock).toBe(10);
  expect((await Product.findById(product._id)).salesCount).toBe(0);
  expect((await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(userOne.token)).send({ reason: '' })).status).toBe(409);
  expect((await Product.findById(product._id)).stock).toBe(10);
  expect(await AuditLog.countDocuments({ action: 'order.placed' })).toBe(1);
  expect(await AuditLog.countDocuments({ action: 'order.cancelled' })).toBe(1);
});

test('COD order stays placed with pending payment', async () => {
  await addToCart(userOne);
  const response = await checkoutRequest(userOne, 'cash-order-casey-01', { paymentMethod: 'cod' });
  expect(response.status).toBe(201);
  expect(response.body.data.order.status).toBe('placed');
  expect(response.body.data.order.paymentStatus).toBe('pending');
  expect(await Payment.findOne({ order: response.body.data.order._id })).toMatchObject({ status: 'initiated', method: 'cod' });
});

test('shipped orders cannot be cancelled and owners cannot read or cancel another user order', async () => {
  await addToCart(userOne);
  const response = await checkoutRequest(userOne, 'shipped-order-casey-01');
  const orderId = response.body.data.order._id;
  await Order.updateOne({ _id: orderId }, { $set: { status: 'shipped' } });
  const shipped = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(userOne.token)).send({ reason: '' });
  expect(shipped.status).toBe(409);
  expect(shipped.body.code).toBe('INVALID_STATE_TRANSITION');
  expect((await request(app).get(`/api/v1/orders/${orderId}`).set(auth(userTwo.token))).status).toBe(404);
  expect((await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(userTwo.token)).send({ reason: '' })).status).toBe(404);
});

test('order list is paginated and only contains the authenticated user orders', async () => {
  await addToCart(userOne);
  await checkoutRequest(userOne, 'user-order-page-001');
  const response = await request(app).get('/api/v1/orders?page=1&limit=1&status=paid').set(auth(userOne.token));
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ page: 1, limit: 1, total: 1, totalPages: 1 });
  expect(response.body.data.items).toHaveLength(1);
  expect((await request(app).get('/api/v1/orders').set(auth(userTwo.token))).body.data.items).toHaveLength(0);
});

test('order state machine permits only the declared customer/admin transitions', () => {
  expect(canTransition('placed', 'paid')).toBe(true);
  expect(canTransition('paid', 'packed')).toBe(true);
  expect(canTransition('shipped', 'delivered')).toBe(true);
  expect(canTransition('placed', 'shipped')).toBe(false);
  expect(canTransition('delivered', 'cancelled')).toBe(false);
  expect(transition('paid', 'packed')).toBe('packed');
  expect(() => transition('shipped', 'cancelled')).toThrow(expect.objectContaining({ status: 409, code: 'INVALID_STATE_TRANSITION' }));
});
