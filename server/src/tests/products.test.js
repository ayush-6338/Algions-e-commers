import { afterAll, beforeAll, beforeEach, expect, test } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDatabase, disconnectDatabase } from '../../../database/connection.js';
import { Category, Product } from '../../../database/models/index.js';

let replica;
let home;
let kitchen;

beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDatabase(replica.getUri());
  await Promise.all([Category.init(), Product.init()]);
});

afterAll(async () => { await disconnectDatabase(); await replica?.stop(); });

beforeEach(async () => {
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  [home, kitchen] = await Category.create([
    { name: 'Home & Living', slug: 'home-living', isActive: true },
    { name: 'Kitchen', slug: 'kitchen', isActive: true },
  ]);
  const products = Array.from({ length: 15 }, (_, index) => ({
    name: index === 0 ? 'Aurora Desk Lamp' : `Everyday Item ${String(index).padStart(2, '0')}`,
    slug: index === 0 ? 'aurora-desk-lamp' : `everyday-item-${index}`,
    description: index === 0 ? 'A luminous warm light for focused work.' : 'A practical daily essential.',
    brand: index === 0 ? 'Luma Studio' : 'SkyKart',
    category: index % 2 ? home._id : kitchen._id,
    price: 100 + index * 100,
    totalStock: index === 1 ? 0 : index === 2 ? 2 : index + 4,
    ratingAverage: (index % 5) + 1,
    ratingCount: index + 1,
    isFeatured: index < 8,
    salesCount: 200 - index * 7,
    variants: [],
    isActive: true,
  }));
  products.push({ name: 'Hidden Lamp', slug: 'hidden-lamp', description: '', brand: 'SkyKart', category: home._id, price: 80, totalStock: 5, isActive: false });
  await Product.insertMany(products);
});

test('GET /products uses default page size and returns top-level pagination', async () => {
  const response = await request(app).get('/api/v1/products');
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(12);
  expect(response.body.pagination).toMatchObject({ page: 1, limit: 12, total: 15, totalPages: 2, hasNext: true, hasPrev: false });
});

test('keyword search matches the product text index and returns no unrelated products', async () => {
  const response = await request(app).get('/api/v1/products?q=luminous');
  expect(response.status).toBe(200);
  expect(response.body.data.map((product) => product.slug)).toEqual(['aurora-desk-lamp']);
});

test('category slug, price range and in-stock filters are applied', async () => {
  const byCategory = await request(app).get('/api/v1/products?category=home-living&limit=48');
  expect(byCategory.body.data.every((product) => product.category.slug === 'home-living')).toBe(true);

  const byPrice = await request(app).get('/api/v1/products?minPrice=300&maxPrice=600&limit=48');
  expect(byPrice.body.data.every((product) => product.price >= 300 && product.price <= 600)).toBe(true);

  const inStock = await request(app).get('/api/v1/products?inStock=true&limit=48');
  expect(inStock.body.data.every((product) => product.totalStock > 0)).toBe(true);
  expect(inStock.body.data).toHaveLength(14);
});

test.each([
  ['price_asc', (a, b) => a.price - b.price],
  ['price_desc', (a, b) => b.price - a.price],
  ['name_asc', (a, b) => a.name.localeCompare(b.name)],
  ['rating', (a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount],
])('sort=%s returns products in the expected order', async (sort, compare) => {
  const response = await request(app).get(`/api/v1/products?sort=${sort}&limit=48`);
  expect(response.status).toBe(200);
  const products = response.body.data;
  expect(products).toHaveLength(15);
  expect(products.slice(0, -1).every((product, index) => compare(product, products[index + 1]) <= 0)).toBe(true);
});

test('newest sorting places recently created items first', async () => {
  const response = await request(app).get('/api/v1/products?sort=newest&limit=48');
  expect(response.body.data[0].slug).toBe('everyday-item-14');
});

test('featured=true filters to featured products and bestselling sorts by sales count', async () => {
  const featured = await request(app).get('/api/v1/products?featured=true&limit=48');
  expect(featured.status).toBe(200);
  expect(featured.body.data).toHaveLength(8);
  expect(featured.body.data.every((product) => product.isFeatured)).toBe(true);

  const bestsellers = await request(app).get('/api/v1/products?sort=bestselling&limit=48');
  const counts = bestsellers.body.data.map((product) => product.salesCount);
  expect(counts).toEqual([...counts].sort((a, b) => b - a));
});

test('GET /products/by-ids validates ids and preserves requested order', async () => {
  const first = await Product.findOne({ slug: 'everyday-item-7' }).select('_id');
  const second = await Product.findOne({ slug: 'aurora-desk-lamp' }).select('_id');
  const ordered = await request(app).get(`/api/v1/products/by-ids?ids=${first._id},${second._id}`);
  expect(ordered.status).toBe(200);
  expect(ordered.body.data.map((product) => product.slug)).toEqual(['everyday-item-7', 'aurora-desk-lamp']);

  const invalid = await request(app).get('/api/v1/products/by-ids?ids=not-an-object-id');
  expect(invalid.status).toBe(400);
  expect(invalid.body.details?.[0]?.message).toMatch(/valid 24-character ObjectIds/);

  const tooMany = await request(app).get(`/api/v1/products/by-ids?ids=${Array.from({ length: 13 }, () => first._id).join(',')}`);
  expect(tooMany.status).toBe(400);
  expect(tooMany.body.details?.[0]?.message).toMatch(/no more than 12/);
});

test.each([
  ['limit=1000', /48 or less/],
  ['minPrice=abc', /valid numbers/],
  ['sort=unknown', /sort must be newest/],
])('invalid query %s returns a clear 400', async (query, message) => {
  const response = await request(app).get(`/api/v1/products?${query}`);
  expect(response.status).toBe(400);
  expect(response.body.details?.[0]?.message || response.body.message).toMatch(message);
});

test('GET /products/:slug returns an active product and 404 for unknown or inactive products', async () => {
  expect((await request(app).get('/api/v1/products/aurora-desk-lamp')).status).toBe(200);
  const unknown = await request(app).get('/api/v1/products/not-a-product');
  expect(unknown.status).toBe(404);
  expect(unknown.body.message).toMatch(/not found/i);
  expect((await request(app).get('/api/v1/products/hidden-lamp')).status).toBe(404);
});
