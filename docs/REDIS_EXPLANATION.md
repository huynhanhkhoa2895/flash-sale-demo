# 🔴 Redis DECR Explained

## DECR Là Gì?

**DECR** là Redis command viết tắt của **"DECREMENT"** - giảm giá trị của một key đi 1.

### Cú Pháp

```redis
DECR key
```

**Ví dụ:**

```redis
# Set giá trị ban đầu
SET stock:product_001 100

# Giảm đi 1
DECR stock:product_001
# Kết quả: 99

# Giảm thêm 1
DECR stock:product_001
# Kết quả: 98
```

### DECRBY - Giảm Nhiều Hơn

Nếu muốn giảm nhiều hơn 1, dùng **DECRBY**:

```redis
DECRBY key decrement

# Ví dụ: Giảm đi 5
DECRBY stock:product_001 5
# Nếu stock = 100 → kết quả: 95
```

---

## 🔑 Tại Sao DECR Quan Trọng?

### 1. **Atomic Operation**

**DECR là ATOMIC** - nghĩa là:

- ✅ Chỉ là **1 command duy nhất**
- ✅ **Không thể bị interrupt** bởi process khác
- ✅ **Không thể bị race condition**

**So sánh với Database:**

```sql
-- Database: CẦN 2 COMMANDS (có thể bị race condition)
SELECT stock FROM products WHERE id = 'product_001';  -- Step 1
UPDATE products SET stock = stock - 1 WHERE id = 'product_001';  -- Step 2
-- ❌ Giữa Step 1 và Step 2, process khác có thể modify stock!
```

```redis
-- Redis: CHỈ 1 COMMAND (atomic)
DECR stock:product_001
-- ✅ Không thể bị interrupt!
```

### 2. **Return Value**

DECR **trả về giá trị mới** sau khi giảm:

```redis
SET stock:product_001 5
DECR stock:product_001
# Return: 4

DECR stock:product_001
# Return: 3
```

**Điều này quan trọng vì:**

- Có thể check ngay stock còn lại
- Không cần query lại
- Biết được stock có âm không (oversold)

### 3. **Có Thể Giảm Xuống Âm**

DECR **có thể giảm xuống âm**:

```redis
SET stock:product_001 1
DECR stock:product_001
# Return: 0

DECR stock:product_001
# Return: -1  ← Âm!
```

**Trong demo này, chúng ta check:**

```typescript
const newStock = await redis.decrBy(key, quantity);

if (newStock >= 0) {
  // ✅ Stock đủ hoặc vừa đủ
  return { success: true, newStock };
} else {
  // ❌ Stock không đủ (đã âm)
  // Rollback ngay lập tức
  await redis.incrBy(key, quantity); // Trả lại
  return { success: false, newStock };
}
```

---

## 💻 Trong Code Demo

### File: `apps/services/inventory-service/src/modules/redis/redis.service.ts`

```typescript
// Method 1: Simple DECR
async decrementStock(productId: string, quantity: number = 1): Promise<number> {
  const key = `stock:${productId}`;

  // DECRBY là atomic operation
  const newStock = await this.client.decrBy(key, quantity);

  return newStock; // Trả về giá trị mới
}

// Method 2: Reserve Stock với WATCH/MULTI/EXEC
async reserveStockAtomic(key: string, quantity: number) {
  // 1. WATCH key để detect concurrent modifications
  await this.client.watch(key);

  try {
    // 2. Get current stock
    const stock = await this.client.get(key);

    if (stock >= quantity) {
      // 3. MULTI: Bắt đầu transaction
      const multi = this.client.multi();

      // 4. DECRBY trong transaction (atomic)
      multi.decrBy(key, quantity);

      // 5. EXEC: Execute transaction
      const results = await multi.exec();

      if (results === null) {
        // Key bị modify bởi process khác → retry
        return this.reserveStockAtomic(key, quantity);
      }

      // 6. Lấy giá trị mới từ kết quả
      const newStock = results[0] as number;
      return { success: true, newStock };
    } else {
      return { success: false, newStock: stock };
    }
  } finally {
    await this.client.unwatch();
  }
}
```

---

## 🎯 Ví Dụ Thực Tế

### Scenario: 2 Users Cùng Lúc Mua

**Stock ban đầu: 1**

**User 1:**

```redis
WATCH stock:product_001
GET stock:product_001  # Return: 1
MULTI
DECRBY stock:product_001 1
EXEC  # Return: [0] ✅ Success
```

**User 2 (cùng lúc):**

```redis
WATCH stock:product_001
GET stock:product_001  # Return: 1 (chưa biết User 1 đã DECR)
MULTI
DECRBY stock:product_001 1
EXEC  # Return: null ❌ Failed (key đã bị modify)
# → Retry → GET stock:product_001 → Return: 0
# → Stock không đủ → Return { success: false }
```

**Kết quả:**

- ✅ User 1: Stock = 0 → Success
- ❌ User 2: Stock = 0 → Failed (không đủ stock)

---

## 📊 So Sánh Các Redis Commands

| Command    | Mô Tả       | Atomic? | Return Value     |
| ---------- | ----------- | ------- | ---------------- |
| **DECR**   | Giảm đi 1   | ✅ Yes  | Giá trị mới      |
| **DECRBY** | Giảm đi N   | ✅ Yes  | Giá trị mới      |
| **INCR**   | Tăng lên 1  | ✅ Yes  | Giá trị mới      |
| **INCRBY** | Tăng lên N  | ✅ Yes  | Giá trị mới      |
| **GET**    | Lấy giá trị | ✅ Yes  | Giá trị hiện tại |
| **SET**    | Set giá trị | ✅ Yes  | "OK"             |

**Tất cả Redis commands đều là atomic!**

---

## 🔍 Các Redis Commands Liên Quan

### INCR / INCRBY (Tăng)

```redis
# Tăng lên 1
INCR stock:product_001

# Tăng lên N
INCRBY stock:product_001 5
```

**Dùng để:**

- Rollback khi stock không đủ
- Restock sản phẩm

### GET (Lấy Giá Trị)

```redis
GET stock:product_001
# Return: "100" (string)
```

**Lưu ý:** Redis lưu values dưới dạng **string**, cần parse sang number.

### SET (Set Giá Trị)

```redis
SET stock:product_001 100
```

**Dùng để:**

- Initialize stock khi service start
- Reset stock cho demo

---

## 🎓 Key Takeaways

1. **DECR là atomic**: Không thể bị race condition
2. **Return value**: Trả về giá trị mới sau khi giảm
3. **Có thể âm**: Cần check `newStock >= 0`
4. **WATCH/MULTI/EXEC**: Optimistic locking để detect concurrent modifications
5. **High performance**: Nhanh hơn database 100x

---

## 📚 Redis Documentation

- **DECR**: https://redis.io/commands/decr/
- **DECRBY**: https://redis.io/commands/decrby/
- **WATCH/MULTI/EXEC**: https://redis.io/docs/manual/transactions/

---

**💡 Tip:** Trong production, có thể dùng Redis Lua scripts để combine multiple operations thành 1 atomic operation!

---

## 📖 Xem Thêm

- **Redis Write Strategy**: [REDIS_STRATEGY.md](./REDIS_STRATEGY.md) - Giải thích về Cache-Aside và Write-First pattern
