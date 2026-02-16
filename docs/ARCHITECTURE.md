# E-commerce Platform Architecture

## System Overview

This document describes the complete architecture for a secure, scalable e-commerce clothing platform built using microservices architecture, containerized with Docker, and orchestrated with Kubernetes.

## Architecture Pattern

**Microservices Architecture** - Independent, loosely coupled services communicating via APIs and message queues.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  (Web Browser, Mobile App, Progressive Web App)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS (TLS 1.3)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      CDN (CloudFront)                           │
│              (Static Assets, Images, CSS, JS)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    WAF (AWS WAF)                                │
│        (DDoS Protection, Rate Limiting, Security Rules)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              Application Load Balancer (ALB)                    │
│                  (SSL Termination)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Kubernetes Cluster (EKS)                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              API Gateway (Kong/NGINX)                    │  │
│  │  • Authentication/Authorization                          │  │
│  │  • Rate Limiting                                         │  │
│  │  • Request Routing                                       │  │
│  └────┬────────────────────────────────────────────────────┘  │
│       │                                                         │
│  ┌────▼─────────────────────────────────────────────────────┐ │
│  │              Microservices Layer                         │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │   Frontend   │  │     User     │  │   Product    │  │ │
│  │  │   Service    │  │   Service    │  │   Catalog    │  │ │
│  │  │  (Next.js)   │  │              │  │   Service    │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │     Cart     │  │   Checkout   │  │    Order     │  │ │
│  │  │   Service    │  │   Service    │  │  Management  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │   Payment    │  │  Inventory   │  │ Notification │  │ │
│  │  │   Service    │  │   Service    │  │   Service    │  │ │
│  │  │ (PCI-DSS)    │  │              │  │              │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐                                       │ │
│  │  │   Review &   │                                       │ │
│  │  │    Rating    │                                       │ │
│  │  │   Service    │                                       │ │
│  │  └──────────────┘                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Message Queue (RabbitMQ/AWS SQS)              │  │
│  │        (Async Communication Between Services)           │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Data Layer                                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │   MongoDB    │  │    Redis     │        │
│  │   Cluster    │  │  Replica Set │  │   Cluster    │        │
│  │              │  │              │  │              │        │
│  │ User, Order, │  │  Products,   │  │ Cache, Cart, │        │
│  │ Payment,     │  │   Reviews    │  │   Sessions   │        │
│  │ Inventory    │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │        Elasticsearch Cluster (Product Search)            │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Monitoring & Observability                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Prometheus  │  │   Grafana    │  │  ELK Stack   │        │
│  │   (Metrics)  │  │ (Dashboards) │  │  (Logging)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │    Jaeger    │  │ AlertManager │                           │
│  │  (Tracing)   │  │  (Alerts)    │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

## Microservices Breakdown

### 1. Frontend Service
- **Technology**: Next.js 14+, React 18, TypeScript, Tailwind CSS
- **Port**: 3000
- **Features**:
  - Server-Side Rendering (SSR)
  - Progressive Web App (PWA)
  - Responsive design
  - SEO optimized
- **Deployment**: NGINX container, horizontally scalable
- **Security**: CSP headers, HTTPS enforcement

### 2. API Gateway
- **Technology**: Kong / NGINX Plus
- **Port**: 8000
- **Responsibilities**:
  - Request routing
  - Load balancing
  - JWT validation
  - Rate limiting (100 req/min per IP)
  - Protocol translation
  - Centralized logging

### 3. User Management Service
- **Technology**: Node.js/Express, TypeScript
- **Port**: 8001
- **Database**: PostgreSQL
- **Features**:
  - User registration
  - Login/Logout
  - Profile management
  - JWT authentication
  - OAuth2.0 (Google, Facebook)
- **Security**: Bcrypt hashing, JWT tokens

### 4. Product Catalog Service
- **Technology**: Node.js/Python
- **Port**: 8002
- **Database**: MongoDB (products), Elasticsearch (search)
- **Cache**: Redis
- **Features**:
  - Product CRUD operations
  - Category management
  - Advanced search and filters
  - Product recommendations
- **APIs**: GraphQL for flexible queries

### 5. Cart Service
- **Technology**: Node.js/Express
- **Port**: 8003
- **Database**: Redis (session carts), PostgreSQL (persistent)
- **Features**:
  - Add/remove items
  - Update quantities
  - Cart persistence
  - Cart expiration (7 days)
- **APIs**: RESTful with WebSocket support

### 6. Order Management Service
- **Technology**: Java/Spring Boot or Node.js
- **Port**: 8004
- **Database**: PostgreSQL
- **Features**:
  - Order creation
  - Status tracking
  - Order history
  - Invoice generation
- **Event-Driven**: Publishes order events

### 7. Payment Service (PCI-DSS Compliant)
- **Technology**: Node.js with Stripe/Razorpay SDK
- **Port**: 8005
- **Database**: PostgreSQL (transaction logs, encrypted)
- **Features**:
  - Payment processing
  - Refunds
  - Transaction history
- **Security**:
  - Tokenization (no card storage)
  - TLS 1.3 encryption
  - 3D Secure authentication
  - Network isolation
- **Payment Gateways**: Stripe, Razorpay, PayPal

### 8. Checkout Service
- **Technology**: Node.js
- **Port**: 8006
- **Features**:
  - Multi-step checkout
  - Address validation
  - Order summary
  - Promo code validation
- **Orchestration**: Cart → Payment → Order → Notification
- **Pattern**: Saga for distributed transactions

### 9. Notification Service
- **Technology**: Node.js
- **Port**: 8007
- **Services**: AWS SES, Twilio, Firebase
- **Features**:
  - Email notifications
  - SMS notifications
  - Push notifications
- **Queue**: RabbitMQ/SQS for async processing

### 10. Inventory Service
- **Technology**: Python/Java
- **Port**: 8008
- **Database**: PostgreSQL with row-level locking
- **Features**:
  - Stock management
  - Availability checks
  - Stock reservations
  - Restock alerts
- **Event-Driven**: Listens to order events

### 11. Review & Rating Service
- **Technology**: Node.js/Python
- **Port**: 8009
- **Database**: MongoDB
- **Features**:
  - Product reviews
  - Star ratings
  - Review moderation
  - Helpful votes

## Data Flow Examples

### User Registration Flow
```
1. User submits registration form (Frontend)
2. Frontend → API Gateway → User Service
3. User Service validates data
4. User Service hashes password (bcrypt)
5. User Service stores in PostgreSQL
6. User Service generates JWT tokens
7. Tokens returned to Frontend
8. Notification Service sends welcome email (async)
```

### Product Search Flow
```
1. User enters search query (Frontend)
2. Frontend → API Gateway → Product Catalog Service
3. Product Catalog queries Elasticsearch
4. Check Redis cache for results
5. If miss, query MongoDB
6. Cache results in Redis (1 hour TTL)
7. Return paginated results to Frontend
```

### Checkout & Payment Flow
```
1. User initiates checkout (Frontend)
2. Frontend → API Gateway → Checkout Service
3. Checkout Service validates cart (Cart Service)
4. Checkout Service checks inventory (Inventory Service)
5. Checkout Service reserves stock (Inventory Service)
6. User enters payment details (Frontend)
7. Frontend → Payment Service (tokenized)
8. Payment Service processes with Stripe/Razorpay
9. On success:
   - Payment Service confirms transaction
   - Checkout Service creates order (Order Service)
   - Order Service publishes OrderCreated event
   - Inventory Service updates stock
   - Notification Service sends confirmation email
   - Cart Service clears cart
10. On failure:
    - Inventory Service releases reserved stock
    - User notified of failure
```

## Communication Patterns

### Synchronous (REST/GraphQL)
- Frontend ↔ Services
- API Gateway ↔ Services
- Service-to-service calls (timeout: 5s)

### Asynchronous (Message Queue)
- Order events → Inventory Service
- Order events → Notification Service
- Payment events → Order Service
- Inventory updates → Product Catalog

### Event-Driven Architecture
```
Events:
- OrderCreated
- OrderCompleted
- OrderCancelled
- PaymentSucceeded
- PaymentFailed
- InventoryLow
- UserRegistered
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: 15 min access, 7 day refresh
- **RBAC**: Admin, Customer, Guest
- **MFA**: For admin accounts
- **OAuth2.0**: Google, Facebook login

### Network Security
- **TLS 1.3**: All communications encrypted
- **Network Policies**: Kubernetes pod-to-pod rules
- **WAF**: SQL injection, XSS protection
- **Rate Limiting**: Per IP and per user

### Data Security
- **Encryption at Rest**: AES-256
- **Encryption in Transit**: TLS 1.3
- **Secrets Management**: AWS Secrets Manager / Vault
- **PII Protection**: Encrypted columns in DB
- **Payment Data**: Tokenization, no storage

### Application Security
- **Input Validation**: All user inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content Security Policy
- **CSRF Protection**: Anti-CSRF tokens
- **Dependency Scanning**: Trivy, Snyk
- **Code Scanning**: SonarQube (SAST)

## Scalability Strategy

### Horizontal Pod Autoscaling (HPA)
```yaml
Frontend Service: 2-10 pods (CPU > 70%)
API Gateway: 3-15 pods (Request rate)
User Service: 2-8 pods (CPU > 60%)
Product Catalog: 3-12 pods (CPU > 60%)
Cart Service: 2-8 pods (Redis connections)
Order Service: 2-10 pods (CPU > 70%)
Payment Service: 3 pods (fixed, HA)
Checkout Service: 2-8 pods (CPU > 70%)
Notification Service: 2-6 pods (Queue depth)
Inventory Service: 2-6 pods (CPU > 60%)
Review Service: 2-6 pods (CPU > 60%)
```

### Database Scaling
- **PostgreSQL**: 1 primary + 2 read replicas
- **MongoDB**: 3-node replica set with sharding
- **Redis**: Cluster mode with 3 master + 3 replica
- **Elasticsearch**: 3-node cluster

### Caching Strategy
```
Product Details: Redis, 1 hour TTL
User Sessions: Redis, 24 hours TTL
Cart Data: Redis, 7 days TTL
Search Results: Redis, 30 min TTL
Static Assets: CloudFront CDN, 7 days
API Responses: API Gateway cache, 5 min
```

## Monitoring & Observability

### Metrics (Prometheus + Grafana)
- Request rate, error rate, latency (RED metrics)
- CPU, memory, disk usage
- Database connections and query performance
- Cache hit/miss ratios
- Payment transaction success rates
- Order conversion funnel

### Logging (ELK Stack)
- Centralized logging from all services
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Retention: 30 days
- Alert on error spikes

### Tracing (Jaeger)
- Distributed tracing across microservices
- End-to-end request tracing
- Performance bottleneck identification
- Latency analysis

### Alerting (AlertManager)
```
Critical Alerts:
- Service down (immediate)
- Database connection failure (immediate)
- Payment gateway timeout (immediate)
- Disk usage > 90% (immediate)

Warning Alerts:
- High error rate > 1% (5 min)
- High latency > 2s (10 min)
- Pod restart loops (15 min)
- Low inventory (1 hour)
```

## Disaster Recovery

### Backup Strategy
- **Databases**: Automated daily backups, 30-day retention
- **Point-in-Time Recovery**: 15-minute RPO
- **Cross-Region Replication**: For production databases
- **Kubernetes etcd**: Daily backups
- **Configuration**: GitOps (version controlled)

### High Availability
- **Multi-AZ Deployment**: All services
- **Database Failover**: Automatic (< 60s)
- **Load Balancer**: Health checks every 30s
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Non-critical features can fail

### Recovery Objectives
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 15 minutes

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| API Gateway | Kong / NGINX Plus |
| Backend | Node.js (Express/NestJS), Python (FastAPI) |
| Databases | PostgreSQL, MongoDB, Redis, Elasticsearch |
| Message Queue | RabbitMQ / AWS SQS |
| Container Runtime | Docker |
| Orchestration | Kubernetes (AWS EKS) |
| Service Mesh | Istio (optional) |
| CI/CD | GitHub Actions |
| GitOps | ArgoCD |
| IaC | Terraform |
| Config Management | Helm |
| Monitoring | Prometheus, Grafana |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) |
| Tracing | Jaeger |
| Cloud Provider | AWS |
| CDN | CloudFront |
| WAF | AWS WAF |
| Payment | Stripe, Razorpay |
| Security Scanning | Trivy, SonarQube, Snyk, Checkov |

## Next Steps

Refer to:
- `docs/API_DESIGN.md` - API endpoints and contracts
- `docs/DATABASE_SCHEMA.md` - Database schemas
- `docs/DEPLOYMENT.md` - Deployment procedures
- `docs/SECURITY.md` - Security guidelines
- `terraform/` - Infrastructure as Code
- `kubernetes/` - Kubernetes manifests
- `.github/workflows/` - CI/CD pipelines
