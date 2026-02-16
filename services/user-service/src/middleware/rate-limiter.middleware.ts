import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../utils/redis';
import { Request, Response, NextFunction } from 'express';

const limiterCache = new Map<string, RateLimitRequestHandler>();

export const rateLimiterMiddleware = (max: number = 100, windowMs: number = 3600000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `${max}-${windowMs}`;
    
    if (!limiterCache.has(cacheKey)) {
      const limiter = rateLimit({
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
          prefix: 'rate_limit:',
        }),
        windowMs, // Time window in ms
        max, // Max requests per window
        message: {
          success: false,
          error: 'Too many requests, please try again later',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      limiterCache.set(cacheKey, limiter);
    }
    
    return limiterCache.get(cacheKey)!(req, res, next);
  };
};
