import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './database/connection';
import { connectRedis } from './utils/redis';
import { connectRabbitMQ } from './utils/rabbitmq';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { metricsMiddleware, register } from './utils/metrics';
import { rateLimiterMiddleware } from './middleware/rate-limiter.middleware';
import { cartRoutes } from './routes/cart.routes';
import { orderRoutes } from './routes/order.routes';
import { healthRoutes } from './routes/health.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging and metrics
app.use(requestLogger);
app.use(metricsMiddleware);

// Start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDatabase();
    logger.info('Connected to PostgreSQL');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('Connected to RabbitMQ');

    // Rate limiting (after Redis is connected)
    app.use(rateLimiterMiddleware(config.rateLimit.max, config.rateLimit.windowMs));

    // Routes
    app.use('/cart', cartRoutes);
    app.use('/orders', orderRoutes);
    app.use('/health', healthRoutes);

    // Prometheus metrics endpoint
    app.get('/metrics', async (_req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    });

    // Error handler (must be last)
    app.use(errorHandler);

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Order Service listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
