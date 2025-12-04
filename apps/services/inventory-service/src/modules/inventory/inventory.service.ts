// Inventory Service - Handles inventory reservations and stock management

import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductEntity } from "./product.entity";
import { RedisService } from "../redis/redis.service";
import { Logger, createBaseEvent } from "common-utils";

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly redisService: RedisService,
    @Inject("KAFKA_CLIENT")
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    // Initialize stock counters from database on startup
    await this.initializeStockCounters();

    await this.kafkaClient.connect();
    Logger.info("✅ Inventory Service Kafka client connected");
  }

  // Initialize Redis stock counters from database
  private async initializeStockCounters(): Promise<void> {
    try {
      const products = await this.productRepository.find();

      for (const product of products) {
        await this.redisService.initializeStock(
          product.id,
          product.currentStock
        );
        Logger.info("Initialized stock counter for product", {
          productId: product.id,
          stock: product.currentStock,
        });
      }

      Logger.info(
        `✅ Initialized stock counters for ${products.length} products`
      );
    } catch (error) {
      Logger.error("Failed to initialize stock counters:", error);
      throw error;
    }
  }

  // Handle order.saved event - attempt to reserve inventory
  async processOrderSaved(orderData: {
    orderId: string;
    userId: string;
    productId: string;
    quantity: number;
    status: string;
  }): Promise<void> {
    Logger.info("Processing order.saved event", {
      orderId: orderData.orderId,
      productId: orderData.productId,
      quantity: orderData.quantity,
    });

    try {
      // Attempt to reserve stock atomically
      const reservation = await this.redisService.reserveStock(
        orderData.productId,
        orderData.quantity
      );

      if (reservation.success) {
        // Stock reserved successfully
        Logger.info("Stock reserved successfully", {
          orderId: orderData.orderId,
          productId: orderData.productId,
          quantity: orderData.quantity,
          remainingStock: reservation.newStock,
        });

        // Publish inventory.reserved event
        const inventoryReservedEvent = createBaseEvent("inventory.reserved", {
          orderId: orderData.orderId,
          productId: orderData.productId,
          quantity: orderData.quantity,
          remainingStock: reservation.newStock,
        });

        await this.kafkaClient.emit(
          "inventory.reserved",
          inventoryReservedEvent
        );

        // Publish notification event
        const notificationEvent = createBaseEvent("notification.order_update", {
          orderId: orderData.orderId,
          userId: orderData.userId,
          status: "CONFIRMED",
          productName: await this.getProductName(orderData.productId),
          message: `Your order has been confirmed! Stock remaining: ${reservation.newStock}`,
        });

        await this.kafkaClient.emit(
          "notification.order_update",
          notificationEvent
        );
      } else {
        // Insufficient stock
        Logger.warn("Insufficient stock for order", {
          orderId: orderData.orderId,
          productId: orderData.productId,
          quantity: orderData.quantity,
          availableStock: reservation.newStock,
        });

        // Publish inventory.insufficient event
        const inventoryInsufficientEvent = createBaseEvent(
          "inventory.insufficient",
          {
            orderId: orderData.orderId,
            productId: orderData.productId,
            quantity: orderData.quantity,
            availableStock: reservation.newStock,
            reason: "OUT_OF_STOCK",
          }
        );

        await this.kafkaClient.emit(
          "inventory.insufficient",
          inventoryInsufficientEvent
        );

        // Publish notification event
        const notificationEvent = createBaseEvent("notification.order_update", {
          orderId: orderData.orderId,
          userId: orderData.userId,
          status: "CANCELLED",
          productName: await this.getProductName(orderData.productId),
          message: `Sorry, this item is out of stock. Only ${reservation.newStock} items remaining.`,
        });

        await this.kafkaClient.emit(
          "notification.order_update",
          notificationEvent
        );
      }
    } catch (error) {
      Logger.error("Failed to process order reservation", {
        orderId: orderData.orderId,
        productId: orderData.productId,
        error: error.message,
      });

      // Publish error notification
      const errorNotificationEvent = createBaseEvent(
        "notification.order_update",
        {
          orderId: orderData.orderId,
          userId: orderData.userId,
          status: "CANCELLED",
          productName: await this.getProductName(orderData.productId),
          message:
            "An error occurred while processing your order. Please try again.",
        }
      );

      await this.kafkaClient.emit(
        "notification.order_update",
        errorNotificationEvent
      );

      throw error;
    }
  }

  // Get current stock for monitoring
  async getStock(productId: string): Promise<number> {
    return this.redisService.getStock(productId);
  }

  // Get product name for notifications
  private async getProductName(productId: string): Promise<string> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        select: ["name"],
      });
      return product?.name || "Unknown Product";
    } catch (error) {
      Logger.warn("Failed to get product name", {
        productId,
        error: error.message,
      });
      return "Unknown Product";
    }
  }

  // Get inventory statistics
  async getInventoryStats(): Promise<any> {
    try {
      const products = await this.productRepository.find();
      const stats = [];

      for (const product of products) {
        const currentStock = await this.redisService.getStock(product.id);
        stats.push({
          productId: product.id,
          name: product.name,
          initialStock: product.initialStock,
          currentStock,
          sold: product.initialStock - currentStock,
        });
      }

      return {
        totalProducts: products.length,
        products: stats,
      };
    } catch (error) {
      Logger.error("Failed to get inventory stats:", error);
      throw error;
    }
  }
}
