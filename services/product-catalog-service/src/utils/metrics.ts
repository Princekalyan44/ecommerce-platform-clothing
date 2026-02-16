import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const register = new Registry();

// Collect default metrics
collectDefaultMetrics({ register });

// HTTP request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request counter
const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Product operations counter
const productOperationsCounter = new Counter({
  name: 'product_operations_total',
  help: 'Total number of product operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// Search operations counter
const searchOperationsCounter = new Counter({
  name: 'search_operations_total',
  help: 'Total number of search operations',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
};

export const recordProductOperation = (operation: string, status: 'success' | 'failure') => {
  productOperationsCounter.labels(operation, status).inc();
};

export const recordSearchOperation = (type: string, status: 'success' | 'failure') => {
  searchOperationsCounter.labels(type, status).inc();
};
