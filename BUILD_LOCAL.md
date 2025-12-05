# 🔨 Build và Chạy Services Local (Kafka/Redis trong Docker)

Hướng dẫn build và chạy các services trên máy local, chỉ có Kafka và Redis chạy trong Docker.

## 📋 Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker và Docker Compose

## 🚀 Quick Start

### 1. Build tất cả services

```bash
pnpm build:local
```

Lệnh này sẽ:
- ✅ Install dependencies
- ✅ Build shared packages (shared-types, kafka-config, common-utils)
- ✅ Build tất cả application services (web, api-gateway, order-service, inventory-service, notification-service)

### 2. Start Docker Infrastructure + Built Services

```bash
pnpm start:local:prod
```

Lệnh này sẽ:
- ✅ Start Docker containers (Kafka, Redis, PostgreSQL, Zookeeper)
- ✅ Start built services trên máy local
- ✅ Hiển thị URLs và logs

### 3. Stop tất cả

```bash
pnpm stop:local:prod
```

## 📝 Chi Tiết

### Build Commands

| Command | Mô tả |
|---------|-------|
| `pnpm build:local` | Build tất cả services để chạy local |
| `pnpm build` | Build tất cả (generic) |

### Start/Stop Commands

| Command | Mô tả |
|---------|-------|
| `pnpm start:local:prod` | Start Docker infrastructure + Built services |
| `pnpm stop:local:prod` | Stop tất cả services |
| `pnpm infra:up` | Start chỉ Docker infrastructure |
| `pnpm infra:down` | Stop chỉ Docker infrastructure |
| `pnpm infra:logs` | View Docker infrastructure logs |
| `pnpm infra:restart` | Restart Docker infrastructure |

## 🔍 Kiểm Tra Services

### URLs

- **Web Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001/api
- **Order Service**: http://localhost:3002
- **Inventory Service**: http://localhost:3004
- **Kafka UI**: http://localhost:8080
- **pgAdmin**: http://localhost:5050

### Logs

```bash
# Web
tail -f /tmp/web.log

# API Gateway
tail -f /tmp/api-gateway.log

# Order Service
tail -f /tmp/order-service.log

# Inventory Service
tail -f /tmp/inventory-service.log

# Notification Service
tail -f /tmp/notification-service.log

# Docker Infrastructure
pnpm infra:logs
```

## 🆚 So Sánh với Dev Mode

| Aspect | Dev Mode (`pnpm dev`) | Production Build (`pnpm build:local` + `pnpm start:local:prod`) |
|--------|----------------------|----------------------------------------------------------------|
| **Build** | Không cần build | Cần build trước |
| **Hot Reload** | ✅ Có | ❌ Không |
| **Performance** | Chậm hơn | Nhanh hơn |
| **Docker** | Chỉ Kafka/Redis | Chỉ Kafka/Redis |
| **Use Case** | Development | Testing production build |

## 🛠️ Troubleshooting

### Services không start

```bash
# Kiểm tra logs
tail -f /tmp/*.log

# Kiểm tra processes
ps aux | grep "node.*apps"

# Kill processes manually
pkill -f "node.*apps/web"
pkill -f "node.*apps/api-gateway"
pkill -f "node.*apps/services"
```

### Port đã được sử dụng

```bash
# Tìm process đang dùng port
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3004

# Kill process
kill -9 <PID>
```

### Build failed

```bash
# Clean và rebuild
pnpm clean
pnpm install
pnpm build:local
```

## 📚 Related Commands

- `pnpm dev` - Development mode (hot reload)
- `pnpm start:local` - Dev mode với Docker infrastructure
- `pnpm docker:prod:build` - Build Docker images cho production
- `pnpm docker:prod:up` - Start tất cả trong Docker

---

**Happy Building! 🚀**

