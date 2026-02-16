import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

const ProductVariantSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
});

const ProductImageSchema = new Schema({
  url: { type: String, required: true },
  altText: { type: String },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const ProductReviewSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 200 },
  comment: { type: String, required: true, maxlength: 2000 },
  verifiedPurchase: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 500 },
  categoryId: { type: String, required: true, index: true },
  categoryName: { type: String, required: true },
  brand: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],

  // Pricing
  basePrice: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  discountPercentage: { type: Number, min: 0, max: 100 },

  // Variants
  hasVariants: { type: Boolean, default: false },
  variants: [ProductVariantSchema],

  // Images
  images: [ProductImageSchema],

  // Inventory
  totalStock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  trackInventory: { type: Boolean, default: true },

  // SEO
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  metaKeywords: [{ type: String }],

  // Status
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isOnSale: { type: Boolean, default: false },

  // Reviews
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  reviews: [ProductReviewSchema],

  // Analytics
  viewCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },

  publishedAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes for performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ categoryId: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ purchaseCount: -1 });

// Virtual for checking low stock
ProductSchema.virtual('isLowStock').get(function() {
  return this.trackInventory && this.totalStock <= this.lowStockThreshold;
});

// Virtual for checking out of stock
ProductSchema.virtual('isOutOfStock').get(function() {
  return this.trackInventory && this.totalStock === 0;
});

// Pre-save middleware to calculate discount percentage
ProductSchema.pre('save', function(next) {
  if (this.compareAtPrice && this.basePrice < this.compareAtPrice) {
    this.discountPercentage = Math.round(
      ((this.compareAtPrice - this.basePrice) / this.compareAtPrice) * 100
    );
    this.isOnSale = true;
  } else {
    this.discountPercentage = 0;
    this.isOnSale = false;
  }
  next();
});

// Pre-save middleware to calculate average rating
ProductSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = parseFloat((totalRating / this.reviews.length).toFixed(1));
    this.totalReviews = this.reviews.length;
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
