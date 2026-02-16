import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

export const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
});

redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err });
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
};
