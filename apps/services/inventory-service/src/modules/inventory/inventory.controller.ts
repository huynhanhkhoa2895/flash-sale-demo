// Inventory Controller - Kafka message handlers for inventory events

import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { InventoryService } from "./inventory.service";
import { OrderSavedEvent } from "shared-types";
import { Logger } from "common-utils";

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern("order.saved")
  async handleOrderSaved(@Payload() message: OrderSavedEvent) {
    try {
      Logger.info("📨 Received order.saved event", {
        eventId: message.eventId,
        orderId: message.data.orderId,
        productId: message.data.productId,
        quantity: message.data.quantity,
      });

      await this.inventoryService.processOrderSaved(message.data);

      Logger.info("✅ Order reservation processed", {
        orderId: message.data.orderId,
        status: "processed",
      });
    } catch (error) {
      Logger.error("❌ Failed to handle order.saved event", {
        eventId: message.eventId,
        error: error.message,
        orderId: message.data.orderId,
      });
      throw error;
    }
  }

  // HTTP endpoint to get current stock from Redis
  @Get("stock/:productId")
  async getStock(
    @Param("productId") productId: string
  ): Promise<{ productId: string; availableStock: number }> {
    try {
      Logger.info("📥 Received HTTP request for stock", { productId });

      const stock = await this.inventoryService.getStock(productId);

      return {
        productId,
        availableStock: stock,
      };
    } catch (error) {
      Logger.error("❌ Failed to get stock", {
        error: error.message,
        productId,
      });

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

  // HTTP endpoint to set stock
  @Put("stock/:productId")
  async setStock(
    @Param("productId") productId: string,
    @Body() body: { stock: number }
  ): Promise<{ productId: string; availableStock: number }> {
    try {
      Logger.info("📥 Received HTTP request to set stock", {
        productId,
        stock: body.stock,
      });

      if (typeof body.stock !== "number" || body.stock < 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Stock must be a non-negative number",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const stock = await this.inventoryService.setStock(productId, body.stock);

      return {
        productId,
        availableStock: stock,
      };
    } catch (error) {
      Logger.error("❌ Failed to set stock", {
        error: error.message,
        productId,
        stock: body.stock,
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
