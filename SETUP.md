# 🚀 Setup Guide - Flash Sale Demo

Hướng dẫn setup hoàn chỉnh từ đầu cho môi trường mới.

## 📋 Prerequisites

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Git**: (optional, nếu clone từ repo)

### Kiểm tra Prerequisites

```bash
# Kiểm tra Node.js
node --version
# Output: v20.x.x hoặc cao hơn

# Kiểm tra pnpm
pnpm --version
# Output: 9.x.x hoặc cao hơn

# Kiểm tra Docker
docker --version
# Output: Docker version 20.10.x hoặc cao hơn

# Kiểm tra Docker Compose
docker-compose --version
# Output: Docker Compose version 2.x.x hoặc cao hơn
```

### Cài đặt pnpm (nếu chưa có)

```bash
npm install -g pnpm
```

---

## 📥 Bước 1: Clone/Download Project

### Option 1: Clone từ Git Repository

```bash
git clone <repository-url>
cd flash-sale-demo
```

### Option 2: Download và Extract

```bash
# Download ZIP file và extract
cd flash-sale-demo
```

---

## 📦 Bước 2: Install Dependencies

```bash
# Install tất cả dependencies cho monorepo
pnpm install
```

Lệnh này sẽ:

- Install dependencies cho root project
- Install dependencies cho tất cả apps (web, api-gateway, order-service, inventory-service, notification-service)
- Install dependencies cho tất cả packages (shared-types, kafka-config, common-utils)

**Thời gian:** ~2-5 phút tùy vào tốc độ internet

---

## 🐳 Bước 3: Start Docker Infrastructure

```bash
# Start tất cả Docker containers (Kafka, PostgreSQL, Redis, Kafka UI, pgAdmin)
pnpm docker:up
```

Hoặc:

```bash
docker-compose up -d
```

Lệnh này sẽ start các services:

- **Zookeeper** (port 2181)
- **Kafka** (port 9092)
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Kafka UI** (port 8080) - Web interface để monitor Kafka
- **pgAdmin** (port 5050) - Web interface để quản lý PostgreSQL

### Kiểm tra Docker Containers

```bash
# Xem status của tất cả containers
docker-compose ps

# Xem logs
pnpm docker:logs

# Hoặc xem logs của từng service
docker-compose logs kafka
docker-compose logs postgres
docker-compose logs redis
```

**Lưu ý:** Đợi 30-60 giây để Kafka và Zookeeper khởi động hoàn toàn.

---

## 🗄️ Bước 4: Initialize Database

```bash
# Database sẽ tự động được initialize khi PostgreSQL container start lần đầu
# Script init-db.sql sẽ tự động chạy

# Kiểm tra database đã được tạo chưa
docker exec postgres psql -U flashsale -d flash_sale -c "SELECT COUNT(*) FROM products;"
# Output: 1 (nếu thành công)
```

Nếu cần reset database:

```bash
# Stop containers
docker-compose down

# Xóa volumes (⚠️ Mất hết data)
docker-compose down -v

# Start lại
docker-compose up -d
```

---

## 🔧 Bước 5: Setup Environment Variables (Optional)

Project đã có default values, nhưng bạn có thể tạo `.env` file nếu cần override:

```bash
# Tạo .env file ở root (optional)
cat > .env << EOF
# Kafka
KAFKA_BROKERS=localhost:9092

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=flashsale
DB_PASSWORD=flashsale123
DB_DATABASE=flash_sale

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=flashsale123

# Services URLs
ORDER_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000

# Ports
PORT=3001
HTTP_PORT=3002
EOF
```

**Lưu ý:** `.env` file đã được ignore trong `.gitignore`, không commit vào Git.

---

## 🏗️ Bước 6: Build Packages (Optional)

Nếu bạn muốn build trước:

```bash
# Build tất cả packages và apps
pnpm build
```

**Lưu ý:** Không bắt buộc cho development mode, nhưng nên build trước khi deploy.

---

## 🚀 Bước 7: Start Services

### Option 1: Start Tất Cả Services Cùng Lúc

```bash
# Start tất cả services trong parallel
pnpm dev
```

Lệnh này sẽ start:

- Web Frontend (port 3000)
- API Gateway (port 3001)
- Order Service (port 3002)
- Inventory Service
- Notification Service

### Option 2: Start Từng Service Riêng (Recommended cho lần đầu)

Mở **5 terminal windows/tabs** và chạy từng service:

**Terminal 1 - Web Frontend:**

```bash
pnpm dev:web
# Wait for: "Ready on http://localhost:3000"
```

**Terminal 2 - API Gateway:**

```bash
pnpm dev:gateway
# Wait for: "🚀 API Gateway is running on: http://localhost:3001"
```

**Terminal 3 - Order Service:**

```bash
pnpm dev:order
# Wait for: "🚀 Order Service HTTP server running on port 3002"
# Wait for: "🚀 Order Service Kafka microservice started"
```

**Terminal 4 - Inventory Service:**

```bash
pnpm dev:inventory
# Wait for: "✅ Initialized stock counters for 1 products"
# Wait for: "🚀 Inventory Service is running as Kafka microservice"
```

**Terminal 5 - Notification Service:**

```bash
pnpm dev:notification
# Wait for: "🚀 Notification Service is running as Kafka microservice"
```

---

## ✅ Bước 8: Verify Setup

### Quick Verify (Automated)

```bash
# Chạy script tự động để verify setup
pnpm verify
```

Script này sẽ kiểm tra:

- ✅ Prerequisites (Node.js, pnpm, Docker)
- ✅ Docker containers đang chạy
- ✅ Database accessible
- ✅ Redis accessible
- ✅ Services đang chạy (nếu đã start)
- ✅ Kafka topics

### Manual Verify

### 1. Kiểm tra Services Đang Chạy

```bash
# Kiểm tra ports
netstat -ano | findstr ":3000"  # Web
netstat -ano | findstr ":3001"  # API Gateway
netstat -ano | findstr ":3002"  # Order Service
netstat -ano | findstr ":9092"  # Kafka
netstat -ano | findstr ":5432"  # PostgreSQL
netstat -ano | findstr ":6379"  # Redis
```

### 2. Kiểm tra Web Interface

- **Frontend**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **pgAdmin**: http://localhost:5050
  - Email: `admin@flashsale.com`
  - Password: `admin123`

### 3. Test API Endpoint

```bash
# Test API Gateway health (nếu có endpoint)
curl http://localhost:3001/health

# Hoặc mở browser và vào http://localhost:3000
```

### 4. Kiểm tra Kafka Topics

```bash
# Vào Kafka UI: http://localhost:8080
# Hoặc dùng Kafka CLI
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

Bạn sẽ thấy các topics:

- `order.created`
- `order.saved`
- `order.confirmed`
- `order.cancelled`
- `inventory.reserved`
- `inventory.insufficient`
- `notification.order_update`
- `notification.stock_update`

---

## 🎯 Bước 9: Reset Stock cho Demo

Để demo race condition với 1 sản phẩm:

```bash
# Reset stock về 1
pnpm reset:stock
```

Hoặc manual:

```bash
# Update PostgreSQL
docker exec postgres psql -U flashsale -d flash_sale -c "UPDATE products SET current_stock = 1 WHERE id = 'FLASH_SALE_PRODUCT_001';"

# Update Redis
docker exec redis redis-cli -a flashsale123 SET stock:FLASH_SALE_PRODUCT_001 1
```

---

## 🎬 Bước 10: Run Demo

1. **Mở browser**: http://localhost:3000

2. **Mở 2 tabs/windows** để demo race condition:
   - Tab 1: http://localhost:3000
   - Tab 2: http://localhost:3000

3. **Điền thông tin khác nhau**:
   - Tab 1: User ID = `user_1`, Quantity = 1
   - Tab 2: User ID = `user_2`, Quantity = 1

4. **Click "Buy Now" đồng thời** ở cả 2 tabs

5. **Kết quả mong đợi**:
   - ✅ Tab 1: Order CONFIRMED
   - ❌ Tab 2: Order CANCELLED (Out of stock)

---

## 🔍 Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Tìm process đang dùng port
netstat -ano | findstr ":3000"

# Kill process (thay PID bằng process ID)
taskkill /PID <PID> /F
```

### Lỗi: Kafka không connect được

```bash
# Kiểm tra Kafka đã start chưa
docker-compose ps kafka

# Xem logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Lỗi: Database connection failed

```bash
# Kiểm tra PostgreSQL
docker-compose ps postgres

# Xem logs
docker-compose logs postgres

# Test connection
docker exec postgres psql -U flashsale -d flash_sale -c "SELECT 1;"
```

### Lỗi: Redis connection failed

```bash
# Kiểm tra Redis
docker-compose ps redis

# Test connection
docker exec redis redis-cli -a flashsale123 PING
# Output: PONG
```

### Lỗi: Services không start

```bash
# Clean và rebuild
pnpm clean
pnpm install
pnpm build

# Restart Docker
docker-compose down
docker-compose up -d

# Start services lại
pnpm dev
```

### Lỗi: Module not found

```bash
# Reinstall dependencies
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

---

## 📊 Verify Complete Setup

Checklist để đảm bảo setup hoàn chỉnh:

- [ ] ✅ Docker containers đang chạy (6 containers)
- [ ] ✅ Web Frontend accessible tại http://localhost:3000
- [ ] ✅ API Gateway accessible tại http://localhost:3001
- [ ] ✅ Kafka UI accessible tại http://localhost:8080
- [ ] ✅ PostgreSQL có data (1 product)
- [ ] ✅ Redis có stock counter set
- [ ] ✅ Tất cả services đã start và không có errors
- [ ] ✅ Có thể tạo order từ frontend
- [ ] ✅ Order được process và update status

---

## 🛑 Stop Services

### Stop Application Services

```bash
# Stop tất cả Node.js services (Ctrl+C trong mỗi terminal)
# Hoặc kill processes
taskkill /F /IM node.exe
```

### Stop Docker Infrastructure

```bash
# Stop containers (giữ data)
pnpm docker:down

# Hoặc
docker-compose down

# Stop và xóa volumes (⚠️ Mất hết data)
docker-compose down -v
```

---

## 🔄 Reset Everything

Nếu muốn reset hoàn toàn về trạng thái ban đầu:

```bash
# 1. Stop tất cả services
docker-compose down -v
taskkill /F /IM node.exe

# 2. Clean build artifacts
pnpm clean

# 3. Xóa node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# 4. Start lại từ đầu
pnpm install
docker-compose up -d
# Đợi 30-60 giây
pnpm dev
```

---

## 📝 Next Steps

Sau khi setup thành công:

1. **Đọc README.md** để hiểu architecture
2. **Đọc DEMO_EXPLANATION.md** để hiểu những gì demo chứng minh
3. **Explore codebase** để học về Kafka patterns
4. **Modify và experiment** để hiểu sâu hơn

---

## 🆘 Need Help?

Nếu gặp vấn đề:

1. Kiểm tra logs của từng service
2. Kiểm tra Docker containers status
3. Xem Troubleshooting section ở trên
4. Đảm bảo tất cả prerequisites đã được cài đặt đúng version

---

**Happy Coding! 🚀**
