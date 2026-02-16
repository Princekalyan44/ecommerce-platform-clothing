import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../utils/redis';

export const rateLimiterMiddleware = (max: number = 100, windowMs: number = 3600000) => {
  return rateLimit({
    store: new RedisStore({
      // @ts-ignore - Redis client compatibility
      client: redisClient,
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
};
