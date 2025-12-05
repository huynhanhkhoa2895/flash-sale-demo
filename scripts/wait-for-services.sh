#!/bin/bash

# Wait for services to be ready

set -e

echo "⏳ Waiting for services to be ready..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a service is ready
check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Checking $name... "
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Ready${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}❌ Timeout${NC}"
    return 1
}

# Check Order Service
check_service "Order Service" "http://localhost:3002/products/FLASH_SALE_PRODUCT_001" || {
    echo -e "${YELLOW}⚠️  Order Service chưa sẵn sàng. Có thể cần thêm thời gian để connect Kafka.${NC}"
}

# Check API Gateway
check_service "API Gateway" "http://localhost:3001/api/products/FLASH_SALE_PRODUCT_001" || {
    echo -e "${YELLOW}⚠️  API Gateway chưa sẵn sàng.${NC}"
}

# Check Inventory Service
check_service "Inventory Service" "http://localhost:3004/stock/FLASH_SALE_PRODUCT_001" || {
    echo -e "${YELLOW}⚠️  Inventory Service chưa sẵn sàng.${NC}"
}

echo ""
echo "✅ Service check completed!"

