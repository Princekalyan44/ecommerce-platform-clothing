# Security Guidelines

## Overview

This document outlines the security measures, best practices, and guidelines for the e-commerce platform. Security is implemented at multiple layers: application, infrastructure, network, and data.

---

## Security Principles

### 1. Defense in Depth
Multiple layers of security controls throughout the system.

### 2. Least Privilege
Users and services have only the minimum permissions necessary.

### 3. Zero Trust
Never trust, always verify. All requests are authenticated and authorized.

### 4. Security by Design
Security considerations integrated from the start, not added later.

### 5. Fail Securely
System fails in a secure state, not exposing sensitive data.

---

## Authentication & Authorization

### JWT Token Security

**Access Token:**
- Expiration: 15 minutes
- Algorithm: RS256 (asymmetric)
- Claims: user_id, email, role, issued_at, expires_at
- Storage: Memory/Session storage (never localStorage)

**Refresh Token:**
- Expiration: 7 days
- Stored: HttpOnly, Secure, SameSite cookies
- Rotation: New refresh token issued on each use
- Revocation: Tracked in database

**Token Generation:**
```javascript
const accessToken = jwt.sign(
  { 
    user_id: user.id,
    email: user.email,
    role: user.role 
  },
  process.env.JWT_PRIVATE_KEY,
  { 
    algorithm: 'RS256',
    expiresIn: '15m',
    issuer: 'api.yourstore.com',
    audience: 'yourstore.com'
  }
);
```

### Password Security

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords (check against breached password database)

**Hashing:**
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
```

**Password Reset:**
- Reset tokens expire in 1 hour
- One-time use tokens
- Secure token generation using crypto.randomBytes
- Email verification required

### Multi-Factor Authentication (MFA)

**For Admin Users (Mandatory):**
- TOTP (Time-based One-Time Password)
- Backup codes (generated once, encrypted storage)
- SMS fallback (optional)

**Implementation:**
```javascript
const speakeasy = require('speakeasy');

// Generate secret
const secret = speakeasy.generateSecret({
  name: 'YourStore',
  issuer: 'YourStore'
});

// Verify token
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userToken,
  window: 2
});
```

### OAuth 2.0 Integration

**Supported Providers:**
- Google
- Facebook
- Apple (future)

**Security Measures:**
- State parameter for CSRF protection
- PKCE (Proof Key for Code Exchange) for mobile apps
- Token validation
- Scope limitation

---

## API Security

### Rate Limiting

**Implementation (API Gateway):**
```yaml
rate_limit:
  public_endpoints: 60/minute
  authenticated_endpoints: 100/minute
  search_endpoints: 30/minute
  payment_endpoints: 10/minute
  
blacklist:
  duration: 1 hour
  threshold: 1000 requests/hour
```

**Redis-based Rate Limiter:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per windowMs
  message: 'Too many requests'
});
```

### Input Validation

**All User Inputs:**
```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
});

const { error, value } = registerSchema.validate(req.body);
```

**Sanitization:**
```javascript
const xss = require('xss');
const validator = require('validator');

// Sanitize input
const cleanInput = xss(validator.escape(userInput));
```

### SQL Injection Prevention

**Parameterized Queries:**
```javascript
// ✅ GOOD - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ BAD - String concatenation
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

**Content Security Policy (CSP):**
```javascript
const helmet = require('helmet');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://cdn.yourstore.com'],
      connectSrc: ["'self'", 'https://api.yourstore.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);
```

### CSRF Protection

**Double Submit Cookie:**
```javascript
const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});

app.use(csrfProtection);

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```

### CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: ['https://yourstore.com', 'https://www.yourstore.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

## Data Security

### Encryption at Rest

**Database Encryption:**
- PostgreSQL: Transparent Data Encryption (TDE)
- MongoDB: Encryption at rest using WiredTiger
- Redis: Encryption enabled

**Sensitive Fields (Application-level encryption):**
```javascript
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encrypted, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Encryption in Transit

**TLS 1.3 Configuration:**
```yaml
# NGINX Configuration
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### PII Data Protection

**Data Classification:**
- Public: Product info, categories
- Internal: Order history, purchase patterns
- Confidential: User credentials, addresses
- Restricted: Payment data (tokenized, never stored)

**Data Minimization:**
- Collect only necessary data
- Regular data audits
- Automatic PII deletion after account closure (GDPR compliance)

### Secrets Management

**AWS Secrets Manager / HashiCorp Vault:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  try {
    const data = await secretsManager.getSecretValue({ 
      SecretId: secretName 
    }).promise();
    
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
}

// Usage
const dbCredentials = await getSecret('prod/db/credentials');
```

**Secret Rotation:**
- Database credentials: Every 90 days
- API keys: Every 180 days
- JWT signing keys: Every 6 months
- Encryption keys: Annually

---

## Payment Security (PCI-DSS Compliance)

### PCI-DSS Requirements

**SAQ-A Compliance** (using payment gateway tokenization):

1. **Never store card data** - Use payment gateway tokens
2. **TLS 1.3** for all payment communications
3. **Network segmentation** - Payment service in isolated namespace
4. **Regular security scans** - Quarterly vulnerability assessments
5. **Access controls** - Strict RBAC for payment service

### Payment Tokenization

**Stripe Integration:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent (no card data stored)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 6047, // in cents
  currency: 'usd',
  payment_method_types: ['card'],
  metadata: {
    order_id: 'ord_123',
    user_id: 'user_456'
  }
});

// Return client_secret to frontend
res.json({
  client_secret: paymentIntent.client_secret
});
```

### 3D Secure Authentication

**3DS2 Implementation:**
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 6047,
  currency: 'usd',
  payment_method: paymentMethodId,
  confirmation_method: 'manual',
  confirm: true,
  payment_method_options: {
    card: {
      request_three_d_secure: 'any' // Force 3DS when available
    }
  }
});
```

### Fraud Detection

**Velocity Checks:**
```javascript
const MAX_ATTEMPTS = 3;
const WINDOW = 3600; // 1 hour

const attemptKey = `payment_attempts:${userId}`;
const attempts = await redis.incr(attemptKey);

if (attempts === 1) {
  await redis.expire(attemptKey, WINDOW);
}

if (attempts > MAX_ATTEMPTS) {
  throw new Error('Too many payment attempts');
}
```

**Geolocation Checks:**
```javascript
const geoip = require('geoip-lite');

const geo = geoip.lookup(req.ip);

if (geo && geo.country !== user.country) {
  // Flag for manual review
  await flagTransactionForReview({
    reason: 'Country mismatch',
    user_country: user.country,
    ip_country: geo.country
  });
}
```

---

## Infrastructure Security

### Kubernetes Security

**Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-service-policy
  namespace: services
spec:
  podSelector:
    matchLabels:
      app: payment-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
      - podSelector:
          matchLabels:
            app: api-gateway
      ports:
        - protocol: TCP
          port: 8005
  egress:
    - to:
      - podSelector:
          matchLabels:
            app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
      - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 53 # DNS
```

**Pod Security Standards:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: payment-service
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: payment-service
    image: payment-service:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

**RBAC Configuration:**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: services
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: services
subjects:
- kind: ServiceAccount
  name: payment-service-sa
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Container Security

**Image Scanning (Trivy):**
```bash
# Scan image for vulnerabilities
trivy image --severity HIGH,CRITICAL payment-service:latest

# Fail build if vulnerabilities found
trivy image --exit-code 1 --severity CRITICAL payment-service:latest
```

**Dockerfile Best Practices:**
```dockerfile
# Use specific base image version
FROM node:18.19.0-alpine3.19

# Create non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

**Image Signing (Cosign):**
```bash
# Sign image
cosign sign --key cosign.key payment-service:latest

# Verify signature
cosign verify --key cosign.pub payment-service:latest
```

### AWS Security

**IAM Policies (Least Privilege):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::yourstore-images/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/*"
    }
  ]
}
```

**VPC Configuration:**
- Public subnets: ALB, NAT Gateway
- Private subnets: EKS nodes, application pods
- Isolated subnets: Databases (no internet access)

**Security Groups:**
```hcl
resource "aws_security_group" "alb" {
  name = "alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
}

resource "aws_security_group" "eks_nodes" {
  name = "eks-nodes-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}
```

---

## Application Security

### Dependency Management

**npm audit:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update dependencies
npm update
```

**Dependabot Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"
```

### Logging & Monitoring

**Security Event Logging:**
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
securityLogger.info('Login attempt', {
  user_id: userId,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  success: true,
  timestamp: new Date().toISOString()
});
```

**Security Alerts:**
- Failed login attempts (> 5 in 10 minutes)
- Unusual payment patterns
- Privilege escalation attempts
- API rate limit violations
- Suspicious file uploads

---

## Incident Response

### Security Incident Workflow

1. **Detection** - Automated monitoring alerts
2. **Containment** - Isolate affected systems
3. **Investigation** - Analyze logs and forensics
4. **Remediation** - Patch vulnerabilities
5. **Recovery** - Restore services
6. **Post-Incident** - Document and improve

### Incident Response Team
- Security Lead
- DevOps Engineer
- Development Lead
- Legal/Compliance

### Communication Plan
- Internal: Slack #security-incidents
- External: Status page, email notifications
- Regulatory: 72-hour breach notification (GDPR)

---

## Compliance

### GDPR Compliance

**Right to be Forgotten:**
```javascript
async function deleteUserData(userId) {
  await db.transaction(async (trx) => {
    // Anonymize instead of delete for audit trail
    await trx('users').where({ id: userId }).update({
      email: `deleted_${userId}@deleted.com`,
      first_name: 'Deleted',
      last_name: 'User',
      phone: null,
      deleted_at: new Date()
    });
    
    // Delete addresses
    await trx('user_addresses').where({ user_id: userId }).del();
    
    // Keep orders but anonymize
    await trx('orders').where({ user_id: userId }).update({
      user_id: null
    });
  });
}
```

**Data Export:**
```javascript
async function exportUserData(userId) {
  const userData = await db('users').where({ id: userId }).first();
  const orders = await db('orders').where({ user_id: userId });
  const addresses = await db('user_addresses').where({ user_id: userId });
  
  return {
    personal_data: userData,
    orders,
    addresses,
    exported_at: new Date().toISOString()
  };
}
```

### PCI-DSS Compliance

**Requirements:**
- ✅ Build and maintain secure network
- ✅ Protect cardholder data (tokenization)
- ✅ Maintain vulnerability management program
- ✅ Implement strong access control measures
- ✅ Regularly monitor and test networks
- ✅ Maintain information security policy

---

## Security Testing

### Static Application Security Testing (SAST)

**SonarQube:**
```yaml
# sonar-project.properties
sonar.projectKey=ecommerce-platform
sonar.sources=src
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js
```

### Dynamic Application Security Testing (DAST)

**OWASP ZAP:**
```bash
# Run ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging-api.yourstore.com \
  -r zap-report.html
```

### Penetration Testing

**Schedule:**
- Quarterly automated scans
- Annual manual penetration test
- After major releases

---

## Security Checklist

### Pre-Deployment
- [ ] All dependencies updated and scanned
- [ ] SAST scan passed
- [ ] Container images scanned
- [ ] Secrets rotated
- [ ] Security policies reviewed
- [ ] Backup verified

### Production
- [ ] TLS 1.3 enabled
- [ ] WAF configured
- [ ] Rate limiting active
- [ ] Monitoring alerts configured
- [ ] Backup automated
- [ ] Incident response plan documented

---

This security framework provides comprehensive protection for the e-commerce platform while maintaining compliance with industry standards.
