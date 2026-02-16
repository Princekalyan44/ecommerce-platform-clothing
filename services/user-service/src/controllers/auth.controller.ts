import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { RegisterInput, LoginInput } from '../types';
import { validateRegister, validateLogin } from '../validators/auth.validator';
import xss from 'xss';
import validator from 'validator';

const authService = new AuthService();

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { error, value } = validateRegister(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Sanitize inputs
      const sanitizedInput: RegisterInput = {
        email: validator.normalizeEmail(value.email) || value.email,
        password: value.password,
        first_name: xss(value.first_name),
        last_name: xss(value.last_name),
      };

      // Register user
      const result = await authService.register(sanitizedInput);

      // Log registration
      logger.info('User registered successfully', {
        user_id: result.user.id,
        email: result.user.email,
        method: 'email',
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message });
      
      if (error.message === 'User already exists') {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { error, value } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Sanitize email
      const sanitizedInput: LoginInput = {
        email: validator.normalizeEmail(value.email) || value.email,
        password: value.password,
      };

      // Login
      const result = await authService.login(sanitizedInput);

      // Log login
      logger.info('User logged in successfully', {
        user_id: result.user.id,
        email: result.user.email,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Login failed', { error: error.message });

      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const result = await authService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
        });
      }

      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const userId = (req as any).user?.user_id;

      if (refresh_token) {
        await authService.revokeRefreshToken(refresh_token);
      }

      logger.info('User logged out', { user_id: userId });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth callback
   */
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
        });
      }

      const result = await authService.handleOAuthLogin(user, 'google');

      logger.info('Google OAuth login successful', {
        user_id: result.user.id,
        email: result.user.email,
      });

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
        `access_token=${result.tokens.access_token}&` +
        `refresh_token=${result.tokens.refresh_token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Facebook OAuth callback
   */
  async facebookCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
        });
      }

      const result = await authService.handleOAuthLogin(user, 'facebook');

      logger.info('Facebook OAuth login successful', {
        user_id: result.user.id,
        email: result.user.email,
      });

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
        `access_token=${result.tokens.access_token}&` +
        `refresh_token=${result.tokens.refresh_token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }
}
