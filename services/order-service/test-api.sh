#!/bin/bash

# Order Service API Test Script
BASE_URL="http://localhost:8003"

# Generate UUIDs (or use fixed ones for testing)
USER_ID="550e8400-e29b-41d4-a716-446655440000"
PRODUCT_ID="660e8400-e29b-41d4-a716-446655440001"

echo "====================================="
echo "Order Service API Tests"
echo "====================================="
echo ""

# 1. Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# 2. Get Empty Cart
echo "2. Get Cart (should be empty):"
curl -s "$BASE_URL/cart/$USER_ID" | jq .
echo -e "\n"

# 3. Add Item to Cart (will fail without product service, but creates cart)
echo "3. Add Item to Cart:"
curl -s -X POST "$BASE_URL/cart/$USER_ID/items" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"variantSku\": \"SKU-001\",
    \"quantity\": 2
  }" | jq .
echo -e "\n"

# 4. Get Cart Again
echo "4. Get Cart (after adding item):"
curl -s "$BASE_URL/cart/$USER_ID" | jq .
echo -e "\n"

# 5. Update Cart Item
echo "5. Update Cart Item Quantity:"
curl -s -X PUT "$BASE_URL/cart/$USER_ID/items" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"variantSku\": \"SKU-001\",
    \"quantity\": 5
  }" | jq .
echo -e "\n"

# 6. Validate Cart
echo "6. Validate Cart:"
curl -s "$BASE_URL/cart/$USER_ID/validate" | jq .
echo -e "\n"

# 7. Get Order Stats
echo "7. Get Order Statistics:"
curl -s "$BASE_URL/orders/stats?userId=$USER_ID" | jq .
echo -e "\n"

# 8. Search Orders
echo "8. Search Orders:"
curl -s "$BASE_URL/orders/search?userId=$USER_ID&page=1&limit=10" | jq .
echo -e "\n"

# 9. Get Recent Orders
echo "9. Get Recent Orders (Admin):"
curl -s "$BASE_URL/orders/recent?limit=5" | jq .
echo -e "\n"

# 10. Remove Item from Cart
echo "10. Remove Item from Cart:"
curl -s -X DELETE "$BASE_URL/cart/$USER_ID/items" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"variantSku\": \"SKU-001\"
  }" | jq .
echo -e "\n"

# 11. Clear Cart
echo "11. Clear Cart:"
curl -s -X DELETE "$BASE_URL/cart/$USER_ID" | jq .
echo -e "\n"

echo "====================================="
echo "Tests Complete!"
echo "====================================="
