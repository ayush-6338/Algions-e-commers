import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../connection.js';
import { User, Category, Product, Coupon, Address } from '../models/index.js';
import { categoryRows, productRows } from './data.js';

try {
  await connectDatabase();
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash('AdminPass123!', 12), bcrypt.hash('CustomerPass123!', 12),
  ]);
  const [admin, customer] = await Promise.all([
    User.findOneAndUpdate({ email: 'admin@example.com' }, { $setOnInsert: { name: 'SkyKart Admin', email: 'admin@example.com', passwordHash: adminPasswordHash, role: 'admin' } }, { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'customer@example.com' }, { $setOnInsert: { name: 'Demo Customer', email: 'customer@example.com', passwordHash: customerPasswordHash, role: 'customer' } }, { upsert: true, new: true }),
  ]);
  await Address.updateMany({ user: customer._id }, { $set: { isDefault: false } });
  await Address.findOneAndUpdate(
    { user: customer._id, label: 'Home' },
    { $set: { user: customer._id, label: 'Home', fullName: customer.name, phone: '9876543210', line1: '12 SkyKart Lane', line2: 'Near Central Park', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India', isDefault: true } },
    { upsert: true, new: true, runValidators: true },
  );
  const categories = await Promise.all(categoryRows.map(async ([name, slug, description], index) => Category.findOneAndUpdate(
    { slug },
    { $set: { name, slug, description, image: `/images/categories/${slug}.svg`, isActive: true, active: true } },
    { upsert: true, new: true, runValidators: true },
  )));
  const categoryByKey = Object.fromEntries(['home', 'kitchen', 'stationery', 'tech', 'care', 'travel'].map((key, index) => [key, categories[index]._id]));
  const products = productRows.map(([name, description, price, categoryIndex, categoryKey], index) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const stockTotal = index % 13 === 0 ? 0 : index % 9 === 0 ? 2 : 8 + (index % 19);
    const firstStock = Math.floor(stockTotal / 2);
    const secondStock = stockTotal - firstStock;
    const isSize = ['throw', 'cover', 'towels', 'bag', 'set'].some((word) => slug.includes(word));
    const labels = isSize ? ['Small', 'Large'] : ['Natural', 'Charcoal'];
    return {
      name, slug, description, brand: 'SkyKart', category: categoryByKey[categoryKey],
      images: [`/images/products/${slug}-1.svg`, `/images/products/${slug}-2.svg`],
      price, compareAtPrice: Math.round(price * 1.2),
      totalStock: stockTotal, stock: stockTotal,
      variants: labels.map((label, variantIndex) => ({
        sku: `SK-${String(index + 1).padStart(3, '0')}-${variantIndex ? 'B' : 'A'}`,
        label, attributes: { [isSize ? 'size' : 'colour']: label },
        options: { [isSize ? 'size' : 'color']: label },
        stock: variantIndex ? secondStock : firstStock,
        ...(index % 4 === 0 && variantIndex === 1 ? { price: price + 100 } : {}),
      })),
      ratingAverage: Number((3.8 + ((index * 7) % 13) / 10).toFixed(1)),
      ratingCount: (index * 11) % 96,
      isFeatured: index < 8,
      salesCount: (index * 37) % 251,
      tags: [categoryKey, ...(index % 2 ? ['everyday'] : ['giftable'])],
      isActive: true, active: true,
    };
  });
  await Product.bulkWrite(products.map((product) => ({ updateOne: { filter: { slug: product.slug }, update: { $set: product }, upsert: true } })));
  await Coupon.updateOne({ code: 'WELCOME10' }, { $set: { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, minimumSubtotal: 500, maxDiscount: 200, isActive: true, active: true }, $setOnInsert: { usedCount: 0 } }, { upsert: true });
  await Coupon.updateOne({ code: 'FLAT100' }, { $set: { code: 'FLAT100', type: 'flat', value: 100, minOrder: 1000, minimumSubtotal: 1000, maxDiscount: 100, isActive: true, active: true }, $setOnInsert: { usedCount: 0 } }, { upsert: true });
  console.log('Seed complete. Development credentials:');
  console.log('Admin: admin@example.com / AdminPass123!');
  console.log('Customer: customer@example.com / CustomerPass123!');
  console.log(`Created ${products.length} products across ${categories.length} categories. (${admin.email}, ${customer.email})`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
