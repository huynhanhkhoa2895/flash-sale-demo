#!/bin/bash

# Stop Local Development Environment

set -e

echo "🛑 Stopping Local Development Environment..."
echo ""

# Stop application services
echo "📦 Step 1: Stopping application services..."
pkill -f "flash-sale-demo.*node|flash-sale-demo.*ts-node|flash-sale-demo.*nodemon|flash-sale-demo.*next" 2>/dev/null || echo "No application services running"

sleep 2

# Stop Docker infrastructure
echo "🐳 Step 2: Stopping Docker infrastructure..."
docker-compose -f docker-compose.local.yml down

echo ""
echo "✅ All services stopped!"

