import { Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog } from '../models/index.js';

export async function ensureIndexes() {
  await Promise.all([Address, Category, Product, Cart, Order, Payment, Coupon, AuditLog].map((Model) => Model.createIndexes()));
}
