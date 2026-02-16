# Database Schemas

## Overview

This document describes all database schemas for the e-commerce platform. We follow the **Database per Service** pattern, where each microservice owns its database.

## Database Distribution

| Service | Database Type | Database Name |
|---------|---------------|---------------|
| User Service | PostgreSQL | user_db |
| Order Service | PostgreSQL | order_db |
| Payment Service | PostgreSQL | payment_db |
| Inventory Service | PostgreSQL | inventory_db |
| Product Catalog | MongoDB | product_db |
| Review Service | MongoDB | review_db |
| Cart Service | Redis | (key-value store) |
| Session Management | Redis | (key-value store) |

---

## PostgreSQL Schemas

### User Service Database (user_db)

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    role VARCHAR(20) DEFAULT 'customer', -- customer, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### user_addresses
```sql
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'shipping', -- shipping, billing
    is_default BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_addresses_is_default ON user_addresses(is_default);
```

#### oauth_providers
```sql
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, facebook
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_provider ON oauth_providers(provider);
```

#### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked_at);
```

---

### Order Service Database (order_db)

#### orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- card, upi, wallet, cod
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    shipping_address_id UUID NOT NULL,
    billing_address_id UUID NOT NULL,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    CONSTRAINT chk_total_positive CHECK (total >= 0)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

#### order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_id VARCHAR(50),
    size VARCHAR(20),
    color VARCHAR(50),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

#### order_status_history
```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_created_at ON order_status_history(created_at);
```

#### order_addresses
```sql
CREATE TABLE order_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL, -- shipping, billing
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_addresses_order_id ON order_addresses(order_id);
```

---

### Payment Service Database (payment_db)

#### payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, cancelled, refunded
    payment_method VARCHAR(50) NOT NULL, -- card, upi, wallet, cod
    payment_gateway VARCHAR(50), -- stripe, razorpay, paypal
    gateway_payment_id VARCHAR(255),
    gateway_customer_id VARCHAR(255),
    gateway_response JSONB,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    succeeded_at TIMESTAMP,
    failed_at TIMESTAMP,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_gateway_payment_id ON payments(gateway_payment_id);
```

#### payment_methods
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- card, upi, wallet
    is_default BOOLEAN DEFAULT FALSE,
    gateway VARCHAR(50) NOT NULL,
    gateway_payment_method_id VARCHAR(255) NOT NULL,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    upi_id VARCHAR(255),
    wallet_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);
```

#### refunds
```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed
    reason TEXT,
    gateway_refund_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    succeeded_at TIMESTAMP,
    CONSTRAINT chk_refund_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

---

### Inventory Service Database (inventory_db)

#### inventory
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    warehouse_location VARCHAR(100),
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT chk_reserved_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_reserved_lte_quantity CHECK (reserved_quantity <= quantity)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_available_quantity ON inventory(available_quantity);
```

#### inventory_transactions
```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    transaction_type VARCHAR(50) NOT NULL, -- restock, sale, reservation, release, adjustment
    quantity INTEGER NOT NULL,
    reference_id VARCHAR(100), -- order_id or other reference
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_trans_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_trans_created_at ON inventory_transactions(created_at DESC);
```

#### stock_reservations
```sql
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    order_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, expired
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_inventory_id ON stock_reservations(inventory_id);
CREATE INDEX idx_reservations_order_id ON stock_reservations(order_id);
CREATE INDEX idx_reservations_status ON stock_reservations(status);
CREATE INDEX idx_reservations_expires_at ON stock_reservations(expires_at);
```

---

## MongoDB Schemas

### Product Catalog Database (product_db)

#### products collection
```javascript
{
  _id: ObjectId,
  product_id: String, // unique, indexed
  sku: String, // unique, indexed
  name: String,
  slug: String, // unique, indexed, for SEO-friendly URLs
  description: String,
  short_description: String,
  category: {
    id: String,
    name: String,
    slug: String
  },
  subcategory: {
    id: String,
    name: String,
    slug: String
  },
  brand: {
    name: String,
    logo_url: String
  },
  price: {
    regular: Number,
    sale: Number,
    currency: String
  },
  images: [
    {
      url: String,
      alt: String,
      is_primary: Boolean,
      order: Number
    }
  ],
  variants: [
    {
      variant_id: String,
      sku: String,
      size: String,
      color: String,
      price_adjustment: Number,
      image_url: String,
      available: Boolean
    }
  ],
  specifications: {
    material: String,
    care_instructions: String,
    origin: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    }
  },
  tags: [String],
  is_featured: Boolean,
  is_new_arrival: Boolean,
  is_bestseller: Boolean,
  is_on_sale: Boolean,
  status: String, // active, inactive, out_of_stock
  rating: {
    average: Number,
    count: Number
  },
  seo: {
    meta_title: String,
    meta_description: String,
    meta_keywords: [String]
  },
  created_at: ISODate,
  updated_at: ISODate,
  published_at: ISODate
}

// Indexes
db.products.createIndex({ product_id: 1 }, { unique: true });
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ "category.id": 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ is_featured: 1 });
db.products.createIndex({ "rating.average": -1 });
db.products.createIndex({ created_at: -1 });
db.products.createIndex({ name: "text", description: "text", tags: "text" });
```

#### categories collection
```javascript
{
  _id: ObjectId,
  category_id: String, // unique, indexed
  name: String,
  slug: String, // unique, indexed
  description: String,
  parent_id: String, // null for top-level categories
  image_url: String,
  icon_url: String,
  display_order: Number,
  is_active: Boolean,
  product_count: Number,
  seo: {
    meta_title: String,
    meta_description: String
  },
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.categories.createIndex({ category_id: 1 }, { unique: true });
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parent_id: 1 });
db.categories.createIndex({ display_order: 1 });
```

---

### Review Service Database (review_db)

#### reviews collection
```javascript
{
  _id: ObjectId,
  review_id: String, // unique, indexed
  product_id: String, // indexed
  user_id: String, // indexed
  order_id: String,
  rating: Number, // 1-5
  title: String,
  content: String,
  images: [
    {
      url: String,
      alt: String
    }
  ],
  is_verified_purchase: Boolean,
  helpful_count: Number,
  not_helpful_count: Number,
  status: String, // pending, approved, rejected
  moderation_notes: String,
  user_details: {
    name: String,
    avatar_url: String
  },
  created_at: ISODate,
  updated_at: ISODate,
  approved_at: ISODate
}

// Indexes
db.reviews.createIndex({ review_id: 1 }, { unique: true });
db.reviews.createIndex({ product_id: 1 });
db.reviews.createIndex({ user_id: 1 });
db.reviews.createIndex({ status: 1 });
db.reviews.createIndex({ rating: 1 });
db.reviews.createIndex({ created_at: -1 });
db.reviews.createIndex({ helpful_count: -1 });
```

---

## Redis Data Structures

### Cart Service

#### Session Cart (TTL: 7 days)
```
Key: cart:session:{session_id}
Type: Hash
Fields:
  items: JSON array of cart items
  subtotal: Number
  created_at: Timestamp
  updated_at: Timestamp

Example:
HMSET cart:session:abc123 \
  items '[{"product_id":"prod_1","quantity":2,"price":29.99}]' \
  subtotal 59.98 \
  created_at 1709040000 \
  updated_at 1709040000
  
EXPIRE cart:session:abc123 604800
```

#### User Cart (TTL: 30 days)
```
Key: cart:user:{user_id}
Type: Hash
Fields:
  items: JSON array of cart items
  subtotal: Number
  updated_at: Timestamp
```

### Session Management

#### User Session (TTL: 24 hours)
```
Key: session:{session_id}
Type: Hash
Fields:
  user_id: String
  email: String
  role: String
  ip_address: String
  user_agent: String
  created_at: Timestamp
  last_accessed_at: Timestamp

EXPIRE session:{session_id} 86400
```

### Cache Layer

#### Product Cache (TTL: 1 hour)
```
Key: product:{product_id}
Type: String (JSON)
Value: Full product document

EXPIRE product:{product_id} 3600
```

#### Search Results Cache (TTL: 30 minutes)
```
Key: search:{query_hash}
Type: String (JSON)
Value: Array of product IDs

EXPIRE search:{query_hash} 1800
```

---

## Elasticsearch Indexes

### products index
```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2,
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "stop", "snowball"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "product_id": { "type": "keyword" },
      "name": { 
        "type": "text", 
        "analyzer": "product_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { "type": "text", "analyzer": "product_analyzer" },
      "category": { "type": "keyword" },
      "subcategory": { "type": "keyword" },
      "brand": { "type": "keyword" },
      "price": { "type": "float" },
      "rating": { "type": "float" },
      "tags": { "type": "keyword" },
      "is_featured": { "type": "boolean" },
      "is_on_sale": { "type": "boolean" },
      "status": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

---

## Data Consistency Patterns

### Eventual Consistency
- Product availability updates across services
- Review rating aggregation to product catalog
- Order status updates to notification service

### Strong Consistency
- Payment transactions
- Inventory reservations
- Order creation

### Saga Pattern (Distributed Transactions)
Checkout Flow:
1. Reserve Inventory (Inventory Service)
2. Process Payment (Payment Service)
3. Create Order (Order Service)
4. Send Notification (Notification Service)

Compensation on failure:
- Release inventory reservation
- Refund payment
- Cancel order

---

## Backup & Recovery

### PostgreSQL
- **Automated Backups**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Point-in-Time Recovery**: 15-minute granularity
- **Replication**: Asynchronous streaming to 2 replicas

### MongoDB
- **Automated Backups**: Daily snapshots
- **Retention**: 30 days
- **Replica Set**: 3-node cluster (1 primary, 2 secondaries)
- **Oplog**: 24-hour window

### Redis
- **Persistence**: AOF (Append-Only File) with fsync every second
- **Snapshots**: Every 6 hours
- **Replication**: Master-replica setup

---

## Performance Optimization

### Database Indexing Strategy
- Index frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries
- Covering indexes to avoid table lookups

### Query Optimization
- Use prepared statements
- Implement connection pooling (max 20 connections per service)
- Paginate large result sets
- Use database-level aggregations

### Caching Strategy
- Cache read-heavy, infrequently changing data
- Implement cache-aside pattern
- Use cache invalidation on writes
- Set appropriate TTLs based on data volatility

---

This schema design supports high scalability, data consistency, and optimal performance for the e-commerce platform.
