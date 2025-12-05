#!/bin/bash

# Start built services locally with Docker infrastructure (Kafka, Redis, PostgreSQL)

set -e

echo "🚀 Starting built services with Docker infrastructure..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if services are built
check_build() {
    local service=$1
    local dist_path=$2
    
    if [ ! -d "$dist_path" ]; then
        echo -e "${RED}❌ $service is not built. Run 'pnpm build:local' first.${NC}"
        return 1
    fi
    return 0
}

echo -e "${BLUE}📋 Checking builds...${NC}"
if [ ! -d "apps/web/.next" ]; then
    echo -e "${RED}❌ web is not built. Run 'pnpm build:local' first.${NC}"
    exit 1
fi
if [ ! -d "apps/api-gateway/dist" ]; then
    echo -e "${RED}❌ api-gateway is not built. Run 'pnpm build:local' first.${NC}"
    exit 1
fi
if [ ! -d "apps/services/order-service/dist" ]; then
    echo -e "${RED}❌ order-service is not built. Run 'pnpm build:local' first.${NC}"
    exit 1
fi
if [ ! -d "apps/services/inventory-service/dist" ]; then
    echo -e "${RED}❌ inventory-service is not built. Run 'pnpm build:local' first.${NC}"
    exit 1
fi
if [ ! -d "apps/services/notification-service/dist" ]; then
    echo -e "${RED}❌ notification-service is not built. Run 'pnpm build:local' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All services are built${NC}"
echo ""

# Step 1: Start Docker Infrastructure
echo -e "${BLUE}🐳 Step 1: Starting Docker Infrastructure...${NC}"
docker-compose -f docker-compose.local.yml up -d

echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Step 2: Start services
echo ""
echo -e "${BLUE}🚀 Step 2: Starting application services...${NC}"
echo ""

# Set environment variables
export NODE_ENV=production

# Start services in background
BASE_DIR=$(pwd)

echo "  - Starting web (port 3000)..."
(cd "$BASE_DIR/apps/web" && pnpm start > /tmp/web.log 2>&1) &
WEB_PID=$!

echo "  - Starting API Gateway (port 3001)..."
(cd "$BASE_DIR/apps/api-gateway" && pnpm start:prod > /tmp/api-gateway.log 2>&1) &
GATEWAY_PID=$!

echo "  - Starting Order Service (port 3002)..."
(cd "$BASE_DIR/apps/services/order-service" && pnpm start:prod > /tmp/order-service.log 2>&1) &
ORDER_PID=$!

echo "  - Starting Inventory Service (port 3004)..."
(cd "$BASE_DIR/apps/services/inventory-service" && pnpm start:prod > /tmp/inventory-service.log 2>&1) &
INVENTORY_PID=$!

echo "  - Starting Notification Service..."
(cd "$BASE_DIR/apps/services/notification-service" && pnpm start:prod > /tmp/notification-service.log 2>&1) &
NOTIFICATION_PID=$!

# Save PIDs to file
echo $WEB_PID > /tmp/flash-sale-pids.txt
echo $GATEWAY_PID >> /tmp/flash-sale-pids.txt
echo $ORDER_PID >> /tmp/flash-sale-pids.txt
echo $INVENTORY_PID >> /tmp/flash-sale-pids.txt
echo $NOTIFICATION_PID >> /tmp/flash-sale-pids.txt

sleep 5

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📊 Services:"
echo "  - Web: http://localhost:3000"
echo "  - API Gateway: http://localhost:3001/api"
echo "  - Order Service: http://localhost:3002"
echo "  - Inventory Service: http://localhost:3004"
echo ""
echo "📝 Logs:"
echo "  - Web: tail -f /tmp/web.log"
echo "  - API Gateway: tail -f /tmp/api-gateway.log"
echo "  - Order Service: tail -f /tmp/order-service.log"
echo "  - Inventory Service: tail -f /tmp/inventory-service.log"
echo "  - Notification Service: tail -f /tmp/notification-service.log"
echo ""
echo "🛑 To stop: pnpm stop:local:prod"
echo ""

