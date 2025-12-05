# 🐳 Docker Setup Guide

Hướng dẫn chạy ứng dụng với Docker cho cả môi trường Development và Production.

## 📋 Prerequisites

- Docker >= 20.10.0
- Docker Compose >= 2.0.0

## 🚀 Development Mode

Chạy infrastructure (Kafka, PostgreSQL, Redis) trong Docker, còn các services chạy local với hot-reload.

### Bước 1: Start Infrastructure

```bash
# Start infrastructure services (Kafka, PostgreSQL, Redis, Kafka UI, pgAdmin)
pnpm docker:up

# Hoặc
docker-compose -f docker-compose.dev.yml up -d
```

### Bước 2: Start Application Services (Local)

```bash
# Start tất cả services cùng lúc
pnpm dev

# Hoặc start từng service riêng
pnpm dev:web
pnpm dev:gateway
pnpm dev:order
pnpm dev:inventory
pnpm dev:notification
```

### Bước 3: Verify

- Frontend: http://localhost:3000
- API Gateway: http://localhost:3001/api
- Kafka UI: http://localhost:8080
- pgAdmin: http://localhost:5050

### Stop Development

```bash
# Stop infrastructure
pnpm docker:down

# Stop application services: Ctrl+C trong các terminal windows
```

---

## 🏭 Production Mode

Chạy tất cả services trong Docker containers (build và run).

### Bước 1: Build và Start Tất Cả Services

```bash
# Build và start tất cả services (infrastructure + applications)
pnpm docker:prod:up-build

# Hoặc build riêng rồi start
pnpm docker:prod:build
pnpm docker:prod:up
```

### Bước 2: Verify

- Frontend: http://localhost:3000
- API Gateway: http://localhost:3001/api
- Order Service: http://localhost:3002

### Xem Logs

```bash
# Xem logs của tất cả services
pnpm docker:prod:logs

# Xem logs của một service cụ thể
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f order-service
```

### Stop Production

```bash
# Stop tất cả containers
pnpm docker:prod:down

# Stop và xóa volumes (⚠️ Mất hết data)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🔧 Reset Stock (Production)

```bash
# Reset stock về 1 cho demo
pnpm reset:stock:prod
```

---

## 📊 Services và Ports

### Infrastructure (cả dev và prod)
- **Zookeeper**: 2181
- **Kafka**: 9092, 29092
- **PostgreSQL**: 5432
- **Redis**: 6379
- **Kafka UI**: 8080 (chỉ dev)
- **pgAdmin**: 5050 (chỉ dev)

### Application Services (production)
- **Web Frontend**: 3000
- **API Gateway**: 3001
- **Order Service**: 3002
- **Inventory Service**: (Kafka microservice, không có HTTP port)
- **Notification Service**: (Kafka microservice, không có HTTP port)

---

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Kiểm tra port đang được sử dụng
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill process nếu cần
kill -9 <PID>
```

### Lỗi: Build failed

```bash
# Clean và rebuild
docker-compose -f docker-compose.prod.yml down
docker system prune -f
pnpm docker:prod:build
```

### Lỗi: Services không kết nối được với Kafka

```bash
# Kiểm tra Kafka đã start chưa
docker-compose -f docker-compose.prod.yml ps kafka

# Xem logs
docker-compose -f docker-compose.prod.yml logs kafka

# Đợi 30-60 giây để Kafka khởi động hoàn toàn
```

### Lỗi: Database connection failed

```bash
# Kiểm tra PostgreSQL
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker exec postgres-prod psql -U flashsale -d flash_sale -c "SELECT 1;"
```

### Lỗi: Redis connection failed

```bash
# Kiểm tra Redis
docker-compose -f docker-compose.prod.yml ps redis

# Test connection
docker exec redis-prod redis-cli -a flashsale123 PING
```

---

## 🔄 Rebuild một Service Cụ Thể

```bash
# Rebuild chỉ web service
docker-compose -f docker-compose.prod.yml build web
docker-compose -f docker-compose.prod.yml up -d web

# Rebuild chỉ api-gateway
docker-compose -f docker-compose.prod.yml build api-gateway
docker-compose -f docker-compose.prod.yml up -d api-gateway
```

---

## 📝 Environment Variables

Các services trong production sử dụng các biến môi trường sau (đã được set trong docker-compose.prod.yml):

- `KAFKA_BROKERS`: kafka:29092
- `DB_HOST`: postgres
- `REDIS_HOST`: redis
- `FRONTEND_URL`: http://web:3000
- `ORDER_SERVICE_URL`: http://order-service:3002

Bạn có thể override bằng cách tạo `.env` file hoặc sửa docker-compose.prod.yml.

---

## 🎯 Quick Start Commands

### Development
```bash
pnpm docker:up      # Start infrastructure
pnpm dev            # Start all services locally
```

### Production
```bash
pnpm docker:prod:up-build    # Build và start tất cả
pnpm docker:prod:logs        # Xem logs
pnpm docker:prod:down        # Stop tất cả
```

---

**Happy Coding! 🚀**

