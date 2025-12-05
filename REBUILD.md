# 🔄 Hướng Dẫn Rebuild và Chạy Lại

## 🚀 Production Mode (Docker)

### Cách 1: Rebuild và Start Tất Cả (Recommended)

```bash
# Rebuild tất cả images và start lại containers
pnpm docker:prod:rebuild
```

Lệnh này sẽ:

- Build lại tất cả Docker images
- Tạo lại containers với code mới
- Start tất cả services

### Cách 2: Rebuild Từng Bước

```bash
# 1. Stop tất cả containers
pnpm docker:prod:down

# 2. Build lại tất cả images
pnpm docker:prod:build

# 3. Start lại containers
pnpm docker:prod:up
```

### Cách 3: Rebuild Chỉ Một Service Cụ Thể

```bash
# Ví dụ: chỉ rebuild API Gateway
docker-compose -f docker-compose.prod.yml build api-gateway
docker-compose -f docker-compose.prod.yml up -d api-gateway

# Hoặc rebuild và restart
docker-compose -f docker-compose.prod.yml up -d --build api-gateway
```

### Cách 4: Restart Không Rebuild (Nếu chỉ thay đổi config)

```bash
# Restart tất cả containers (không rebuild)
pnpm docker:prod:restart

# Hoặc restart một service cụ thể
docker-compose -f docker-compose.prod.yml restart api-gateway
```

---

## 🔧 Development Mode

### Rebuild và Chạy Development

```bash
# 1. Stop infrastructure
pnpm docker:down

# 2. Rebuild local code (nếu cần)
pnpm build

# 3. Start lại infrastructure
pnpm docker:up

# 4. Start services local (trong terminal khác)
pnpm dev
```

---

## 📋 Các Lệnh Hữu Ích

### Xem Logs

```bash
# Xem logs tất cả services
pnpm docker:prod:logs

# Xem logs một service cụ thể
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f web
```

### Kiểm Tra Status

```bash
# Xem status tất cả containers
docker-compose -f docker-compose.prod.yml ps

# Xem logs real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Clean và Rebuild Hoàn Toàn

```bash
# 1. Stop và xóa containers + volumes
docker-compose -f docker-compose.prod.yml down -v

# 2. Xóa images cũ (optional)
docker rmi flash-sale-demo-web flash-sale-demo-api-gateway flash-sale-demo-order-service flash-sale-demo-inventory-service flash-sale-demo-notification-service

# 3. Rebuild từ đầu
pnpm docker:prod:rebuild
```

### Reset Stock Sau Khi Rebuild

```bash
# Reset stock về 1 cho demo
pnpm reset:stock:prod
```

---

## 🎯 Workflow Thông Dụng

### Khi Sửa Code và Muốn Test Ngay

```bash
# Option 1: Rebuild service cụ thể (nhanh nhất)
docker-compose -f docker-compose.prod.yml up -d --build api-gateway

# Option 2: Rebuild tất cả
pnpm docker:prod:rebuild
```

### Khi Deploy Production

```bash
# 1. Pull code mới nhất
git pull

# 2. Rebuild và start
pnpm docker:prod:rebuild

# 3. Kiểm tra logs
pnpm docker:prod:logs

# 4. Verify
curl http://localhost:3000
curl http://localhost:3001/api/orders/test123
```

---

## ⚡ Quick Commands

```bash
# Rebuild tất cả và start
pnpm docker:prod:rebuild

# Restart không rebuild
pnpm docker:prod:restart

# Stop tất cả
pnpm docker:prod:down

# Xem logs
pnpm docker:prod:logs

# Reset stock
pnpm reset:stock:prod
```

---

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Tìm process đang dùng port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill process nếu cần
kill -9 <PID>
```

### Lỗi: Container không start

```bash
# Xem logs chi tiết
docker-compose -f docker-compose.prod.yml logs <service-name>

# Restart container
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Lỗi: Build failed

```bash
# Clean và rebuild
docker-compose -f docker-compose.prod.yml down
docker system prune -f
pnpm docker:prod:rebuild
```

---

**Happy Coding! 🚀**
