import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductClient } from './product.client';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { OrderItemCreationAttributes } from '../models/OrderItem';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  UpdatePaymentStatusInput,
  OrderSearchQuery,
} from '../types';
import { logger } from '../utils/logger';
import { recordOrderOperation, updateActiveOrders } from '../utils/metrics';
import { generateOrderNumber } from '../utils/order-number';
import { publishEvent } from '../utils/rabbitmq';

const orderRepository = new OrderRepository();
const orderItemRepository = new OrderItemRepository();
const cartRepository = new CartRepository();
const productClient = new ProductClient();

export class OrderService {
  /**
   * Create order from cart
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    try {
      // Get user's cart
      const cart = await cartRepository.findByUserId(input.userId);
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate stock availability
      for (const item of cart.items) {
        const hasStock = await productClient.hasStock(
          item.productId,
          item.variantSku,
          item.quantity
        );
        if (!hasStock) {
          throw new Error(`${item.productName} is out of stock`);
        }
      }

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Calculate totals
      const subtotal = cart.subtotal;
      const tax = subtotal * 0.1; // 10% tax (customize as needed)
      const shippingCost = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
      const discount = 0; // TODO: Apply coupon codes
      const total = subtotal + tax + shippingCost - discount;

      // Create order
      const order = await orderRepository.create({
        orderNumber,
        userId: input.userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress || input.shippingAddress,
        paymentMethod: input.paymentMethod,
        customerNotes: input.customerNotes,
        orderDate: new Date(),
      });

      // Create order items
      const orderItems: OrderItemCreationAttributes[] = cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variantSku: item.variantSku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.total,
        discount: 0,
        total: item.total,
      }));

      await orderItemRepository.bulkCreate(orderItems);

      // Reserve inventory (update stock)
      for (const item of cart.items) {
        await productClient.updateStock(item.productId, -item.quantity);
      }

      // Clear cart
      await cartRepository.clear(input.userId);

      // Publish order created event
      await publishEvent('order_events', 'order.created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        total: order.total,
        items: orderItems.length,
        timestamp: new Date().toISOString(),
      });

      recordOrderOperation('create', 'success');
      logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber });

      // Get order with items
      const orderWithItems = await orderRepository.findById(order.id);
      return orderWithItems!;
    } catch (error) {
      recordOrderOperation('create', 'failure');
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<Order | null> {
    try {
      const order = await orderRepository.findById(orderId);
      
      // Check if user owns this order
      if (order && userId && order.userId !== userId) {
        throw new Error('Unauthorized');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string, userId?: string): Promise<Order | null> {
    try {
      const order = await orderRepository.findByOrderNumber(orderNumber);
      
      // Check if user owns this order
      if (order && userId && order.userId !== userId) {
        throw new Error('Unauthorized');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, limit: number = 10): Promise<Order[]> {
    try {
      return await orderRepository.findByUserId(userId, limit);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search orders
   */
  async searchOrders(query: OrderSearchQuery): Promise<{ orders: Order[]; total: number }> {
    try {
      return await orderRepository.search(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<Order> {
    try {
      const order = await orderRepository.updateStatus(orderId, input.status, {
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
        internalNotes: input.internalNotes,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Publish status changed event
      await publishEvent('order_events', 'order.status.changed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus: order.status,
        newStatus: input.status,
        timestamp: new Date().toISOString(),
      });

      recordOrderOperation('update_status', 'success');
      logger.info('Order status updated', { orderId, status: input.status });

      return order;
    } catch (error) {
      recordOrderOperation('update_status', 'failure');
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId: string, input: UpdatePaymentStatusInput): Promise<Order> {
    try {
      const order = await orderRepository.updatePaymentStatus(
        orderId,
        input.paymentStatus,
        input.paymentTransactionId
      );

      if (!order) {
        throw new Error('Order not found');
      }

      // If payment is successful, move order to confirmed status
      if (input.paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.PENDING) {
        await orderRepository.updateStatus(orderId, OrderStatus.CONFIRMED);
      }

      recordOrderOperation('update_payment', 'success');
      logger.info('Payment status updated', { orderId, paymentStatus: input.paymentStatus });

      return order;
    } catch (error) {
      recordOrderOperation('update_payment', 'failure');
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId?: string): Promise<Order> {
    try {
      const order = await orderRepository.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if user owns this order
      if (userId && order.userId !== userId) {
        throw new Error('Unauthorized');
      }

      // Check if order can be cancelled
      if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel shipped or delivered orders');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Order is already cancelled');
      }

      // Update status to cancelled
      const updatedOrder = await orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);

      // Restore inventory
      const items = await orderItemRepository.findByOrderId(orderId);
      for (const item of items) {
        await productClient.updateStock(item.productId, item.quantity);
      }

      recordOrderOperation('cancel', 'success');
      logger.info('Order cancelled', { orderId });

      return updatedOrder!;
    } catch (error) {
      recordOrderOperation('cancel', 'failure');
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId?: string): Promise<Record<OrderStatus, number>> {
    try {
      return await orderRepository.countByStatus(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent orders (admin)
   */
  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    try {
      return await orderRepository.getRecent(limit);
    } catch (error) {
      throw error;
    }
  }
}
