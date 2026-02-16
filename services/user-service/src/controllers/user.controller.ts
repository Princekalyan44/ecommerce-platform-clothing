import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { validateUpdateProfile, validateChangePassword } from '../validators/user.validator';
import xss from 'xss';

const userService = new UserService();

export class UserController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.user_id;
      const user = await userService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.user_id;

      // Validate input
      const { error, value } = validateUpdateProfile(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Sanitize inputs
      const sanitizedInput = {
        first_name: value.first_name ? xss(value.first_name) : undefined,
        last_name: value.last_name ? xss(value.last_name) : undefined,
        phone: value.phone ? xss(value.phone) : undefined,
      };

      const user = await userService.updateUserProfile(userId, sanitizedInput);

      logger.info('User profile updated', { user_id: userId });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete current user account
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.user_id;
      await userService.deleteUser(userId);

      logger.info('User account deleted', { user_id: userId });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.user_id;

      const { error, value } = validateChangePassword(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      await userService.changePassword(
        userId,
        value.current_password,
        value.new_password
      );

      logger.info('Password changed', { user_id: userId });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      if (error.message === 'Invalid current password') {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }
      next(error);
    }
  }

  /**
   * Get user by ID (admin)
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserProfile(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all users (admin)
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await userService.listUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
