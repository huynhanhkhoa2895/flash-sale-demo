#!/bin/bash

# Start Local Development Environment
# - Docker: Kafka, Redis, PostgreSQL only
# - Services: Run directly on host machine

set -e

echo "🚀 Starting Local Development Environment..."
echo ""

# Step 1: Start Docker Infrastructure
echo "📦 Step 1: Starting Docker Infrastructure (Kafka, Redis, PostgreSQL)..."
docker-compose -f docker-compose.local.yml up -d

echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Step 2: Check infrastructure status
echo ""
echo "📊 Infrastructure Status:"
docker-compose -f docker-compose.local.yml ps

echo ""
echo "✅ Infrastructure started!"
echo ""

# Step 3: Start Application Services
echo "🚀 Step 2: Starting Application Services..."
echo "   (Services will run directly on your machine)"
echo ""

# Start services in background
pnpm dev &
SERVICES_PID=$!

echo "✅ All services started!"
echo ""
echo "📝 Services:"
echo "  - Web: http://localhost:3000"
echo "  - API Gateway: http://localhost:3001/api"
echo "  - WebSocket: http://localhost:3003/ws"
echo "  - Order Service: http://localhost:3002"
echo "  - Inventory Service: http://localhost:3004"
echo ""
echo "🛑 To stop:"
echo "  - Press Ctrl+C to stop application services"
echo "  - Run 'pnpm infra:down' to stop Docker infrastructure"
echo ""

# Wait for user interrupt
wait $SERVICES_PID

