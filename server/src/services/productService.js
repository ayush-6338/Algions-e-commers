import { Category, Product } from '../../../database/models/index.js';

const sortOptions = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  rating: { ratingAverage: -1, ratingCount: -1, _id: 1 },
  bestselling: { salesCount: -1, _id: 1 },
};

export async function listCategories() {
  return Category.find({ isActive: true }).sort({ name: 1 });
}

export async function listProducts(query) {
  const { q, category: categorySlug, minPrice, maxPrice, inStock, featured, sort, page, limit } = query;
  const filter = { isActive: true };
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug, isActive: true }).select('_id');
    if (!category) return { items: [], pagination: paginate(page, limit, 0) };
    filter.category = category._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (inStock) filter.totalStock = { $gt: 0 };
  if (featured !== undefined) filter.isFeatured = featured;
  const safeSearch = q?.replace(/["\\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (safeSearch) filter.$text = { $search: safeSearch };

  let productQuery = Product.find(filter).populate('category', 'name slug image').sort(sortOptions[sort] || sortOptions.newest)
    .skip((page - 1) * limit).limit(limit);
  if (sort === 'name_asc') productQuery = productQuery.collation({ locale: 'en', strength: 2 });
  const [items, total] = await Promise.all([
    productQuery,
    Product.countDocuments(filter),
  ]);
  return { items, pagination: paginate(page, limit, total) };
}

export async function getProductBySlug(slug) {
  return Product.findOne({ slug, isActive: true }).populate('category', 'name slug image');
}

export async function getProductsByIds(ids) {
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate('category', 'name slug image');
  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

function paginate(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 && totalPages > 0 };
}
