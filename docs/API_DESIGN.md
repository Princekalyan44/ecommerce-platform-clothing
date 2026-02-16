# API Design & Documentation

## Base URL
```
Development: https://dev-api.yourstore.com/v1
Staging: https://staging-api.yourstore.com/v1
Production: https://api.yourstore.com/v1
```

## Authentication

All API requests (except public endpoints) require authentication via JWT Bearer token.

```http
Authorization: Bearer <access_token>
```

### Token Structure
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2026-02-16T13:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": "2026-02-16T13:30:00Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2026-02-16T13:30:00Z"
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

---

## User Service APIs

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+911234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "customer"
    },
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 900
    }
  },
  "message": "Registration successful"
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "customer"
    },
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 900
    }
  },
  "message": "Login successful"
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "expires_in": 900
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### User Profile

#### Get Current User
```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+911234567890",
    "role": "customer",
    "is_email_verified": true,
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

#### Update Profile
```http
PUT /users/me
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+911234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+911234567890"
  },
  "message": "Profile updated successfully"
}
```

### User Addresses

#### Get Addresses
```http
GET /users/me/addresses
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "address_type": "shipping",
      "is_default": true,
      "full_name": "John Doe",
      "phone": "+911234567890",
      "address_line1": "123 Main Street",
      "address_line2": "Apt 4B",
      "city": "Bangalore",
      "state": "Karnataka",
      "postal_code": "560001",
      "country": "India"
    }
  ]
}
```

#### Add Address
```http
POST /users/me/addresses
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "address_type": "shipping",
  "is_default": true,
  "full_name": "John Doe",
  "phone": "+911234567890",
  "address_line1": "123 Main Street",
  "address_line2": "Apt 4B",
  "city": "Bangalore",
  "state": "Karnataka",
  "postal_code": "560001",
  "country": "India"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "address_type": "shipping",
    "is_default": true,
    "full_name": "John Doe",
    "address_line1": "123 Main Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "postal_code": "560001",
    "country": "India"
  },
  "message": "Address added successfully"
}
```

---

## Product Catalog APIs

### Products

#### Get Products (with filters)
```http
GET /products?category=shirts&page=1&limit=20&sort=price_asc
```

**Query Parameters:**
- `category` (optional): Category slug
- `subcategory` (optional): Subcategory slug
- `search` (optional): Search query
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price
- `brand` (optional): Brand name
- `size` (optional): Size filter
- `color` (optional): Color filter
- `is_on_sale` (optional): boolean
- `sort` (optional): `price_asc`, `price_desc`, `newest`, `popular`, `rating`
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "product_id": "prod_123",
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-tshirt",
      "description": "Comfortable 100% cotton t-shirt",
      "category": {
        "id": "cat_1",
        "name": "T-Shirts",
        "slug": "tshirts"
      },
      "price": {
        "regular": 29.99,
        "sale": 24.99,
        "currency": "USD"
      },
      "images": [
        {
          "url": "https://cdn.example.com/tshirt-1.jpg",
          "alt": "White cotton t-shirt",
          "is_primary": true
        }
      ],
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "is_on_sale": true,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### Get Product by ID
```http
GET /products/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product_id": "prod_123",
    "sku": "TSH-001",
    "name": "Classic Cotton T-Shirt",
    "slug": "classic-cotton-tshirt",
    "description": "Comfortable 100% cotton t-shirt perfect for everyday wear",
    "short_description": "Comfortable cotton tee",
    "category": {
      "id": "cat_1",
      "name": "T-Shirts",
      "slug": "tshirts"
    },
    "brand": {
      "name": "ComfortWear",
      "logo_url": "https://cdn.example.com/brand-logo.png"
    },
    "price": {
      "regular": 29.99,
      "sale": 24.99,
      "currency": "USD"
    },
    "images": [
      {
        "url": "https://cdn.example.com/tshirt-1.jpg",
        "alt": "White cotton t-shirt front",
        "is_primary": true,
        "order": 1
      },
      {
        "url": "https://cdn.example.com/tshirt-2.jpg",
        "alt": "White cotton t-shirt back",
        "is_primary": false,
        "order": 2
      }
    ],
    "variants": [
      {
        "variant_id": "var_1",
        "sku": "TSH-001-S-WHT",
        "size": "S",
        "color": "White",
        "available": true
      },
      {
        "variant_id": "var_2",
        "sku": "TSH-001-M-WHT",
        "size": "M",
        "color": "White",
        "available": true
      }
    ],
    "specifications": {
      "material": "100% Cotton",
      "care_instructions": "Machine wash cold",
      "origin": "Made in India",
      "weight": "200g"
    },
    "tags": ["casual", "cotton", "summer"],
    "rating": {
      "average": 4.5,
      "count": 128
    },
    "is_on_sale": true,
    "status": "active"
  }
}
```

### Categories

#### Get All Categories
```http
GET /categories
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "category_id": "cat_1",
      "name": "Men's Clothing",
      "slug": "mens-clothing",
      "image_url": "https://cdn.example.com/category-men.jpg",
      "product_count": 450,
      "subcategories": [
        {
          "category_id": "cat_1_1",
          "name": "T-Shirts",
          "slug": "tshirts",
          "product_count": 150
        },
        {
          "category_id": "cat_1_2",
          "name": "Shirts",
          "slug": "shirts",
          "product_count": 120
        }
      ]
    }
  ]
}
```

---

## Cart APIs

#### Get Cart
```http
GET /cart
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product_id": "prod_123",
        "variant_id": "var_1",
        "name": "Classic Cotton T-Shirt",
        "size": "M",
        "color": "White",
        "quantity": 2,
        "unit_price": 24.99,
        "total_price": 49.98,
        "image_url": "https://cdn.example.com/tshirt-1.jpg"
      }
    ],
    "summary": {
      "subtotal": 49.98,
      "tax": 4.50,
      "shipping": 5.99,
      "discount": 0.00,
      "total": 60.47,
      "currency": "USD"
    },
    "item_count": 2
  }
}
```

#### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "product_id": "prod_123",
  "variant_id": "var_1",
  "quantity": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "product_id": "prod_123",
    "variant_id": "var_1",
    "quantity": 2,
    "unit_price": 24.99,
    "total_price": 49.98
  },
  "message": "Item added to cart"
}
```

#### Update Cart Item
```http
PUT /cart/items/:item_id
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product_id": "prod_123",
    "quantity": 3,
    "total_price": 74.97
  },
  "message": "Cart updated"
}
```

#### Remove Item from Cart
```http
DELETE /cart/items/:item_id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

#### Clear Cart
```http
DELETE /cart
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Checkout APIs

#### Initialize Checkout
```http
POST /checkout/initialize
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "checkout_session_id": "cs_123",
    "cart": {
      "items": [],
      "summary": {}
    },
    "available_shipping_methods": [
      {
        "id": "standard",
        "name": "Standard Shipping",
        "cost": 5.99,
        "estimated_days": "5-7"
      },
      {
        "id": "express",
        "name": "Express Shipping",
        "cost": 12.99,
        "estimated_days": "2-3"
      }
    ]
  }
}
```

#### Complete Checkout
```http
POST /checkout/complete
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "checkout_session_id": "cs_123",
  "shipping_address_id": "addr_1",
  "billing_address_id": "addr_1",
  "shipping_method": "standard",
  "payment_method_id": "pm_123",
  "promo_code": "SAVE10"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": "ord_123",
    "order_number": "ORD-2026-001",
    "status": "confirmed",
    "total": 60.47,
    "payment_status": "paid"
  },
  "message": "Order placed successfully"
}
```

---

## Payment APIs

#### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 60.47,
  "currency": "USD",
  "payment_method": "card"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_123",
    "client_secret": "pi_123_secret_xyz",
    "amount": 60.47,
    "currency": "USD",
    "status": "requires_payment_method"
  }
}
```

#### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "payment_intent_id": "pi_123",
  "payment_method_id": "pm_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_123",
    "status": "succeeded",
    "amount": 60.47,
    "currency": "USD"
  },
  "message": "Payment successful"
}
```

---

## Order APIs

#### Get Orders
```http
GET /orders?page=1&limit=10
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ord_123",
      "order_number": "ORD-2026-001",
      "status": "shipped",
      "total": 60.47,
      "currency": "USD",
      "item_count": 2,
      "created_at": "2026-02-10T10:00:00Z",
      "tracking_number": "TRK123456"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

#### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ord_123",
    "order_number": "ORD-2026-001",
    "status": "shipped",
    "items": [
      {
        "product_id": "prod_123",
        "name": "Classic Cotton T-Shirt",
        "size": "M",
        "color": "White",
        "quantity": 2,
        "unit_price": 24.99,
        "total_price": 49.98,
        "image_url": "https://cdn.example.com/tshirt-1.jpg"
      }
    ],
    "summary": {
      "subtotal": 49.98,
      "tax": 4.50,
      "shipping": 5.99,
      "discount": 0.00,
      "total": 60.47,
      "currency": "USD"
    },
    "shipping_address": {
      "full_name": "John Doe",
      "address_line1": "123 Main Street",
      "city": "Bangalore",
      "state": "Karnataka",
      "postal_code": "560001",
      "country": "India"
    },
    "payment_method": "card",
    "payment_status": "paid",
    "tracking_number": "TRK123456",
    "created_at": "2026-02-10T10:00:00Z",
    "shipped_at": "2026-02-11T15:00:00Z"
  }
}
```

---

## Review APIs

#### Get Product Reviews
```http
GET /products/:product_id/reviews?page=1&limit=10&sort=helpful
```

**Query Parameters:**
- `rating` (optional): Filter by rating (1-5)
- `sort` (optional): `newest`, `helpful`, `rating_high`, `rating_low`
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "review_id": "rev_123",
      "product_id": "prod_123",
      "user": {
        "name": "John D.",
        "avatar_url": "https://cdn.example.com/avatar.jpg"
      },
      "rating": 5,
      "title": "Excellent quality!",
      "content": "Very comfortable and fits perfectly. Highly recommended!",
      "is_verified_purchase": true,
      "helpful_count": 24,
      "created_at": "2026-02-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 128,
    "total_pages": 13
  },
  "rating_summary": {
    "average": 4.5,
    "count": 128,
    "distribution": {
      "5": 80,
      "4": 30,
      "3": 10,
      "2": 5,
      "1": 3
    }
  }
}
```

#### Submit Review
```http
POST /products/:product_id/reviews
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "order_id": "ord_123",
  "rating": 5,
  "title": "Excellent quality!",
  "content": "Very comfortable and fits perfectly. Highly recommended!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "review_id": "rev_123",
    "rating": 5,
    "title": "Excellent quality!",
    "status": "pending"
  },
  "message": "Review submitted for moderation"
}
```

---

## Rate Limiting

| Endpoint Type | Rate Limit |
|---------------|------------|
| Public APIs | 60 requests/minute |
| Authenticated APIs | 100 requests/minute |
| Search APIs | 30 requests/minute |
| Payment APIs | 10 requests/minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709040600
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## Webhooks

### Payment Webhook
```http
POST /webhooks/payment
```

**Payload:**
```json
{
  "event": "payment.succeeded",
  "data": {
    "payment_id": "pay_123",
    "order_id": "ord_123",
    "amount": 60.47,
    "currency": "USD",
    "status": "succeeded"
  },
  "timestamp": "2026-02-16T13:30:00Z"
}
```

---

## Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| INVALID_CREDENTIALS | Invalid email or password | 401 |
| TOKEN_EXPIRED | Access token has expired | 401 |
| INVALID_TOKEN | Invalid or malformed token | 401 |
| INSUFFICIENT_PERMISSIONS | Insufficient permissions | 403 |
| RESOURCE_NOT_FOUND | Resource not found | 404 |
| PRODUCT_NOT_FOUND | Product not found | 404 |
| ORDER_NOT_FOUND | Order not found | 404 |
| USER_ALREADY_EXISTS | User already exists | 409 |
| VALIDATION_ERROR | Input validation failed | 422 |
| PAYMENT_FAILED | Payment processing failed | 422 |
| OUT_OF_STOCK | Product is out of stock | 422 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |
| INTERNAL_SERVER_ERROR | Internal server error | 500 |

---

This API design follows RESTful principles with clear, predictable endpoints and comprehensive error handling.
