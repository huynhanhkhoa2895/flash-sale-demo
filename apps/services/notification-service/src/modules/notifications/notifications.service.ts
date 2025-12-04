// Notifications Service - Handles notification broadcasting to WebSocket clients

import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { Logger, createBaseEvent } from "common-utils";

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @Inject("NOTIFICATION_KAFKA_CLIENT")
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    Logger.info("✅ Notification Service Kafka client connected");
  }

  // Handle order events and create notifications
  async handleOrderEvent(eventType: string, eventData: any): Promise<void> {
    Logger.debug("Processing order event for notification", {
      eventType,
      orderId: eventData.orderId,
      userId: eventData.userId,
    });

    let notificationEvent;

    switch (eventType) {
      case "order.created":
        notificationEvent = createBaseEvent("notification.order_update", {
          orderId: eventData.orderId,
          userId: eventData.userId,
          status: "PENDING",
          productName: "Flash Sale Product", // Could be enhanced to fetch from DB
          message: "Your order has been received and is being processed.",
        });
        break;

      case "order.confirmed":
        notificationEvent = createBaseEvent("notification.order_update", {
          orderId: eventData.orderId,
          userId: eventData.userId,
          status: "CONFIRMED",
          productName: "Flash Sale Product",
          message:
            "🎉 Your order has been confirmed! Payment processing will begin shortly.",
        });
        break;

      case "order.cancelled":
        notificationEvent = createBaseEvent("notification.order_update", {
          orderId: eventData.orderId,
          userId: eventData.userId,
          status: "CANCELLED",
          productName: "Flash Sale Product",
          message: `❌ Your order has been cancelled. Reason: ${eventData.reason || "Unknown"}`,
        });
        break;

      default:
        Logger.warn("Unknown order event type for notification", { eventType });
        return;
    }

    await this.kafkaClient.emit("notification.events", notificationEvent);

    Logger.info("Order notification broadcasted", {
      orderId: eventData.orderId,
      status: notificationEvent.data.status,
    });
  }

  // Handle inventory events and create stock notifications
  async handleInventoryEvent(eventType: string, eventData: any): Promise<void> {
    Logger.debug("Processing inventory event for notification", {
      eventType,
      productId: eventData.productId,
    });

    let notificationEvent;

    switch (eventType) {
      case "inventory.reserved":
        // Create stock update notification when stock is low
        if (eventData.remainingStock <= 10 && eventData.remainingStock > 0) {
          notificationEvent = createBaseEvent("notification.stock_update", {
            productId: eventData.productId,
            availableStock: eventData.remainingStock,
            totalSold: 100 - eventData.remainingStock, // Assuming initial stock of 100
            message: `⚠️ Only ${eventData.remainingStock} items left in stock!`,
          });
        } else if (eventData.remainingStock === 0) {
          notificationEvent = createBaseEvent("notification.stock_update", {
            productId: eventData.productId,
            availableStock: 0,
            totalSold: 100, // Assuming initial stock of 100
            message: `🚫 This product is now out of stock!`,
          });
        }
        break;

      case "inventory.insufficient":
        // This is handled by order cancellation notification
        Logger.debug(
          "Inventory insufficient event - notification handled by order cancellation"
        );
        return;

      default:
        Logger.warn("Unknown inventory event type for notification", {
          eventType,
        });
        return;
    }

    if (notificationEvent) {
      await this.kafkaClient.emit("notification.events", notificationEvent);

      Logger.info("Stock notification broadcasted", {
        productId: eventData.productId,
        availableStock: eventData.remainingStock || eventData.availableStock,
      });
    }
  }

  // Generic event processor
  async processEvent(topic: string, event: any): Promise<void> {
    try {
      Logger.debug("Processing event in Notification Service", {
        topic,
        eventType: event.eventType,
        eventId: event.eventId,
      });

      if (topic.includes("order")) {
        await this.handleOrderEvent(event.eventType, event.data);
      } else if (topic.includes("inventory")) {
        await this.handleInventoryEvent(event.eventType, event.data);
      } else {
        Logger.debug("Event not relevant for notifications", {
          topic,
          eventType: event.eventType,
        });
      }
    } catch (error) {
      Logger.error("Failed to process event in Notification Service", {
        topic,
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message,
      });
      // Don't throw - we don't want notification failures to break the event flow
    }
  }
}
