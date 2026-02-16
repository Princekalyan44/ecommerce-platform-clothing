import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateUpdatePaymentStatus,
  validateOrderSearch,
} from '../validators/order.validator';

const orderService = new OrderService();

export class OrderController {
  /**
   * Create order from cart
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateCreateOrder(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const order = await orderService.createOrder(value);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Cart is empty' || error.message.includes('out of stock')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string | undefined;

      const order = await orderService.getOrderById(id, userId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        res.status(403).json({
          success: false,
          error: 'Unauthorized access',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const userId = req.query.userId as string | undefined;

      const order = await orderService.getOrderByNumber(orderNumber, userId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        res.status(403).json({
          success: false,
          error: 'Unauthorized access',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const orders = await orderService.getUserOrders(userId, limit);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search orders
   */
  async searchOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateOrderSearch(req.query);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const result = await orderService.searchOrders(value);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: {
          page: value.page,
          limit: value.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / value.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateUpdateOrderStatus(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const order = await orderService.updateOrderStatus(id, value);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateUpdatePaymentStatus(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const order = await orderService.updatePaymentStatus(id, value);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string | undefined;

      const order = await orderService.cancelOrder(id, userId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }
      if (
        error.message === 'Unauthorized' ||
        error.message.includes('Cannot cancel')
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId as string | undefined;
      const stats = await orderService.getOrderStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent orders (admin)
   */
  async getRecentOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await orderService.getRecentOrders(limit);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
}
