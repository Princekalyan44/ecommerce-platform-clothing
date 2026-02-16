import { Product } from '../models/Product.model';
import {
  IProduct,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchQuery,
} from '../types';
import { generateSlug } from '../utils/slugify';

export class ProductRepository {
  /**
   * Create a new product
   */
  async create(input: CreateProductInput): Promise<IProduct> {
    const slug = generateSlug(input.name, true);

    const product = new Product({
      ...input,
      slug,
      categoryName: '', // Will be populated from category
      isActive: true,
      publishedAt: new Date(),
    });

    return await product.save();
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<IProduct | null> {
    return await Product.findById(id);
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string): Promise<IProduct | null> {
    return await Product.findOne({ slug, isActive: true });
  }

  /**
   * Update product
   */
  async update(id: string, input: UpdateProductInput): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  }

  /**
   * Delete product (soft delete)
   */
  async delete(id: string): Promise<void> {
    await Product.findByIdAndUpdate(id, { isActive: false });
  }

  /**
   * Hard delete product
   */
  async hardDelete(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }

  /**
   * List products with filters
   */
  async list(query: ProductSearchQuery): Promise<{ products: IProduct[]; total: number }> {
    const {
      categoryId,
      brand,
      tags,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = query;

    const filter: any = { isActive: true };

    if (categoryId) filter.categoryId = categoryId;
    if (brand) filter.brand = brand;
    if (tags && tags.length > 0) filter.tags = { $in: tags };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = minPrice;
      if (maxPrice) filter.basePrice.$lte = maxPrice;
    }
    if (inStock) filter.totalStock = { $gt: 0 };
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;

    // Sorting
    let sort: any = {};
    switch (sortBy) {
      case 'price_asc':
        sort = { basePrice: 1 };
        break;
      case 'price_desc':
        sort = { basePrice: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { purchaseCount: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return { products, total };
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<IProduct[]> {
    return await Product.find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get products by category
   */
  async getByCategory(categoryId: string, limit: number = 20): Promise<IProduct[]> {
    return await Product.find({ categoryId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  /**
   * Increment purchase count
   */
  async incrementPurchaseCount(id: string, quantity: number = 1): Promise<void> {
    await Product.findByIdAndUpdate(id, { $inc: { purchaseCount: quantity } });
  }

  /**
   * Update stock
   */
  async updateStock(id: string, quantity: number): Promise<void> {
    await Product.findByIdAndUpdate(id, { $inc: { totalStock: quantity } });
  }

  /**
   * Add review
   */
  async addReview(id: string, review: any): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(
      id,
      { $push: { reviews: review } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<IProduct[]> {
    return await Product.find({
      isActive: true,
      trackInventory: true,
      $expr: { $lte: ['$totalStock', '$lowStockThreshold'] },
    });
  }
}
