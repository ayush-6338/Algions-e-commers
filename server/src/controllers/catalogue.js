import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errors.js';
import { getProductBySlug, getProductsByIds, listCategories, listProducts } from '../services/productService.js';

export const categories = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await listCategories() });
});

export const products = asyncHandler(async (req, res) => {
  const result = await listProducts(req.query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

export const productBySlug = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  if (!product) throw new AppError('Product not found or is no longer available', 404, 'PRODUCT_NOT_FOUND');
  res.json({ success: true, data: product });
});

export const productsByIds = asyncHandler(async (req, res) => {
  const ids = req.query.ids.split(',');
  res.json({ success: true, data: await getProductsByIds(ids) });
});
