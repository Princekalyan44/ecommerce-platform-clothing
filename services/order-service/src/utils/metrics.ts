import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const orderOperationsTotal = new client.Counter({
  name: 'order_operations_total',
  help: 'Total number of order operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const cartOperationsTotal = new client.Counter({
  name: 'cart_operations_total',
  help: 'Total number of cart operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const activeOrdersGauge = new client.Gauge({
  name: 'active_orders_total',
  help: 'Total number of active orders',
  registers: [register],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
};

// Helper functions
export const recordOrderOperation = (operation: string, status: 'success' | 'failure'): void => {
  orderOperationsTotal.labels(operation, status).inc();
};

export const recordCartOperation = (operation: string, status: 'success' | 'failure'): void => {
  cartOperationsTotal.labels(operation, status).inc();
};

export const updateActiveOrders = (count: number): void => {
  activeOrdersGauge.set(count);
};
