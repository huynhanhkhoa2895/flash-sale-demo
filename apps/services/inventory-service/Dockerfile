# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/shared-types ./packages/shared-types
COPY packages/kafka-config ./packages/kafka-config
COPY packages/common-utils ./packages/common-utils

# Copy inventory-service
COPY apps/services/inventory-service ./apps/services/inventory-service

# Install pnpm
RUN npm install -g pnpm@9

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter shared-types build
RUN pnpm --filter kafka-config build
RUN pnpm --filter common-utils build

# Build inventory-service
WORKDIR /app/apps/services/inventory-service
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built packages
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/kafka-config/dist ./packages/kafka-config/dist
COPY --from=builder /app/packages/kafka-config/package.json ./packages/kafka-config/
COPY --from=builder /app/packages/common-utils/dist ./packages/common-utils/dist
COPY --from=builder /app/packages/common-utils/package.json ./packages/common-utils/

# Copy inventory-service
COPY --from=builder /app/apps/services/inventory-service/dist ./apps/services/inventory-service/dist
COPY --from=builder /app/apps/services/inventory-service/package.json ./apps/services/inventory-service/

# Copy root files
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9
RUN pnpm install --frozen-lockfile --prod --filter inventory-service...

WORKDIR /app/apps/services/inventory-service

CMD ["pnpm", "start:prod"]

