#!/bin/bash

echo "🧪 Testing Product Catalog Service..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}1️⃣  Health Check:${NC}"
curl -s http://localhost:8002/health | jq '.'
echo ""

# Test 2: Create Category
echo -e "${BLUE}2️⃣  Creating 'Men's Clothing' Category:${NC}"
CATEGORY_RESPONSE=$(curl -s -X POST http://localhost:8002/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mens Clothing",
    "description": "Stylish clothing for men",
    "order": 1
  }')
echo $CATEGORY_RESPONSE | jq '.'
CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.data._id')
echo -e "${GREEN}✅ Category ID: $CATEGORY_ID${NC}"
echo ""

# Test 3: Create Product 1
echo -e "${BLUE}3️⃣  Creating Product: Classic White T-Shirt${NC}"
PRODUCT1_RESPONSE=$(curl -s -X POST http://localhost:8002/products \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Classic White T-Shirt\",
    \"description\": \"Premium 100% cotton t-shirt. Soft, breathable, and comfortable for everyday wear.\",
    \"shortDescription\": \"Premium cotton tee\",
    \"categoryId\": \"$CATEGORY_ID\",
    \"brand\": \"Premium Basics\",
    \"tags\": [\"casual\", \"summer\", \"cotton\"],
    \"basePrice\": 29.99,
    \"compareAtPrice\": 39.99,
    \"totalStock\": 100,
    \"hasVariants\": true,
    \"variants\": [
      {\"sku\": \"WHT-TS-S\", \"size\": \"S\", \"color\": \"White\", \"price\": 29.99, \"stock\": 25},
      {\"sku\": \"WHT-TS-M\", \"size\": \"M\", \"color\": \"White\", \"price\": 29.99, \"stock\": 40}
    ],
    \"isFeatured\": true
  }")
PRODUCT1_ID=$(echo $PRODUCT1_RESPONSE | jq -r '.data._id')
echo -e "${GREEN}✅ Product ID: $PRODUCT1_ID${NC}"
echo ""

# Test 4: List Products
echo -e "${BLUE}4️⃣  List All Products:${NC}"
PRODUCTS_LIST=$(curl -s http://localhost:8002/products)
PRODUCT_COUNT=$(echo $PRODUCTS_LIST | jq '.data | length')
echo -e "${GREEN}   Found $PRODUCT_COUNT products${NC}"
echo ""

# Test 5: Search
echo -e "${BLUE}5️⃣  Search for 'shirt':${NC}"
SEARCH_RESULT=$(curl -s "http://localhost:8002/products/search?query=shirt")
SEARCH_COUNT=$(echo $SEARCH_RESULT | jq '.data | length')
echo -e "${GREEN}   Found $SEARCH_COUNT results${NC}"
echo ""

# Test 6: Add Review
echo -e "${BLUE}6️⃣  Add Product Review:${NC}"
curl -s -X POST http://localhost:8002/products/$PRODUCT1_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "userName": "John Doe",
    "rating": 5,
    "title": "Amazing quality!",
    "comment": "Great t-shirt!",
    "verifiedPurchase": true
  }' | jq '.data.averageRating'
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
