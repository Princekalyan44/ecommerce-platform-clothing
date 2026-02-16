import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../utils/redis';

export const rateLimiterMiddleware = (max: number, windowMs: number) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        return await redisClient.sendCommand(args);
      },
    }),
    windowMs,
    max,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};
