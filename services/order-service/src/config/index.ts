import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8003', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    name: process.env.DB_NAME || 'order_db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password123',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'password123',
    db: parseInt(process.env.REDIS_DB || '2', 10),
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password123@localhost:5672',
  },
  
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002',
  },
  
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '600', 10),
    cartTtl: parseInt(process.env.CART_TTL || '3600', 10),
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  },
};
