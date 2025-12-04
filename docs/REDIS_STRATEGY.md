# 🔴 Redis Write Strategy trong Demo

## 📋 Redis Strategy: Cache-Aside Pattern

Trong demo này, Redis được sử dụng theo **Cache-Aside Pattern** (còn gọi là Lazy Loading), không phải Write-Through hay Write-Back.

---

## 🔄 Flow Hiện Tại

### 1. **Initialization (Read-First)**

```typescript
// Khi Inventory Service start
async initializeStockCounters() {
  // 1. READ từ Database (source of truth)
  const products = await this.productRepository.find();

  // 2. WRITE vào Redis (cache)
  for (const product of products) {
    await this.redisService.initializeStock(
      product.id,
      product.currentStock  // Từ database
    );
  }
}
```

**Flow:** Database → Redis (Read-First)

### 2. **Order Processing (Write-First)**

```typescript
// Khi có order.saved event
async processOrderSaved(orderData) {
  // 1. WRITE vào Redis TRƯỚC (atomic DECR)
  const reservation = await this.redisService.reserveStock(
    orderData.productId,
    orderData.quantity
  );

  // 2. Check kết quả
  if (reservation.success) {
    // Stock đủ → Publish event
    // Database KHÔNG được update stock counter
  } else {
    // Stock không đủ → Publish cancellation event
  }
}
```

**Flow:** Redis DECR → Check result → Publish event

**Database:** Chỉ lưu orders, KHÔNG update stock counter

---

## 🎯 Tại Sao "Write-First" Với Redis?

### 1. **Atomic Operations**

Redis DECR là atomic → **phải write vào Redis trước** để:

- ✅ Đảm bảo atomicity
- ✅ Tránh race condition
- ✅ Trả về giá trị mới ngay lập tức

### 2. **Performance**

```typescript
// ❌ Nếu check database trước:
const stock = await db.getStock(productId); // ~10ms
if (stock >= quantity) {
  await db.updateStock(productId, -quantity); // ~10ms
  // Total: ~20ms + có thể bị race condition
}

// ✅ Write Redis trước:
const newStock = await redis.decrBy(key, quantity); // ~0.1ms
if (newStock >= 0) {
  // Success - chỉ 1 operation atomic
  // Total: ~0.1ms + không thể bị race condition
}
```

### 3. **Single Source of Truth**

Trong demo này:

- **Redis**: Source of truth cho stock counter (real-time)
- **Database**: Source of truth cho orders và product metadata
- **Không sync**: Database stock counter không được update

---

## 📊 Cache Strategies So Sánh

### 1. **Cache-Aside (Lazy Loading)** ← Demo này dùng

```
Read:
1. Check cache (Redis)
2. If miss → Read from DB
3. Write to cache

Write:
1. Write to cache (Redis) ← Write-First
2. Publish event
3. Database không update stock counter
```

**Ưu điểm:**

- ✅ Simple
- ✅ Fast writes
- ✅ Database không bị overload

**Nhược điểm:**

- ❌ Cache miss → phải read DB
- ❌ Không sync với database

### 2. **Write-Through**

```
Write:
1. Write to cache (Redis)
2. Write to database (sync)
3. Return
```

**Ưu điểm:**

- ✅ Cache và DB luôn sync
- ✅ Data consistency

**Nhược điểm:**

- ❌ Slower writes (2 operations)
- ❌ Database bottleneck

### 3. **Write-Back (Write-Behind)**

```
Write:
1. Write to cache (Redis) only
2. Return immediately
3. Async write to database later
```

**Ưu điểm:**

- ✅ Fastest writes
- ✅ Database không bị block

**Nhược điểm:**

- ❌ Risk of data loss nếu cache crash
- ❌ Complex implementation

---

## 🔍 Trong Demo Này

### Stock Counter Strategy

```typescript
// Initialization: Read-First
Database (products.current_stock) → Redis (stock:productId)

// Order Processing: Write-First
Redis DECR → Check result → Publish event
Database: KHÔNG update stock counter
```

**Tại sao không sync với database?**

1. **Performance**: Database UPDATE chậm hơn Redis 100x
2. **Atomicity**: Redis DECR đảm bảo atomic, database UPDATE có thể bị race condition
3. **Scalability**: Redis có thể handle hàng triệu operations/second
4. **Simplicity**: Không cần complex sync logic

### Order Data Strategy

```typescript
// Orders được lưu vào Database (PostgreSQL)
// Redis chỉ dùng cho stock counter
```

**Separation of Concerns:**

- **Redis**: Real-time stock counter (volatile, fast)
- **Database**: Persistent orders và product metadata (durable, slower)

---

## 💡 Khi Nào Cần Sync?

### Trong Production, có thể cần:

1. **Periodic Sync**: Sync Redis → Database định kỳ
2. **Event-Driven Sync**: Sync khi có significant changes
3. **Dual Write**: Write cả Redis và Database (Write-Through)

**Ví dụ:**

```typescript
// Write-Through approach
async reserveStock(productId: string, quantity: number) {
  // 1. Redis DECR (atomic)
  const newStock = await redis.decrBy(key, quantity);

  if (newStock >= 0) {
    // 2. Update database (async, eventual consistency)
    await db.updateStock(productId, newStock);
    return { success: true, newStock };
  } else {
    // Rollback Redis
    await redis.incrBy(key, quantity);
    return { success: false, newStock };
  }
}
```

---

## 🎓 Key Takeaways

1. **Demo này dùng Cache-Aside**: Read-First init, Write-First processing
2. **Redis là source of truth** cho stock counter trong runtime
3. **Database không sync** stock counter (chỉ lưu orders)
4. **Write-First** vì Redis atomic operations cần execute trước
5. **Performance**: Redis ~0.1ms vs Database ~10ms

---

## 🔄 Flow Diagram

```
┌─────────────┐
│   Startup   │
└──────┬──────┘
       │
       ▼
┌─────────────┐      Read-First      ┌─────────────┐
│  Database   │ ────────────────────► │    Redis    │
│ (products)  │                       │ (stock:xxx) │
└─────────────┘                       └─────────────┘
                                             │
                                             │ Write-First
                                             ▼
                                    ┌─────────────┐
                                    │   Order     │
                                    │ Processing  │
                                    └─────────────┘
```

---

**💡 Summary:** Demo này dùng **Cache-Aside với Write-First** cho stock counter để đảm bảo atomicity và performance!
