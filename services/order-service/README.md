# Order Service

Order management microservice for the e-commerce platform.

## Features

### Shopping Cart
- Add items to cart
- Update item quantities
- Remove items from cart
- Clear cart
- Cart validation (stock availability)
- Auto-expiration (7 days)
- Redis caching for performance

### Order Management
- Create orders from cart
- Order tracking
- Status management (pending → confirmed → processing → shipped → delivered)
- Payment status tracking
- Order cancellation
- Order search and filtering
- Order statistics

### Event Publishing
- Order created events
- Order status changed events
- Inventory reservation events
- Published to RabbitMQ

## Technology Stack

- **Runtime**: Node.js 18 with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (orders, order_items, carts)
- **Cache**: Redis (cart sessions)
- **Message Queue**: RabbitMQ (event publishing)
- **ORM**: Sequelize
- **Validation**: Joi
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Security**: Helmet, CORS, Rate Limiting

## Database Schema

### Tables

#### `carts`
- `id` (UUID, PK)
- `user_id` (UUID, unique)
- `items` (JSONB array)
- `subtotal` (decimal)
- `expires_at` (timestamp)
- `created_at`, `updated_at`

#### `orders`
- `id` (UUID, PK)
- `order_number` (string, unique)
- `user_id` (UUID)
- `status` (enum: pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- `payment_status` (enum: pending, paid, failed, refunded)
- `subtotal`, `tax`, `shipping_cost`, `discount`, `total` (decimals)
- `shipping_address`, `billing_address` (JSONB)
- `payment_method`, `payment_transaction_id`
- `tracking_number`, `carrier`
- `customer_notes`, `internal_notes`
- Timestamps: `order_date`, `paid_at`, `shipped_at`, `delivered_at`, `cancelled_at`

#### `order_items`
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders)
- `product_id`, `product_name`, `product_image`
- `variant_sku`, `size`, `color`
- `quantity`, `unit_price`, `subtotal`, `discount`, `total`

## API Endpoints

### Cart Management

#### Get Cart
```bash
GET /cart/:userId
```

#### Add Item to Cart
```bash
POST /cart/:userId/items
Content-Type: application/json

{
  "productId": "uuid",
  "variantSku": "SKU-001",
  "quantity": 2
}
```

#### Update Cart Item
```bash
PUT /cart/:userId/items
Content-Type: application/json

{
  "productId": "uuid",
  "variantSku": "SKU-001",
  "quantity": 5
}
```

#### Remove Cart Item
```bash
DELETE /cart/:userId/items
Content-Type: application/json

{
  "productId": "uuid",
  "variantSku": "SKU-001"
}
```

#### Clear Cart
```bash
DELETE /cart/:userId
```

#### Validate Cart
```bash
GET /cart/:userId/validate
```

### Order Management

#### Create Order
```bash
POST /orders
Content-Type: application/json

{
  "userId": "uuid",
  "shippingAddress": {
    "fullName": "John Doe",
    "addressLine1": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India",
    "phone": "+919876543210"
  },
  "paymentMethod": "credit_card"
}
```

#### Get Order by ID
```bash
GET /orders/:id?userId=uuid
```

#### Get Order by Order Number
```bash
GET /orders/number/:orderNumber?userId=uuid
```

#### Get User Orders
```bash
GET /orders/user/:userId?limit=10
```

#### Search Orders
```bash
GET /orders/search?userId=uuid&status=pending&page=1&limit=10
```

#### Update Order Status
```bash
PATCH /orders/:id/status
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRACK123",
  "carrier": "FedEx"
}
```

#### Update Payment Status
```bash
PATCH /orders/:id/payment
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentTransactionId": "TXN123456"
}
```

#### Cancel Order
```bash
POST /orders/:id/cancel?userId=uuid
```

#### Get Order Statistics
```bash
GET /orders/stats?userId=uuid
```

#### Get Recent Orders (Admin)
```bash
GET /orders/recent?limit=10
```

### System

#### Health Check
```bash
GET /health
```

#### Metrics (Prometheus)
```bash
GET /metrics
```

## Environment Variables

```env
NODE_ENV=development
PORT=8003

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=order_db
DB_USER=admin
DB_PASSWORD=password123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password123
REDIS_DB=2

# RabbitMQ
RABBITMQ_URL=amqp://admin:password123@localhost:5672

# Service URLs
USER_SERVICE_URL=http://localhost:8001
PRODUCT_SERVICE_URL=http://localhost:8002

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Running Locally

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d order-service
```

## Testing the API

### Run Test Script
```bash
chmod +x test-api.sh
./test-api.sh
```

### Manual Tests with UUIDs
```bash
# Use proper UUIDs
USER_ID="550e8400-e29b-41d4-a716-446655440000"

# Get cart
curl http://localhost:8003/cart/$USER_ID

# Get order stats
curl "http://localhost:8003/orders/stats?userId=$USER_ID"
```

## Integration with Other Services

### Product Catalog Service
- Validates product availability
- Checks stock levels
- Updates inventory on order creation
- Fetches product details for cart items

### User Service
- (Future) Validate user exists
- (Future) Get user shipping addresses

## Event Schema

### Order Created Event
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-202602-ABC123",
  "userId": "uuid",
  "total": 99.99,
  "items": 3,
  "timestamp": "2026-02-16T17:45:00Z"
}
```

### Order Status Changed Event
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-202602-ABC123",
  "oldStatus": "pending",
  "newStatus": "confirmed",
  "timestamp": "2026-02-16T17:45:00Z"
}
```

## Performance Optimizations

- Cart data cached in Redis (7-day TTL)
- Database indexes on frequently queried fields
- Pagination for list endpoints
- Connection pooling for PostgreSQL
- Rate limiting to prevent abuse

## Monitoring

- Health check endpoint for Kubernetes liveness/readiness probes
- Prometheus metrics for request duration, error rates, and business metrics
- Structured JSON logging with Winston
- Request/response logging middleware

## Security

- Helmet.js for HTTP headers security
- CORS configuration
- Rate limiting (Redis-backed)
- Input validation with Joi
- UUID validation
- SQL injection protection (Sequelize ORM)

## Future Enhancements

- [ ] Order webhooks for external systems
- [ ] Advanced order search (Elasticsearch)
- [ ] Order export (CSV, PDF)
- [ ] Scheduled cart cleanup job
- [ ] Order notifications (email, SMS)
- [ ] Return/refund management
- [ ] Order invoice generation
- [ ] Multi-currency support
- [ ] Discount codes/coupons
- [ ] Gift wrapping options
