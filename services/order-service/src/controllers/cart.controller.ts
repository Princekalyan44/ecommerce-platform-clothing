import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import {
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveFromCart,
} from '../validators/cart.validator';
import { logger } from '../utils/logger';

const cartService = new CartService();

export class CartController {
  /**
   * Get user's cart
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      const cart = await cartService.getCart(userId);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add item to cart
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      const { error, value } = validateAddToCart(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const cart = await cartService.addItem(userId, value);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error: any) {
      if (error.message === 'Product not found' || error.message === 'Insufficient stock') {
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
   * Update cart item
   */
  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      const { error, value } = validateUpdateCartItem(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const cart = await cartService.updateItem(userId, value);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error: any) {
      if (error.message === 'Item not found in cart' || error.message === 'Insufficient stock') {
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
   * Remove item from cart
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      const { error, value } = validateRemoveFromCart(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const cart = await cartService.removeItem(userId, value);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cart
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      await cartService.clearCart(userId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate cart
   */
  async validateCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId;
      const validation = await cartService.validateCart(userId);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }
}
