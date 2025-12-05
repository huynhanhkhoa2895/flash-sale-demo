// Redis Service - Redis connection and atomic inventory operations

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { Logger, RetryUtils } from "common-utils";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      password: process.env.REDIS_PASSWORD || "flashsale123",
    });

    this.client.on("error", (error) => {
      Logger.error("Redis client error:", error);
    });

    this.client.on("connect", () => {
      Logger.info("✅ Connected to Redis");
    });

    this.client.on("ready", () => {
      Logger.info("✅ Redis client ready");
    });
  }

  async onModuleInit() {
    // Connect to Redis
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
    Logger.info("✅ Redis connection closed");
  }

  // Initialize stock for a product
  async initializeStock(
    productId: string,
    initialStock: number
  ): Promise<void> {
    const key = `stock:${productId}`;
    await this.client.set(key, initialStock.toString());
    Logger.info("Stock initialized", { productId, initialStock });
  }

  // Get current stock (for monitoring)
  async getStock(productId: string): Promise<number> {
    const key = `stock:${productId}`;
    const stock = await this.client.get(key);
    return stock ? parseInt(stock, 10) : 0;
  }

  // Atomic decrement operation - returns new stock value
  async decrementStock(
    productId: string,
    quantity: number = 1
  ): Promise<number> {
    const key = `stock:${productId}`;

    // Use DECR for atomic operation
    const newStock = await this.client.decrBy(key, quantity);

    Logger.info("Stock decremented", {
      productId,
      quantity,
      newStock,
      operation: "decrement",
    });

    return newStock;
  }

  // Atomic increment operation - for rollback
  async incrementStock(
    productId: string,
    quantity: number = 1
  ): Promise<number> {
    const key = `stock:${productId}`;

    // Use INCR for atomic operation
    const newStock = await this.client.incrBy(key, quantity);

    Logger.info("Stock incremented", {
      productId,
      quantity,
      newStock,
      operation: "increment",
    });

    return newStock;
  }

  // Set stock to a specific value
  async setStock(productId: string, stock: number): Promise<number> {
    const key = `stock:${productId}`;

    // Use SET for atomic operation
    await this.client.set(key, stock.toString());

    Logger.info("Stock set", {
      productId,
      stock,
      operation: "set",
    });

    return stock;
  }

  // Check if stock is available (without reserving)
  async checkStockAvailability(
    productId: string,
    quantity: number = 1
  ): Promise<boolean> {
    const currentStock = await this.getStock(productId);
    const available = currentStock >= quantity;

    Logger.debug("Stock availability check", {
      productId,
      quantity,
      currentStock,
      available,
    });

    return available;
  }

  // Reserve stock atomically - returns true if successful, false if insufficient stock
  async reserveStock(
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; newStock: number }> {
    const key = `stock:${productId}`;

    // Use Redis WATCH/MULTI/EXEC for atomic check and decrement
    const result = await this.reserveStockAtomic(key, quantity);

    Logger.info("Stock reservation attempt", {
      productId,
      quantity,
      success: result.success,
      newStock: result.newStock,
    });

    return result;
  }

  // Atomic stock reservation with rollback capability
  private async reserveStockAtomic(
    key: string,
    quantity: number
  ): Promise<{ success: boolean; newStock: number }> {
    // Watch the key for changes
    await this.client.watch(key);

    try {
      // Get current stock
      const currentStock = await this.client.get(key);
      const stock = currentStock ? parseInt(currentStock, 10) : 0;

      if (stock >= quantity) {
        // Sufficient stock - decrement atomically
        const multi = this.client.multi();
        multi.decrBy(key, quantity);

        const results = await multi.exec();
        if (results === null) {
          // Transaction failed due to concurrent modification - retry
          return this.reserveStockAtomic(key, quantity);
        }

        const newStock = results[0] as number;
        return { success: true, newStock };
      } else {
        // Insufficient stock
        return { success: false, newStock: stock };
      }
    } finally {
      // Always unwatch the key
      await this.client.unwatch();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      Logger.error("Redis health check failed:", error);
      return false;
    }
  }
}
