import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ProductServiceProduct } from '../types';

export class ProductClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.services.productService;
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<ProductServiceProduct | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/products/${productId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Error fetching product', { error, productId });
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Get multiple products by IDs
   */
  async getProductsByIds(productIds: string[]): Promise<ProductServiceProduct[]> {
    try {
      const promises = productIds.map((id) => this.getProductById(id));
      const products = await Promise.all(promises);
      return products.filter((p) => p !== null) as ProductServiceProduct[];
    } catch (error) {
      logger.error('Error fetching products', { error, productIds });
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Update product stock
   */
  async updateStock(productId: string, quantity: number): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/products/${productId}/stock`, {
        quantity,
      });
      logger.info('Product stock updated', { productId, quantity });
    } catch (error) {
      logger.error('Error updating product stock', { error, productId, quantity });
      throw new Error('Failed to update product stock');
    }
  }

  /**
   * Check if product has enough stock
   */
  async hasStock(productId: string, variantSku: string | undefined, quantity: number): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return false;

      if (variantSku && product.variants) {
        const variant = product.variants.find((v) => v.sku === variantSku);
        return variant ? variant.stock >= quantity : false;
      }

      return product.totalStock >= quantity;
    } catch (error) {
      logger.error('Error checking stock', { error, productId, variantSku, quantity });
      return false;
    }
  }
}
