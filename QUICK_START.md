# 🚀 Quick Start - Local Development

Hướng dẫn nhanh để chạy Docker infrastructure và services trên máy local.

## 📋 Cách 1: Start Tất Cả Cùng Lúc (Recommended)

```bash
# Start Docker infrastructure + Application services
pnpm start:local
```

Lệnh này sẽ:
1. ✅ Start Docker containers (Kafka, Redis, PostgreSQL)
2. ✅ Đợi infrastructure sẵn sàng
3. ✅ Start tất cả application services

**Stop:** `Ctrl+C` để stop services, sau đó `pnpm stop:infra` để stop Docker

---

## 📋 Cách 2: Start Từng Bước

### Bước 1: Start Docker Infrastructure

```bash
# Start chỉ Docker (Kafka, Redis, PostgreSQL)
pnpm infra:up

# Hoặc
docker-compose -f docker-compose.local.yml up -d
```

**Kiểm tra:**
```bash
docker-compose -f docker-compose.local.yml ps
```

### Bước 2: Start Application Services

```bash
# Start tất cả services cùng lúc
pnpm dev

# Hoặc start từng service riêng:
pnpm dev:web          # Web Frontend
pnpm dev:gateway      # API Gateway
pnpm dev:order        # Order Service
pnpm dev:inventory    # Inventory Service
pnpm dev:notification # Notification Service
```

---

## 🛑 Stop Services

### Stop Tất Cả

```bash
pnpm stop:local
```

### Stop Từng Phần

```bash
# Stop application services
# (Press Ctrl+C trong terminal đang chạy pnpm dev)

# Stop Docker infrastructure
pnpm infra:down

# Hoặc
docker-compose -f docker-compose.local.yml down
```

---

## 📊 Ports

| Service | Port | URL |
|---------|------|-----|
| Web Frontend | 3000 | http://localhost:3000 |
| API Gateway HTTP | 3001 | http://localhost:3001/api |
| API Gateway WebSocket | 3003 | http://localhost:3003/ws |
| Order Service | 3002 | http://localhost:3002 |
| Inventory Service HTTP | 3004 | http://localhost:3004 |
| Kafka | 9092 | localhost:9092 |
| Redis | 6379 | localhost:6379 |
| PostgreSQL | 5432 | localhost:5432 |
| Kafka UI | 8080 | http://localhost:8080 |
| pgAdmin | 5050 | http://localhost:5050 |

---

## 🔧 Useful Commands

```bash
# Docker Infrastructure
pnpm infra:up         # Start Docker containers
pnpm infra:down      # Stop Docker containers
pnpm infra:logs      # View Docker logs
pnpm infra:restart   # Restart Docker containers

# Application Services
pnpm dev              # Start all services
pnpm dev:web          # Start only web
pnpm dev:gateway      # Start only API Gateway
# ... etc

# Reset Stock
pnpm reset:stock      # Reset stock to 1

# Verify Setup
pnpm verify           # Check all prerequisites
```

---

## 📝 Workflow Thông Thường

```bash
# 1. Start Docker infrastructure
pnpm infra:up

# 2. Đợi 10-15 giây để infrastructure sẵn sàng

# 3. Start application services
pnpm dev

# 4. Mở browser: http://localhost:3000

# 5. Khi xong, stop:
#    Ctrl+C (stop services)
#    pnpm infra:down (stop Docker)
```

---

## 🆘 Troubleshooting

### Port đã được sử dụng
```bash
lsof -i :3001
kill -9 <PID>
```

### Kafka không connect được
```bash
docker-compose -f docker-compose.local.yml logs kafka
docker-compose -f docker-compose.local.yml restart kafka
```

### Services không start
```bash
# Check logs
pnpm logs:infra

# Restart Docker
pnpm infra:restart
# Hoặc
pnpm infra:down
pnpm infra:up
```

---

**Happy Coding! 🚀**

