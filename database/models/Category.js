import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  active: { type: Boolean, default: true, select: false },
}, { timestamps: true });

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
