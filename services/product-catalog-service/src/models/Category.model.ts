import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types';

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, maxlength: 1000 },
  parentId: { type: String, index: true },
  image: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  productCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Indexes
CategorySchema.index({ name: 'text', description: 'text' });
CategorySchema.index({ parentId: 1, isActive: 1 });
CategorySchema.index({ order: 1 });

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
