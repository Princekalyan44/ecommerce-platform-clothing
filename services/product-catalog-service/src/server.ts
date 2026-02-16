import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectMongoDB } from './database/mongodb';
import { connectElasticsearch, createProductIndex } from './database/elasticsearch';
import { connectRedis } from './utils/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { metricsMiddleware, register } from './utils/metrics';
import { rateLimiterMiddleware } from './middleware/rate-limiter.middleware';
import { productRoutes } from './routes/product.routes';
import { categoryRoutes } from './routes/category.routes';
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

// Rate limiting
app.use(rateLimiterMiddleware(config.rateLimit.max, config.rateLimit.windowMs));

// Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
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

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    logger.info('Connected to MongoDB');

    // Connect to Elasticsearch
    await connectElasticsearch();
    logger.info('Connected to Elasticsearch');

    // Create Elasticsearch index
    await createProductIndex();

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Product Catalog Service listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
