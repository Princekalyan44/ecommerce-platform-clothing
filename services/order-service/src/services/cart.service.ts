import { CartRepository } from '../repositories/cart.repository';
import { ProductClient } from './product.client';
import { Cart, CartItemAttributes } from '../models/Cart';
import { AddToCartInput, UpdateCartItemInput, RemoveFromCartInput } from '../types';
import { logger } from '../utils/logger';
import { recordCartOperation } from '../utils/metrics';

const cartRepository = new CartRepository();
const productClient = new ProductClient();

export class CartService {
  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<Cart> {
    try {
      const cart = await cartRepository.findOrCreate(userId);
      recordCartOperation('get', 'success');
      return cart;
    } catch (error) {
      recordCartOperation('get', 'failure');
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, input: AddToCartInput): Promise<Cart> {
    try {
      // Fetch product details
      const product = await productClient.getProductById(input.productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check stock availability
      const hasStock = await productClient.hasStock(
        input.productId,
        input.variantSku,
        input.quantity
      );
      if (!hasStock) {
        throw new Error('Insufficient stock');
      }

      // Get current cart
      const cart = await cartRepository.findOrCreate(userId);
      const items: CartItemAttributes[] = [...cart.items];

      // Find if item already exists
      const existingIndex = items.findIndex(
        (item) => item.productId === input.productId && item.variantSku === input.variantSku
      );

      // Get product details
      let unitPrice = product.basePrice;
      let size: string | undefined;
      let color: string | undefined;

      if (input.variantSku && product.variants) {
        const variant = product.variants.find((v) => v.sku === input.variantSku);
        if (variant) {
          unitPrice = variant.price;
          size = variant.size;
          color = variant.color;
        }
      }

      const primaryImage = product.images?.find((img) => img.isPrimary);

      if (existingIndex >= 0) {
        // Update quantity
        items[existingIndex].quantity += input.quantity;
        items[existingIndex].total = items[existingIndex].quantity * unitPrice;
      } else {
        // Add new item
        items.push({
          productId: input.productId,
          productName: product.name,
          productImage: primaryImage?.url,
          variantSku: input.variantSku,
          size,
          color,
          quantity: input.quantity,
          unitPrice,
          total: input.quantity * unitPrice,
        });
      }

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);

      // Update cart
      const updatedCart = await cartRepository.updateItems(userId, items, subtotal);

      recordCartOperation('add_item', 'success');
      logger.info('Item added to cart', { userId, productId: input.productId });

      return updatedCart;
    } catch (error) {
      recordCartOperation('add_item', 'failure');
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, input: UpdateCartItemInput): Promise<Cart> {
    try {
      const cart = await cartRepository.findOrCreate(userId);
      const items = [...cart.items];

      const itemIndex = items.findIndex(
        (item) => item.productId === input.productId && item.variantSku === input.variantSku
      );

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      // Check stock
      const hasStock = await productClient.hasStock(
        input.productId,
        input.variantSku,
        input.quantity
      );
      if (!hasStock) {
        throw new Error('Insufficient stock');
      }

      // Update quantity
      items[itemIndex].quantity = input.quantity;
      items[itemIndex].total = items[itemIndex].quantity * items[itemIndex].unitPrice;

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);

      // Update cart
      const updatedCart = await cartRepository.updateItems(userId, items, subtotal);

      recordCartOperation('update_item', 'success');
      logger.info('Cart item updated', { userId, productId: input.productId });

      return updatedCart;
    } catch (error) {
      recordCartOperation('update_item', 'failure');
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, input: RemoveFromCartInput): Promise<Cart> {
    try {
      const cart = await cartRepository.findOrCreate(userId);
      const items = cart.items.filter(
        (item) => !(item.productId === input.productId && item.variantSku === input.variantSku)
      );

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);

      // Update cart
      const updatedCart = await cartRepository.updateItems(userId, items, subtotal);

      recordCartOperation('remove_item', 'success');
      logger.info('Item removed from cart', { userId, productId: input.productId });

      return updatedCart;
    } catch (error) {
      recordCartOperation('remove_item', 'failure');
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    try {
      await cartRepository.clear(userId);
      recordCartOperation('clear', 'success');
      logger.info('Cart cleared', { userId });
    } catch (error) {
      recordCartOperation('clear', 'failure');
      throw error;
    }
  }

  /**
   * Validate cart items (check stock availability)
   */
  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const cart = await cartRepository.findByUserId(userId);
      if (!cart || cart.items.length === 0) {
        return { valid: true, errors: [] };
      }

      const errors: string[] = [];

      for (const item of cart.items) {
        const hasStock = await productClient.hasStock(
          item.productId,
          item.variantSku,
          item.quantity
        );

        if (!hasStock) {
          errors.push(`${item.productName} is out of stock or has insufficient quantity`);
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      logger.error('Error validating cart', { error, userId });
      throw error;
    }
  }
}
