#!/bin/bash

echo "🧪 Testing Product Catalog Service..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}1️⃣ Health Check:${NC}"
curl -s http://localhost:8002/health | jq '.'
echo ""

# Test 2: Create Category
echo -e "${BLUE}2️⃣ Creating Category:${NC}"
CATEGORY_RESPONSE=$(curl -s -X POST http://localhost:8002/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Clothing",
    "description": "Test category for demo",
    "order": 1
  }')
echo $CATEGORY_RESPONSE | jq '.'
CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.data._id')
echo -e "${GREEN}Category ID: $CATEGORY_ID${NC}"
echo ""

# Test 3: Create Product
echo -e "${BLUE}3️⃣ Creating Product:${NC}"
PRODUCT_RESPONSE=$(curl -s -X POST http://localhost:8002/products \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test T-Shirt\",
    \"description\": \"A great test t-shirt for demo purposes\",
    \"categoryId\": \"$CATEGORY_ID\",
    \"brand\": \"Test Brand\",
    \"tags\": [\"test\", \"demo\"],
    \"basePrice\": 29.99,
    \"compareAtPrice\": 39.99,
    \"totalStock\": 100,
    \"hasVariants\": false,
    \"isFeatured\": true
  }")
echo $PRODUCT_RESPONSE | jq '.'
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data._id')
echo -e "${GREEN}Product ID: $PRODUCT_ID${NC}"
echo ""

# Test 4: Get Product
echo -e "${BLUE}4️⃣ Get Product by ID:${NC}"
curl -s http://localhost:8002/products/$PRODUCT_ID | jq '.'
echo ""

# Test 5: List Products
echo -e "${BLUE}5️⃣ List All Products:${NC}"
curl -s http://localhost:8002/products | jq '.data | length'
echo ""

# Test 6: Featured Products
echo -e "${BLUE}6️⃣ Get Featured Products:${NC}"
curl -s http://localhost:8002/products/featured | jq '.data | length'
echo ""

# Test 7: Search
echo -e "${BLUE}7️⃣ Search Products:${NC}"
curl -s "http://localhost:8002/products/search?query=test" | jq '.data | length'
echo ""

# Test 8: Add Review
echo -e "${BLUE}8️⃣ Add Product Review:${NC}"
curl -s -X POST http://localhost:8002/products/$PRODUCT_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userName": "Test User",
    "rating": 5,
    "title": "Great product!",
    "comment": "Really love this test product. Works perfectly!",
    "verifiedPurchase": true
  }' | jq '.data.averageRating'
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"

