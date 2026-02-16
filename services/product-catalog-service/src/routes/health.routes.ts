import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { elasticsearchClient } from '../database/elasticsearch';
import { redisClient } from '../utils/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'product-catalog-service',
    version: '1.0.0',
    checks: {
      mongodb: 'unknown',
      elasticsearch: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = 'healthy';
    } else {
      health.checks.mongodb = 'unhealthy';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.mongodb = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Check Elasticsearch
    await elasticsearchClient.ping();
    health.checks.elasticsearch = 'healthy';
  } catch (error) {
    health.checks.elasticsearch = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export { router as healthRoutes };
