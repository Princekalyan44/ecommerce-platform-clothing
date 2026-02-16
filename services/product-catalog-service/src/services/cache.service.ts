import { redisClient } from '../utils/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private readonly TTL = config.cache.ttl;
  private readonly POPULAR_TTL = config.cache.popularProductsTtl;

  /**
   * Get product from cache
   */
  async getProduct(productId: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(`product:${productId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error', { error, key: `product:${productId}` });
      return null;
    }
  }

  /**
   * Set product in cache
   */
  async setProduct(productId: string, product: any): Promise<void> {
    try {
      await redisClient.setEx(
        `product:${productId}`,
        this.TTL,
        JSON.stringify(product)
      );
    } catch (error) {
      logger.error('Cache set error', { error, key: `product:${productId}` });
    }
  }

  /**
   * Delete product from cache
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await redisClient.del(`product:${productId}`);
    } catch (error) {
      logger.error('Cache delete error', { error, key: `product:${productId}` });
    }
  }

  /**
   * Get featured products from cache
   */
  async getFeaturedProducts(): Promise<any[] | null> {
    try {
      const cached = await redisClient.get('products:featured');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error', { error, key: 'products:featured' });
      return null;
    }
  }

  /**
   * Set featured products in cache
   */
  async setFeaturedProducts(products: any[]): Promise<void> {
    try {
      await redisClient.setEx(
        'products:featured',
        this.POPULAR_TTL,
        JSON.stringify(products)
      );
    } catch (error) {
      logger.error('Cache set error', { error, key: 'products:featured' });
    }
  }

  /**
   * Clear featured products cache
   */
  async clearFeaturedCache(): Promise<void> {
    try {
      await redisClient.del('products:featured');
    } catch (error) {
      logger.error('Cache delete error', { error, key: 'products:featured' });
    }
  }

  /**
   * Get category products from cache
   */
  async getCategoryProducts(categoryId: string): Promise<any[] | null> {
    try {
      const cached = await redisClient.get(`category:${categoryId}:products`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error', { error, key: `category:${categoryId}:products` });
      return null;
    }
  }

  /**
   * Set category products in cache
   */
  async setCategoryProducts(categoryId: string, products: any[]): Promise<void> {
    try {
      await redisClient.setEx(
        `category:${categoryId}:products`,
        this.TTL,
        JSON.stringify(products)
      );
    } catch (error) {
      logger.error('Cache set error', { error, key: `category:${categoryId}:products` });
    }
  }

  /**
   * Clear category cache
   */
  async clearCategoryCache(categoryId: string): Promise<void> {
    try {
      await redisClient.del(`category:${categoryId}:products`);
    } catch (error) {
      logger.error('Cache delete error', { error, key: `category:${categoryId}:products` });
    }
  }

  /**
   * Clear all product caches
   */
  async clearAllProductCaches(): Promise<void> {
    try {
      const keys = await redisClient.keys('product:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Cache clear all error', { error });
    }
  }
}
