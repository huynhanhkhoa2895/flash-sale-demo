// Orders Controller - Kafka message handlers and HTTP endpoints for order events

import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { OrdersService } from "./orders.service";
import {
  OrderCreatedEvent,
  OrderResponse,
  ProductResponse,
} from "shared-types";
import { Logger } from "common-utils";
import axios from "axios";

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern("order.created")
  async handleOrderCreated(@Payload() message: OrderCreatedEvent) {
    try {
      Logger.info("📨 Received order.created event", {
        eventId: message.eventId,
        orderId: message.data.orderId,
        userId: message.data.userId,
        productId: message.data.productId,
        quantity: message.data.quantity,
      });

      await this.ordersService.createOrder(message.data);

      Logger.info("✅ Order created successfully", {
        orderId: message.data.orderId,
      });
    } catch (error) {
      Logger.error("❌ Failed to handle order.created event", {
        eventId: message.eventId,
        error: error.message,
        orderId: message.data.orderId,
      });
      throw error; // Let NestJS handle the error and potentially retry
    }
  }

  @MessagePattern("inventory.reserved")
  async handleInventoryReserved(@Payload() message: any) {
    try {
      Logger.info("📨 Received inventory.reserved event", {
        eventId: message.eventId,
        orderId: message.data.orderId,
      });

      await this.ordersService.handleInventoryReserved(message.data);

      Logger.info("✅ Order confirmed from inventory.reserved", {
        orderId: message.data.orderId,
      });
    } catch (error) {
      Logger.error("❌ Failed to handle inventory.reserved event", {
        eventId: message.eventId,
        error: error.message,
        orderId: message.data.orderId,
      });
      throw error;
    }
  }

  @MessagePattern("inventory.insufficient")
  async handleInventoryInsufficient(@Payload() message: any) {
    try {
      Logger.info("📨 Received inventory.insufficient event", {
        eventId: message.eventId,
        orderId: message.data.orderId,
      });

      await this.ordersService.handleInventoryInsufficient(message.data);

      Logger.info("✅ Order cancelled from inventory.insufficient", {
        orderId: message.data.orderId,
      });
    } catch (error) {
      Logger.error("❌ Failed to handle inventory.insufficient event", {
        eventId: message.eventId,
        error: error.message,
        orderId: message.data.orderId,
      });
      throw error;
    }
  }

  // HTTP endpoint to get order status
  @Get("orders/:orderId")
  async getOrderStatus(
    @Param("orderId") orderId: string
  ): Promise<OrderResponse> {
    try {
      Logger.info("📥 Received HTTP request for order status", { orderId });

      const order = await this.ordersService.getOrderById(orderId);

      if (!order) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Order with ID ${orderId} not found`,
            error: "Not Found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Convert entity to response DTO
      const response: OrderResponse = {
        id: order.id,
        userId: order.userId,
        productId: order.productId,
        quantity: order.quantity,
        status: order.status,
        reason: order.reason,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };

      return response;
    } catch (error) {
      Logger.error("❌ Failed to get order status", {
        error: error.message,
        orderId,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: "Internal Server Error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // HTTP endpoint to get product information
  @Get("products/:productId")
  async getProduct(
    @Param("productId") productId: string
  ): Promise<ProductResponse> {
    try {
      Logger.info("📥 Received HTTP request for product", { productId });

      const product = await this.ordersService.getProductById(productId);

      if (!product) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Product with ID ${productId} not found`,
            error: "Not Found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Get current stock from Redis via inventory service
      let availableStock = product.currentStock;
      try {
        const inventoryServiceUrl =
          process.env.INVENTORY_SERVICE_URL || "http://localhost:3004";
        const stockResponse = await axios.get<{
          productId: string;
          availableStock: number;
        }>(`${inventoryServiceUrl}/stock/${productId}`, { timeout: 2000 });
        availableStock = stockResponse.data.availableStock;
        Logger.info("Got stock from Redis", { productId, availableStock });
      } catch (error) {
        Logger.warn(
          "Failed to get stock from inventory service, using database stock",
          {
            error: error.message,
            productId,
          }
        );
        // Fallback to database stock if inventory service unavailable
      }

      const response: ProductResponse = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price.toString()),
        availableStock: availableStock,
      };

      return response;
    } catch (error) {
      Logger.error("❌ Failed to get product", {
        error: error.message,
        productId,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: "Internal Server Error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
