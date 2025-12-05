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

# Copy order-service
COPY apps/services/order-service ./apps/services/order-service

# Install pnpm
RUN npm install -g pnpm@9

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter shared-types build
RUN pnpm --filter kafka-config build
RUN pnpm --filter common-utils build

# Build order-service
WORKDIR /app/apps/services/order-service
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

# Copy order-service
COPY --from=builder /app/apps/services/order-service/dist ./apps/services/order-service/dist
COPY --from=builder /app/apps/services/order-service/package.json ./apps/services/order-service/

# Copy root files
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9
RUN pnpm install --frozen-lockfile --prod --filter order-service...

WORKDIR /app/apps/services/order-service

EXPOSE 3002

CMD ["pnpm", "start:prod"]

