# 🚀 Local Development Guide

Hướng dẫn chạy services trực tiếp trên máy local, chỉ dùng Docker cho infrastructure (Kafka, Redis, PostgreSQL).

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Docker**: & docker-compose (chỉ cho Kafka, Redis, PostgreSQL)

## 🚀 Quick Start

### 1. Start Docker Infrastructure

```bash
# Start chỉ Kafka, Redis, PostgreSQL
pnpm docker:up

# Hoặc
docker-compose -f docker-compose.local.yml up -d
```

**Services trong Docker:**
- ✅ Kafka (port 9092)
- ✅ Redis (port 6379)
- ✅ PostgreSQL (port 5432)
- ✅ Kafka UI (port 8080) - Optional
- ✅ pgAdmin (port 5050) - Optional

### 2. Start Application Services (trên máy local)

```bash
# Start tất cả services cùng lúc
pnpm dev

# Hoặc start từng service riêng:
pnpm dev:web          # Next.js frontend (http://localhost:3000)
pnpm dev:gateway      # API Gateway (http://localhost:3001/api)
pnpm dev:order        # Order Service (http://localhost:3002)
pnpm dev:inventory    # Inventory Service
pnpm dev:notification # Notification Service
```

## 🔧 Configuration

Tất cả services đã được config để connect đến `localhost`:

- **Kafka**: `localhost:9092`
- **Redis**: `localhost:6379`
- **PostgreSQL**: `localhost:5432`

Không cần thay đổi gì, các services sẽ tự động connect đến localhost.

## 📡 Ports

| Service | Port | URL |
|---------|------|-----|
| Web Frontend | 3000 | http://localhost:3000 |
| API Gateway HTTP | 3001 | http://localhost:3001/api |
| API Gateway WebSocket | 3003 | http://localhost:3003/ws |
| Order Service | 3002 | http://localhost:3002 |
| Kafka | 9092 | localhost:9092 |
| Redis | 6379 | localhost:6379 |
| PostgreSQL | 5432 | localhost:5432 |
| Kafka UI | 8080 | http://localhost:8080 |
| pgAdmin | 5050 | http://localhost:5050 |

## 🛑 Stop Services

### Stop Application Services
```bash
# Kill tất cả Node.js processes
pkill -f "flash-sale-demo.*node"

# Hoặc Ctrl+C trong mỗi terminal
```

### Stop Docker Infrastructure
```bash
pnpm docker:down

# Hoặc
docker-compose -f docker-compose.local.yml down
```

## 🔄 Reset Stock

```bash
# Reset stock về 1
pnpm reset:stock
```

## ✅ Advantages

**Ưu điểm của cách này:**
- ✅ Hot reload nhanh hơn (không cần rebuild Docker image)
- ✅ Debug dễ dàng hơn (attach debugger trực tiếp)
- ✅ Logs rõ ràng hơn (xem trực tiếp trong terminal)
- ✅ Không cần rebuild khi code thay đổi
- ✅ Tiết kiệm tài nguyên (chỉ chạy infrastructure trong Docker)

## 🆚 So sánh với Docker Setup

| Aspect | Local Development | Docker Setup |
|--------|------------------|--------------|
| **Hot Reload** | ⚡ Rất nhanh | 🐢 Chậm hơn |
| **Debug** | ✅ Dễ dàng | ❌ Khó hơn |
| **Setup** | ✅ Đơn giản | ⚠️ Phức tạp hơn |
| **Portability** | ❌ Cần Node.js | ✅ Chỉ cần Docker |
| **Resource** | ✅ Nhẹ hơn | ⚠️ Nặng hơn |

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng
```bash
# Tìm process đang dùng port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Lỗi: Kafka không connect được
```bash
# Kiểm tra Kafka đã start chưa
docker-compose -f docker-compose.local.yml ps kafka

# Xem logs
docker-compose -f docker-compose.local.yml logs kafka
```

### Lỗi: Redis connection failed
```bash
# Test Redis
docker exec redis redis-cli -a flashsale123 PING
# Output: PONG
```

## 📝 Notes

- Services chạy trực tiếp trên máy sẽ connect đến `localhost`
- Docker containers expose ports ra `localhost` nên services có thể connect được
- Không cần thay đổi environment variables
- Tất cả services đã được config để dùng `localhost` thay vì Docker network names

---

**Happy Coding! 🚀**

