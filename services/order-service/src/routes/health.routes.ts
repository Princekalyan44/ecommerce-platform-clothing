import { Router, Request, Response } from 'express';
import { sequelize } from '../database/connection';
import { redisClient } from '../utils/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check PostgreSQL
    let dbHealthy = false;
    try {
      await sequelize.authenticate();
      dbHealthy = true;
    } catch (error) {
      dbHealthy = false;
    }

    // Check Redis
    let redisHealthy = false;
    try {
      await redisClient.ping();
      redisHealthy = true;
    } catch (error) {
      redisHealthy = false;
    }

    const isHealthy = dbHealthy && redisHealthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      version: '1.0.0',
      checks: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-service',
      error: 'Health check failed',
    });
  }
});

export const healthRoutes = router;
