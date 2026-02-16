# Product Catalog Service

## Overview
The Product Catalog Service is a comprehensive microservice for managing products, categories, search, and inventory in the e-commerce platform.

## Features

### ✅ Product Management
- Full CRUD operations for products
- Product variants (sizes, colors, SKUs)
- Image management support
- Inventory tracking
- Low stock alerts
- SEO optimization (slugs, meta tags)
- Analytics (view counts, purchase tracking)

### ✅ Category Management
- Hierarchical categories
- Category CRUD operations
- Subcategory support
- Product count tracking

### ✅ Advanced Search
- Full-text search with Elasticsearch
- Filter by price, brand, tags, stock
- Multiple sort options (relevance, price, rating, popularity, newest)
- Search autocomplete/suggestions
- Category-based filtering

### ✅ Reviews & Ratings
- Star ratings (1-5)
- Written reviews
- Verified purchase badges
- Average rating calculation

### ✅ Caching
- Redis-based caching
- Featured products cache
- Category products cache
- Individual product cache
- Smart cache invalidation

### ✅ Production Ready
- Health checks
- Prometheus metrics
- Rate limiting
- Input validation
- XSS protection
- Error handling
- Request logging

## Tech Stack

- **Runtime**: Node.js 18 with TypeScript
- **Framework**: Express.js
- **Databases**: 
  - MongoDB (Product data)
  - Elasticsearch (Search)
  - Redis (Caching)
- **Validation**: Joi
- **Security**: Helmet, CORS, XSS protection
- **Monitoring**: Prometheus + Grafana

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Product Catalog Service (8002)         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Products  │  │Categories│  │  Health  │    │
│  │  Routes  │  │  Routes  │  │  Routes  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │            │
│  ┌────▼─────────────▼─────────────▼─────┐    │
│  │         Controllers Layer            │    │
│  └────┬─────────────┬─────────────┬─────┘    │
│       │             │             │            │
│  ┌────▼─────┐  ┌───▼────┐  ┌────▼─────┐    │
│  │ Product  │  │Category│  │  Cache   │    │
│  │ Service  │  │Service │  │ Service  │    │
│  └────┬─────┘  └───┬────┘  └────┬─────┘    │
│       │             │             │            │
│  ┌────▼─────────────▼─────────────▼─────┐    │
│  │      Repositories Layer              │    │
│  └────┬─────────────┬─────────────┬─────┘    │
│       │             │             │            │
└───────┼─────────────┼─────────────┼───────────┘
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ MongoDB │  │Elastic  │  │  Redis  │
   │         │  │ search  │  │         │
   └─────────┘  └─────────┘  └─────────┘
```

## API Endpoints

### Products

#### Public Endpoints
```
GET    /products                    - List all products
GET    /products/search             - Full-text search
GET    /products/suggestions?q=     - Search autocomplete
GET    /products/featured           - Get featured products
GET    /products/category/:id       - Products by category
GET    /products/slug/:slug         - Get by slug (SEO)
GET    /products/:id                - Get by ID
```

#### Protected Endpoints (Require Auth)
```
POST   /products                    - Create product
PUT    /products/:id                - Update product
DELETE /products/:id                - Delete product
POST   /products/:id/reviews        - Add review
PATCH  /products/:id/stock          - Update stock
```

#### Admin Endpoints
```
GET    /products/admin/low-stock    - Low stock alerts
```

### Categories

#### Public Endpoints
```
GET    /categories                  - List all categories
GET    /categories/top-level        - Root categories only
GET    /categories/:id/subcategories - Get subcategories
GET    /categories/slug/:slug       - Get by slug
GET    /categories/:id              - Get by ID
```

#### Admin Endpoints
```
POST   /categories                  - Create category
PUT    /categories/:id              - Update category
DELETE /categories/:id              - Delete category
```

### Health & Metrics
```
GET    /health                      - Service health check
GET    /metrics                     - Prometheus metrics
```

## Environment Variables

```env
NODE_ENV=development
PORT=8002

# MongoDB
MONGODB_URI=mongodb://admin:password123@mongodb:27017/product_catalog?authSource=admin

# Elasticsearch
ELASTICSEARCH_NODE=http://elasticsearch:9200

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=password123
REDIS_DB=1

# CORS
CORS_ORIGINS=http://localhost:3000

# Cache TTL (seconds)
CACHE_TTL=600
CACHE_POPULAR_PRODUCTS_TTL=300

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=3600000
```

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

## Docker

```bash
# Build image
docker build -t product-catalog-service .

# Run container
docker run -p 8002:8002 \
  -e MONGODB_URI=mongodb://... \
  -e ELASTICSEARCH_NODE=http://... \
  -e REDIS_HOST=redis \
  product-catalog-service
```

## Testing

### Health Check
```bash
curl http://localhost:8002/health
```

### Create Category
```bash
curl -X POST http://localhost:8002/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mens Clothing",
    "description": "Clothing for men",
    "order": 1
  }'
```

### Create Product
```bash
curl -X POST http://localhost:8002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic T-Shirt",
    "description": "Premium cotton t-shirt",
    "categoryId": "CATEGORY_ID",
    "brand": "Premium Basics",
    "basePrice": 29.99,
    "totalStock": 100,
    "isFeatured": true
  }'
```

### Search Products
```bash
# Basic search
curl "http://localhost:8002/products/search?query=shirt"

# With filters
curl "http://localhost:8002/products/search?query=shirt&minPrice=20&maxPrice=50&sortBy=price_asc"

# By category
curl "http://localhost:8002/products/search?categoryId=CATEGORY_ID&inStock=true"
```

### Add Review
```bash
curl -X POST http://localhost:8002/products/PRODUCT_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userName": "John Doe",
    "rating": 5,
    "title": "Great product!",
    "comment": "Love it!",
    "verifiedPurchase": true
  }'
```

## Performance

### Caching Strategy
- **Individual Products**: 10 minutes TTL
- **Featured Products**: 5 minutes TTL
- **Category Products**: 10 minutes TTL
- **Search Results**: Not cached (real-time)

### Database Indexes
- MongoDB: slug, categoryId, isFeatured, isActive, createdAt
- Elasticsearch: Full-text search on name, description, brand, tags

### Rate Limiting
- Default: 1000 requests per hour per IP
- Configurable per endpoint

## Monitoring

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T17:00:00.000Z",
  "service": "product-catalog-service",
  "version": "1.0.0",
  "checks": {
    "mongodb": "healthy",
    "elasticsearch": "healthy",
    "redis": "healthy"
  }
}
```

### Prometheus Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `product_operations_total` - Product operations count
- `search_queries_total` - Search queries count

## Development

### Project Structure
```
src/
├── config/              # Configuration
├── controllers/         # Request handlers
├── database/           # DB connections
├── middleware/         # Express middleware
├── models/             # MongoDB models
├── repositories/       # Data access layer
├── routes/             # API routes
├── services/           # Business logic
├── types/              # TypeScript types
├── utils/              # Utilities
├── validators/         # Input validation
└── server.ts           # Entry point
```

### Adding a New Endpoint

1. Define types in `types/index.ts`
2. Add validation in `validators/`
3. Create service method in `services/`
4. Add controller method in `controllers/`
5. Register route in `routes/`

## Production Considerations

### Security
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS protection
- ⚠️ Authentication (to be added)
- ⚠️ Authorization (to be added)

### Scalability
- ✅ Stateless design
- ✅ Redis caching
- ✅ Elasticsearch for search
- ✅ Horizontal scaling ready
- ⚠️ Load balancer (to be added)

### Reliability
- ✅ Health checks
- ✅ Error handling
- ✅ Request logging
- ✅ Graceful shutdown
- ⚠️ Circuit breakers (to be added)
- ⚠️ Retry logic (to be added)

## License
MIT
