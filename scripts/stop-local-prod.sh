#!/bin/bash

# Stop built services running locally

set -e

echo "🛑 Stopping built services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop application services
if [ -f /tmp/flash-sale-pids.txt ]; then
    echo "Stopping application services..."
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null || true
            echo "  - Stopped process $pid"
        fi
    done < /tmp/flash-sale-pids.txt
    rm /tmp/flash-sale-pids.txt
else
    echo "No PID file found, killing processes manually..."
    pkill -f "node.*apps/web" || true
    pkill -f "node.*apps/api-gateway" || true
    pkill -f "node.*apps/services/order-service" || true
    pkill -f "node.*apps/services/inventory-service" || true
    pkill -f "node.*apps/services/notification-service" || true
fi

sleep 2

# Stop Docker infrastructure
echo "Stopping Docker infrastructure..."
docker-compose -f docker-compose.local.yml down

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""

