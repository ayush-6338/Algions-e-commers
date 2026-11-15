import { afterAll, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDatabase, disconnectDatabase } from '../../../database/connection.js';
import { User, Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog } from '../../../database/models/index.js';

let replica;
let customerToken;
let addressId;
let productId;
const models = [User, Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog];

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDatabase(replica.getUri());
  await Promise.all(models.map((Model) => Model.init()));
});
afterAll(async () => { await disconnectDatabase(); await replica?.stop(); });
beforeEach(async () => {
  await Promise.all(models.map((Model) => Model.deleteMany({})));
  const registered = await request(app).post('/api/v1/auth/register').send({ name: 'Casey Buyer', email: 'casey@example.com', password: 'BuyerPass123!' });
  customerToken = registered.body.data.token;
  const address = await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${customerToken}`).send({ fullName: 'Casey Buyer', phone: '9876543210', line1: '1 Market Street', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India', isDefault: true });
  addressId = address.body.data._id;
  const category = await Category.create({ name: 'Home', slug: 'home' });
  const product = await Product.create({ name: 'Desk Light', slug: 'desk-light', category: category._id, price: 100, stock: 1 });
  productId = product._id.toString();
});

test('register, login and JWT protection work', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'casey@example.com', password: 'BuyerPass123!' });
  expect(login.status).toBe(200);
  expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.data.token}`)).status).toBe(200);
  expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
  expect((await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid')).status).toBe(401);
  expect((await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${login.body.data.token}`)).status).toBe(200);
  expect((await request(app).get('/api/v1/users/me')).status).toBe(401);
});

test('auth validates passwords and reports duplicate email clearly', async () => {
  const duplicate = await request(app).post('/api/v1/auth/register').send({ name: 'Casey Buyer', email: 'casey@example.com', password: 'BuyerPass123!' });
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.message).toMatch(/already exists/i);
  const weak = await request(app).post('/api/v1/auth/register').send({ name: 'Weak User', email: 'weak@example.com', password: 'password' });
  expect(weak.status).toBe(400);
});

test('wrong password and unknown email share the same login response', async () => {
  const wrong = await request(app).post('/api/v1/auth/login').send({ email: 'casey@example.com', password: 'WrongPass123!' });
  const unknown = await request(app).post('/api/v1/auth/login').send({ email: 'unknown@example.com', password: 'WrongPass123!' });
  expect(wrong.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect(wrong.body.message).toBe('Invalid email or password');
  expect(unknown.body.message).toBe(wrong.body.message);
});

test('forgot password gives the same response for existing and unknown email; reset token is single use', async () => {
  const info = jest.spyOn(console, 'info').mockImplementation(() => {});
  try {
    const existing = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'casey@example.com' });
    const unknown = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'unknown@example.com' });
    expect(existing.body).toEqual(unknown.body);
    const link = info.mock.calls[0][0];
    const resetToken = link.split('/').at(-1);
    const reset = await request(app).post(`/api/v1/auth/reset-password/${resetToken}`).send({ password: 'NewPassword456' });
    expect(reset.status).toBe(200);
    expect((await request(app).post(`/api/v1/auth/reset-password/${resetToken}`).send({ password: 'OtherPassword789' })).status).toBe(400);
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'casey@example.com', password: 'NewPassword456' })).status).toBe(200);
  } finally { info.mockRestore(); }
});

test('expired reset token is rejected', async () => {
  const info = jest.spyOn(console, 'info').mockImplementation(() => {});
  try {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'casey@example.com' });
    const resetToken = info.mock.calls[0][0].split('/').at(-1);
    await User.updateOne({ email: 'casey@example.com' }, { $set: { passwordResetExpires: new Date(Date.now() - 1000) } });
    const response = await request(app).post(`/api/v1/auth/reset-password/${resetToken}`).send({ password: 'NewPassword456' });
    expect(response.status).toBe(400);
  } finally { info.mockRestore(); }
});

test('admin routes reject customer credentials', async () => {
  const response = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${customerToken}`);
  expect(response.status).toBe(403);
});

test('retries with the same Idempotency-Key create one order', async () => {
  await request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${customerToken}`).send({ productId, quantity: 1 });
  const checkout = () => request(app).post('/api/v1/orders/checkout').set('Authorization', `Bearer ${customerToken}`).set('Idempotency-Key', 'checkout-once').send({ addressId, paymentMethod: 'card_sandbox' });
  expect((await checkout()).status).toBe(201);
  expect((await checkout()).status).toBe(200);
  expect(await Order.countDocuments()).toBe(1);
});

test('simultaneous purchases never decrement stock below zero', async () => {
  const second = await request(app).post('/api/v1/auth/register').send({ name: 'Taylor Buyer', email: 'taylor@example.com', password: 'BuyerPass123!' });
  const tokenTwo = second.body.data.token;
  const addressTwo = await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${tokenTwo}`).send({ fullName: 'Taylor Buyer', phone: '9876543210', line1: '2 Market Street', city: 'Pune', state: 'Maharashtra', pincode: '411001' });
  await Promise.all([customerToken, tokenTwo].map((token) => request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${token}`).send({ productId, quantity: 1 })));
  const buy = (token, address, key) => request(app).post('/api/v1/orders/checkout').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', key).send({ addressId: address, paymentMethod: 'card_sandbox' });
  const results = await Promise.all([buy(customerToken, addressId, 'parallel-a'), buy(tokenTwo, addressTwo.body.data._id, 'parallel-b')]);
  expect(results.filter((r) => r.status === 201)).toHaveLength(1);
  expect(results.filter((r) => r.status === 409)).toHaveLength(1);
  expect((await Product.findById(productId)).stock).toBe(0);
});

test('failed payment reserves stock and cancellation restores it', async () => {
  await request(app).post('/api/v1/cart/items').set('Authorization', `Bearer ${customerToken}`).send({ productId, quantity: 1 });
  const failed = await request(app).post('/api/v1/orders/checkout').set('Authorization', `Bearer ${customerToken}`).set('Idempotency-Key', 'payment-failed').send({ addressId, paymentMethod: 'card_sandbox', simulateFailure: true });
  expect(failed.body.data.order.status).toBe('placed');
  expect(failed.body.data.order.paymentStatus).toBe('failed');
  expect((await Product.findById(productId)).stock).toBe(0);
  const cancelled = await request(app).post(`/api/v1/orders/${failed.body.data.order._id}/cancel`).set('Authorization', `Bearer ${customerToken}`).send({ reason: 'No longer needed' });
  expect(cancelled.status).toBe(200);
  expect((await Product.findById(productId)).stock).toBe(1);
});

test('admin revenue report reconciles against successful non-cancelled orders', async () => {
  const user = await User.findOne({ email: 'casey@example.com' }); user.role = 'admin'; await user.save();
  const token = (await request(app).post('/api/v1/auth/login').send({ email: 'casey@example.com', password: 'BuyerPass123!' })).body.data.token;
  await Order.create({ user: user._id, items: [], address: { recipient: 'Casey', phone: '9876543210', line1: '1 Market', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, status: 'paid', paymentStatus: 'succeeded', totals: { subtotal: 100, discount: 0, tax: 8, shipping: 0, total: 108 } });
  const dashboard = await request(app).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${token}`);
  expect(dashboard.body.data.revenue).toBe(108);
  expect(dashboard.body.data.totalOrders).toBe(1);
  expect(mongoose.connection.readyState).toBe(1);
});
