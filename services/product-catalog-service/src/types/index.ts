import { Document } from 'mongoose';

export interface IProductVariant {
  sku: string;
  size: string;
  color: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface IProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface IProductReview {
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  brand?: string;
  tags: string[];
  
  // Pricing
  basePrice: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  
  // Variants
  hasVariants: boolean;
  variants: IProductVariant[];
  
  // Images
  images: IProductImage[];
  
  // Inventory
  totalStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  
  // Reviews
  averageRating: number;
  totalReviews: number;
  reviews: IProductReview[];
  
  // Analytics
  viewCount: number;
  purchaseCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  brand?: string;
  tags?: string[];
  basePrice: number;
  compareAtPrice?: number;
  hasVariants: boolean;
  variants?: IProductVariant[];
  images?: IProductImage[];
  totalStock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  isFeatured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  basePrice?: number;
  compareAtPrice?: number;
  variants?: IProductVariant[];
  images?: IProductImage[];
  totalStock?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ProductSearchQuery {
  query?: string;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

export interface ProductReviewInput {
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase?: boolean;
}
