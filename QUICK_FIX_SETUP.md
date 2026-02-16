# Quick Fix - Setup Instructions

## Issue: Docker Build Failed (Missing package-lock.json)

The Docker build failed because `npm ci` requires a `package-lock.json` file. Here's how to fix it:

---

## Solution 1: Generate package-lock.json Locally (Recommended)

**This is the best approach for production builds.**

```bash
# Navigate to user-service directory
cd services/user-service

# Generate package-lock.json
npm install

# Commit the package-lock.json
git add package-lock.json
git commit -m "chore: Add package-lock.json for user-service"
git push

# Now rebuild
cd ../..
docker-compose build user-service
docker-compose up -d
```

---

## Solution 2: Use Updated Dockerfile (Already Fixed)

I've updated the Dockerfile to handle missing package-lock.json automatically:

```bash
# Pull the latest changes
git pull

# Rebuild and start
docker-compose up -d --build
```

The new Dockerfile will:
- Use `npm ci` if `package-lock.json` exists
- Fall back to `npm install` if it doesn't

---

## Solution 3: Use Development Dockerfile

For local development, use the development Dockerfile:

```bash
# Update docker-compose.yml to use Dockerfile.dev
cd services/user-service

# Build with development Dockerfile
docker build -f Dockerfile.dev -t user-service:dev .
```

---

## Complete Setup from Scratch

Here's the complete setup process:

### Step 1: Clone Repository
```bash
git clone https://github.com/Princekalyan44/ecommerce-platform-clothing.git
cd ecommerce-platform-clothing
```

### Step 2: Generate package-lock.json
```bash
cd services/user-service
npm install
cd ../..
```

### Step 3: Set up environment variables
```bash
cp services/user-service/.env.example services/user-service/.env
# Edit .env with your settings if needed
```

### Step 4: Start services
```bash
make up
# Or: docker-compose up -d
```

### Step 5: Check logs
```bash
make logs
# Or: docker-compose logs -f
```

### Step 6: Wait for services to be ready
```bash
# Wait about 30 seconds for all services to start
sleep 30

# Check health
curl http://localhost:8001/health
```

### Step 7: Test the API
```bash
# Register a user
curl -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

---

## Alternative: Skip Docker for Now

Run the User Service directly on your machine:

### Step 1: Install Node.js dependencies
```bash
cd services/user-service
npm install
```

### Step 2: Start PostgreSQL and Redis (required)
```bash
# Start only the databases
docker-compose up -d postgres-user redis
```

### Step 3: Set up environment
```bash
cp .env.example .env
# Edit .env if needed
```

### Step 4: Run migrations
```bash
npm run migrate
```

### Step 5: Start the service
```bash
npm run dev
```

The service will start on http://localhost:8001

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solution**: Make sure PostgreSQL is running
```bash
docker-compose up -d postgres-user

# Check if it's running
docker-compose ps postgres-user

# Check logs
docker-compose logs postgres-user
```

### Error: "Cannot connect to Redis"

**Solution**: Make sure Redis is running
```bash
docker-compose up -d redis

# Test Redis connection
redis-cli -h localhost -p 6379 -a password123 ping
# Should return: PONG
```

### Error: "Port already in use"

**Solution**: Stop conflicting services
```bash
# Find what's using the port
lsof -i :8001  # On macOS/Linux
netstat -ano | findstr :8001  # On Windows

# Stop the conflicting service or change the port
```

### Error: "Permission denied"

**Solution**: Docker permission issues
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo docker-compose up -d
```

---

## Clean Start (If Nothing Works)

If you're having persistent issues, do a clean restart:

```bash
# Stop everything
docker-compose down -v

# Remove all containers and volumes
docker system prune -a --volumes

# Generate package-lock.json
cd services/user-service
npm install
cd ../..

# Start fresh
docker-compose up -d --build
```

---

## Verification Checklist

After setup, verify everything is working:

- [ ] PostgreSQL is running: `docker-compose ps postgres-user`
- [ ] Redis is running: `docker-compose ps redis`
- [ ] User Service is running: `docker-compose ps user-service`
- [ ] Health check passes: `curl http://localhost:8001/health`
- [ ] Can register user: `curl -X POST http://localhost:8001/auth/register ...`
- [ ] Prometheus is scraping: http://localhost:9090/targets
- [ ] Grafana is accessible: http://localhost:3001

---

## Quick Commands Reference

```bash
# Start everything
make up

# Stop everything
make down

# View logs
make logs

# View specific service logs
make logs-user

# Rebuild and restart
docker-compose up -d --build

# Clean everything
make clean

# Run tests
make test
```

---

## Next Steps After Successful Setup

1. ✅ Test all authentication endpoints
2. ✅ Check Prometheus metrics: http://localhost:9090
3. ✅ Set up Grafana dashboards: http://localhost:3001
4. ✅ Review the code in `services/user-service/src`
5. ✅ Start implementing the next service (Product Catalog)

---

## Still Having Issues?

**Check the following:**

1. **Docker installed and running?**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Ports available?**
   - 5432 (PostgreSQL)
   - 6379 (Redis)
   - 8001 (User Service)
   - 9090 (Prometheus)
   - 3001 (Grafana)

3. **Enough disk space?**
   ```bash
   df -h
   ```

4. **Docker has enough resources?**
   - Docker Desktop → Preferences → Resources
   - Recommended: 4GB RAM, 2 CPUs

---

**You're almost there! Follow Solution 1 above and you'll be up and running in 2 minutes!** 🚀
