import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { validateRegister, validateLogin } from '../validators/auth.validator';
import { recordAuthEvent } from '../utils/metrics';
import xss from 'xss';

const authService = new AuthService();

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const { error, value } = validateRegister(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      // Sanitize inputs
      const sanitizedInput = {
        email: xss(value.email.toLowerCase()),
        password: value.password,
        first_name: xss(value.first_name),
        last_name: xss(value.last_name),
      };

      // Register user
      const result = await authService.register(sanitizedInput);

      recordAuthEvent('register', 'success');
      logger.info('User registered successfully', { email: sanitizedInput.email });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        recordAuthEvent('register', 'failure');
        res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const { error, value } = validateLogin(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const sanitizedInput = {
        email: xss(value.email.toLowerCase()),
        password: value.password,
      };

      // Login
      const result = await authService.login(sanitizedInput);

      recordAuthEvent('login', 'success');
      logger.info('User logged in successfully', { email: sanitizedInput.email });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      recordAuthEvent('login', 'failure');
      if (error.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await authService.refreshTokens(refresh_token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (
        error.message === 'Invalid refresh token' ||
        error.message === 'Token has been revoked'
      ) {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      await authService.logout(refresh_token);

      logger.info('User logged out successfully');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      if (error.message === 'Invalid refresh token') {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Google OAuth callback
   */
  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oauthUser = req.user as any;

      const result = await authService.oauthLogin('google', oauthUser);

      recordAuthEvent('oauth_google', 'success');
      logger.info('User logged in via Google OAuth', { email: oauthUser.email });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?access_token=${result.tokens.access_token}&refresh_token=${result.tokens.refresh_token}`
      );
    } catch (error) {
      recordAuthEvent('oauth_google', 'failure');
      next(error);
    }
  }

  /**
   * Facebook OAuth callback
   */
  async facebookCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oauthUser = req.user as any;

      const result = await authService.oauthLogin('facebook', oauthUser);

      recordAuthEvent('oauth_facebook', 'success');
      logger.info('User logged in via Facebook OAuth', { email: oauthUser.email });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?access_token=${result.tokens.access_token}&refresh_token=${result.tokens.refresh_token}`
      );
    } catch (error) {
      recordAuthEvent('oauth_facebook', 'failure');
      next(error);
    }
  }
}
