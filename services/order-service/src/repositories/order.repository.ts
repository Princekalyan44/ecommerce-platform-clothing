import { Op } from 'sequelize';
import { Order, OrderStatus, PaymentStatus, OrderCreationAttributes } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { OrderSearchQuery } from '../types';
import { logger } from '../utils/logger';

export class OrderRepository {
  /**
   * Create a new order
   */
  async create(orderData: OrderCreationAttributes): Promise<Order> {
    try {
      const order = await Order.create(orderData);
      return order;
    } catch (error) {
      logger.error('Error creating order', { error });
      throw error;
    }
  }

  /**
   * Find order by ID with items
   */
  async findById(id: string): Promise<Order | null> {
    try {
      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'items' }],
      });
      return order;
    } catch (error) {
      logger.error('Error finding order by ID', { error, id });
      throw error;
    }
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    try {
      const order = await Order.findOne({
        where: { orderNumber },
        include: [{ model: OrderItem, as: 'items' }],
      });
      return order;
    } catch (error) {
      logger.error('Error finding order by number', { error, orderNumber });
      throw error;
    }
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(userId: string, limit: number = 10): Promise<Order[]> {
    try {
      const orders = await Order.findAll({
        where: { userId },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['orderDate', 'DESC']],
        limit,
      });
      return orders;
    } catch (error) {
      logger.error('Error finding orders by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Search orders with filters
   */
  async search(query: OrderSearchQuery): Promise<{ orders: Order[]; total: number }> {
    try {
      const where: any = {};

      if (query.userId) where.userId = query.userId;
      if (query.status) where.status = query.status;
      if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

      if (query.startDate || query.endDate) {
        where.orderDate = {};
        if (query.startDate) where.orderDate[Op.gte] = new Date(query.startDate);
        if (query.endDate) where.orderDate[Op.lte] = new Date(query.endDate);
      }

      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [{ model: OrderItem, as: 'items' }],
        order: [['orderDate', 'DESC']],
        limit,
        offset,
      });

      return { orders: rows, total: count };
    } catch (error) {
      logger.error('Error searching orders', { error, query });
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus, metadata?: any): Promise<Order | null> {
    try {
      const order = await Order.findByPk(id);
      if (!order) return null;

      const updates: any = { status };

      // Set timestamps based on status
      if (status === OrderStatus.SHIPPED && !order.shippedAt) {
        updates.shippedAt = new Date();
      }
      if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
        updates.deliveredAt = new Date();
      }
      if (status === OrderStatus.CANCELLED && !order.cancelledAt) {
        updates.cancelledAt = new Date();
      }

      // Add optional metadata
      if (metadata?.trackingNumber) updates.trackingNumber = metadata.trackingNumber;
      if (metadata?.carrier) updates.carrier = metadata.carrier;
      if (metadata?.internalNotes) updates.internalNotes = metadata.internalNotes;

      await order.update(updates);
      return order;
    } catch (error) {
      logger.error('Error updating order status', { error, id, status });
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentTransactionId?: string
  ): Promise<Order | null> {
    try {
      const order = await Order.findByPk(id);
      if (!order) return null;

      const updates: any = { paymentStatus };
      if (paymentTransactionId) updates.paymentTransactionId = paymentTransactionId;
      if (paymentStatus === PaymentStatus.PAID && !order.paidAt) {
        updates.paidAt = new Date();
      }

      await order.update(updates);
      return order;
    } catch (error) {
      logger.error('Error updating payment status', { error, id, paymentStatus });
      throw error;
    }
  }

  /**
   * Get order count by status
   */
  async countByStatus(userId?: string): Promise<Record<OrderStatus, number>> {
    try {
      const where: any = {};
      if (userId) where.userId = userId;

      const counts = await Order.findAll({
        where,
        attributes: [
          'status',
          [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const result: any = {};
      Object.values(OrderStatus).forEach((status) => {
        result[status] = 0;
      });

      counts.forEach((item: any) => {
        result[item.status] = parseInt(item.count, 10);
      });

      return result;
    } catch (error) {
      logger.error('Error counting orders by status', { error });
      throw error;
    }
  }

  /**
   * Get recent orders
   */
  async getRecent(limit: number = 10): Promise<Order[]> {
    try {
      const orders = await Order.findAll({
        include: [{ model: OrderItem, as: 'items' }],
        order: [['orderDate', 'DESC']],
        limit,
      });
      return orders;
    } catch (error) {
      logger.error('Error getting recent orders', { error });
      throw error;
    }
  }

  /**
   * Delete order (admin only, use with caution)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deleted = await Order.destroy({ where: { id } });
      return deleted > 0;
    } catch (error) {
      logger.error('Error deleting order', { error, id });
      throw error;
    }
  }
}
