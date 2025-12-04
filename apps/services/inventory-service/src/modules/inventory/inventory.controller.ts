// Inventory Controller - Kafka message handlers for inventory events

import { Controller } from "@nestjs/common";
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
}
