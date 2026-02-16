import { Cart, CartItemAttributes } from '../models/Cart';
import { logger } from '../utils/logger';

export class CartRepository {
  /**
   * Find or create cart for user
   */
  async findOrCreate(userId: string): Promise<Cart> {
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const [cart] = await Cart.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          items: [],
          subtotal: 0,
          expiresAt,
        },
      });

      // Update expiry if cart exists
      if (cart.expiresAt < new Date()) {
        await cart.update({ expiresAt });
      }

      return cart;
    } catch (error) {
      logger.error('Error finding or creating cart', { error, userId });
      throw error;
    }
  }

  /**
   * Find cart by user ID
   */
  async findByUserId(userId: string): Promise<Cart | null> {
    try {
      const cart = await Cart.findOne({ where: { userId } });
      return cart;
    } catch (error) {
      logger.error('Error finding cart', { error, userId });
      throw error;
    }
  }

  /**
   * Update cart items
   */
  async updateItems(userId: string, items: CartItemAttributes[], subtotal: number): Promise<Cart> {
    try {
      const cart = await this.findOrCreate(userId);
      await cart.update({ items, subtotal });
      return cart;
    } catch (error) {
      logger.error('Error updating cart items', { error, userId });
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clear(userId: string): Promise<boolean> {
    try {
      const cart = await Cart.findOne({ where: { userId } });
      if (!cart) return false;

      await cart.update({ items: [], subtotal: 0 });
      return true;
    } catch (error) {
      logger.error('Error clearing cart', { error, userId });
      throw error;
    }
  }

  /**
   * Delete cart
   */
  async delete(userId: string): Promise<boolean> {
    try {
      const deleted = await Cart.destroy({ where: { userId } });
      return deleted > 0;
    } catch (error) {
      logger.error('Error deleting cart', { error, userId });
      throw error;
    }
  }

  /**
   * Delete expired carts
   */
  async deleteExpired(): Promise<number> {
    try {
      const deleted = await Cart.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date(),
          },
        },
      });
      return deleted;
    } catch (error) {
      logger.error('Error deleting expired carts', { error });
      throw error;
    }
  }
}

import { Op } from 'sequelize';
