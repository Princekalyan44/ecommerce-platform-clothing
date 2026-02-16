import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { SearchService } from './search.service';
import { CacheService } from './cache.service';
import { CreateProductInput, UpdateProductInput, ProductSearchQuery, ProductReviewInput } from '../types';
import { recordProductOperation } from '../utils/metrics';
import { logger } from '../utils/logger';

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const searchService = new SearchService();
const cacheService = new CacheService();

export class ProductService {
  /**
   * Create a new product
   */
  async createProduct(input: CreateProductInput) {
    try {
      // Validate category exists
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Create product
      const product = await productRepository.create({
        ...input,
      });

      // Update product with category name
      product.categoryName = category.name;
      await product.save();

      // Index in Elasticsearch
      await searchService.indexProduct(product);

      // Increment category product count
      await categoryRepository.incrementProductCount(input.categoryId);

      // Clear related caches
      await cacheService.clearCategoryCache(input.categoryId);
      await cacheService.clearFeaturedCache();

      recordProductOperation('create', 'success');
      logger.info('Product created', { productId: product._id });

      return product;
    } catch (error) {
      recordProductOperation('create', 'failure');
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    // Try cache first
    const cached = await cacheService.getProduct(id);
    if (cached) {
      return cached;
    }

    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    await productRepository.incrementViewCount(id);

    // Cache the product
    await cacheService.setProduct(id, product);

    return product;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    await productRepository.incrementViewCount(product._id.toString());

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    try {
      const product = await productRepository.update(id, input);
      if (!product) {
        throw new Error('Product not found');
      }

      // Update search index
      await searchService.updateProduct(id, input);

      // Clear caches
      await cacheService.deleteProduct(id);
      await cacheService.clearCategoryCache(product.categoryId);
      if (product.isFeatured) {
        await cacheService.clearFeaturedCache();
      }

      recordProductOperation('update', 'success');
      logger.info('Product updated', { productId: id });

      return product;
    } catch (error) {
      recordProductOperation('update', 'failure');
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      await productRepository.delete(id);

      // Remove from search index
      await searchService.deleteProduct(id);

      // Decrement category product count
      await categoryRepository.decrementProductCount(product.categoryId);

      // Clear caches
      await cacheService.deleteProduct(id);
      await cacheService.clearCategoryCache(product.categoryId);

      recordProductOperation('delete', 'success');
      logger.info('Product deleted', { productId: id });
    } catch (error) {
      recordProductOperation('delete', 'failure');
      throw error;
    }
  }

  /**
   * List products
   */
  async listProducts(query: ProductSearchQuery) {
    // If search query provided, use Elasticsearch
    if (query.query) {
      return await searchService.searchProducts(query);
    }

    // Otherwise use MongoDB
    return await productRepository.list(query);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10) {
    // Try cache first
    const cached = await cacheService.getFeaturedProducts();
    if (cached) {
      return cached;
    }

    const products = await productRepository.getFeaturedProducts(limit);

    // Cache for 5 minutes
    await cacheService.setFeaturedProducts(products);

    return products;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string, limit: number = 20) {
    // Try cache first
    const cached = await cacheService.getCategoryProducts(categoryId);
    if (cached) {
      return cached;
    }

    const products = await productRepository.getByCategory(categoryId, limit);

    // Cache for 10 minutes
    await cacheService.setCategoryProducts(categoryId, products);

    return products;
  }

  /**
   * Add product review
   */
  async addReview(productId: string, review: ProductReviewInput) {
    const product = await productRepository.addReview(productId, review);
    if (!product) {
      throw new Error('Product not found');
    }

    // Update search index with new rating
    await searchService.updateProduct(productId, {
      averageRating: product.averageRating,
    });

    // Clear cache
    await cacheService.deleteProduct(productId);

    logger.info('Review added', { productId, userId: review.userId });

    return product;
  }

  /**
   * Update stock
   */
  async updateStock(productId: string, quantity: number) {
    await productRepository.updateStock(productId, quantity);

    // Clear cache
    await cacheService.deleteProduct(productId);

    logger.info('Stock updated', { productId, quantity });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts() {
    return await productRepository.getLowStockProducts();
  }

  /**
   * Search products
   */
  async searchProducts(query: ProductSearchQuery) {
    return await searchService.searchProducts(query);
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(prefix: string) {
    return await searchService.getSuggestions(prefix);
  }
}
