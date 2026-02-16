import { OrderItem, OrderItemCreationAttributes } from '../models/OrderItem';
import { logger } from '../utils/logger';

export class OrderItemRepository {
  /**
   * Create order items in bulk
   */
  async bulkCreate(items: OrderItemCreationAttributes[]): Promise<OrderItem[]> {
    try {
      const createdItems = await OrderItem.bulkCreate(items);
      return createdItems;
    } catch (error) {
      logger.error('Error bulk creating order items', { error });
      throw error;
    }
  }

  /**
   * Find items by order ID
   */
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    try {
      const items = await OrderItem.findAll({
        where: { orderId },
      });
      return items;
    } catch (error) {
      logger.error('Error finding order items', { error, orderId });
      throw error;
    }
  }

  /**
   * Get total quantity of a product ordered
   */
  async getTotalQuantityByProduct(productId: string): Promise<number> {
    try {
      const result = await OrderItem.sum('quantity', {
        where: { productId },
      });
      return result || 0;
    } catch (error) {
      logger.error('Error getting total quantity', { error, productId });
      throw error;
    }
  }
}
