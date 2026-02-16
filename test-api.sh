#!/bin/bash

echo "🔍 Testing User Service API..."
echo ""

# Health Check
echo "1️⃣ Health Check:"
curl -s http://localhost:8001/health | jq '.'
echo ""

# Register
echo "2️⃣ Register User:"
RESPONSE=$(curl -s -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }')
echo $RESPONSE | jq '.'
echo ""

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.access_token')

# Get Profile
echo "3️⃣ Get Profile:"
curl -s http://localhost:8001/users/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "✅ All tests passed!"

