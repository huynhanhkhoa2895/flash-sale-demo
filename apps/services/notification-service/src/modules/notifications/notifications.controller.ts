// Notifications Controller - Kafka message handlers for all event types

import { Controller } from "@nestjs/common";
import { MessagePattern, Payload, Ctx } from "@nestjs/microservices";
import { NotificationsService } from "./notifications.service";
import { Logger } from "common-utils";

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Listen to all order events
  @MessagePattern("order.created")
  async handleOrderCreated(@Payload() message: any, @Ctx() context: any) {
    await this.notificationsService.processEvent("order.events", message);
  }

  @MessagePattern("order.saved")
  async handleOrderSaved(@Payload() message: any, @Ctx() context: any) {
    await this.notificationsService.processEvent("order.events", message);
  }

  @MessagePattern("order.confirmed")
  async handleOrderConfirmed(@Payload() message: any, @Ctx() context: any) {
    await this.notificationsService.processEvent("order.events", message);
  }

  @MessagePattern("order.cancelled")
  async handleOrderCancelled(@Payload() message: any, @Ctx() context: any) {
    await this.notificationsService.processEvent("order.events", message);
  }

  // Listen to all inventory events
  @MessagePattern("inventory.reserved")
  async handleInventoryReserved(@Payload() message: any, @Ctx() context: any) {
    await this.notificationsService.processEvent("inventory.events", message);
  }

  @MessagePattern("inventory.insufficient")
  async handleInventoryInsufficient(
    @Payload() message: any,
    @Ctx() context: any
  ) {
    await this.notificationsService.processEvent("inventory.events", message);
  }

  // Also listen to notification events (for broadcasting to WebSocket)
  @MessagePattern("notification.order_update")
  async handleNotificationOrderUpdate(
    @Payload() message: any,
    @Ctx() context: any
  ) {
    Logger.debug("Notification order update received", {
      orderId: message.data.orderId,
      status: message.data.status,
    });
    // This event is consumed by the WebSocket gateway
  }

  @MessagePattern("notification.stock_update")
  async handleNotificationStockUpdate(
    @Payload() message: any,
    @Ctx() context: any
  ) {
    Logger.debug("Notification stock update received", {
      productId: message.data.productId,
      availableStock: message.data.availableStock,
    });
    // This event is consumed by the WebSocket gateway
  }
}
