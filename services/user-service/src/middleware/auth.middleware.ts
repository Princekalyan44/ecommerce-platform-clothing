import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { logger } from '../utils/logger';

const tokenService = new TokenService();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
    }

    // Verify token
    const payload = await tokenService.verifyAccessToken(token);

    // Attach user to request
    (req as any).user = payload;

    next();
  } catch (error: any) {
    logger.error('Authentication failed', { error: error.message });

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token',
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};
