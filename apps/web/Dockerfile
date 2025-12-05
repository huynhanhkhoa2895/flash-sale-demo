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

# Copy web app
COPY apps/web ./apps/web

# Install pnpm
RUN npm install -g pnpm@9

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter shared-types build
RUN pnpm --filter kafka-config build
RUN pnpm --filter common-utils build

# Build web app
WORKDIR /app/apps/web
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

# Copy web app - required files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/

# Copy optional config files using RUN with mount
RUN --mount=from=builder,source=/app/apps/web,target=/tmp/web \
    ([ -d /tmp/web/public ] && cp -r /tmp/web/public /app/apps/web/public || mkdir -p /app/apps/web/public) && \
    ([ -f /tmp/web/next.config.js ] && cp /tmp/web/next.config.js /app/apps/web/ || true) && \
    ([ -f /tmp/web/tailwind.config.js ] && cp /tmp/web/tailwind.config.js /app/apps/web/ || true) && \
    ([ -f /tmp/web/postcss.config.js ] && cp /tmp/web/postcss.config.js /app/apps/web/ || true) && \
    ([ -f /tmp/web/next-env.d.ts ] && cp /tmp/web/next-env.d.ts /app/apps/web/ || true)

# Copy root files
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9
RUN pnpm install --frozen-lockfile --prod --filter web...

WORKDIR /app/apps/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]

