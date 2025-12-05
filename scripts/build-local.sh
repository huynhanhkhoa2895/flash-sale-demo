#!/bin/bash

# Build script for local development
# Builds all services to run locally (only Kafka and Redis in Docker)

set -e

echo "🔨 Building all services for local development..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
pnpm install --frozen-lockfile
echo ""

# Step 2: Build shared packages first
echo -e "${BLUE}📦 Step 2: Building shared packages...${NC}"
pnpm --filter shared-types build
pnpm --filter kafka-config build
pnpm --filter common-utils build
echo ""

# Step 3: Build application services
echo -e "${BLUE}📦 Step 3: Building application services...${NC}"
echo "  - Building web..."
pnpm --filter web build
echo "  - Building api-gateway..."
pnpm --filter api-gateway build
echo "  - Building order-service..."
pnpm --filter order-service build
echo "  - Building inventory-service..."
pnpm --filter inventory-service build
echo "  - Building notification-service..."
pnpm --filter notification-service build
echo ""

echo -e "${GREEN}✅ All services built successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Start Docker infrastructure: pnpm infra:up"
echo "  2. Start built services: pnpm start:local:prod"
echo ""

