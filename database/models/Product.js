import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  attributes: { type: Map, of: String, default: {} },
  options: { type: Map, of: String, default: {} },
  price: { type: Number, min: 0 },
  stock: { type: Number, min: 0, default: 0, validate: Number.isInteger },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  brand: { type: String, default: 'SkyKart', trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  images: [{ type: String }],
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  variants: { type: [variantSchema], default: [] },
  totalStock: { type: Number, min: 0, default: 0, index: true },
  stock: { type: Number, min: 0, default: 0 },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 },
  isFeatured: { type: Boolean, default: false, index: true },
  salesCount: { type: Number, min: 0, default: 0 },
  tags: [{ type: String, trim: true, lowercase: true }],
  isActive: { type: Boolean, default: true, index: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.pre('validate', function syncInventory() {
  const total = this.variants.length
    ? this.variants.reduce((sum, variant) => sum + variant.stock, 0)
    : (this.isModified('stock') ? this.stock : (this.totalStock ?? this.stock ?? 0));
  this.totalStock = total;
  this.stock = total;
  this.active = this.isActive;
});
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
