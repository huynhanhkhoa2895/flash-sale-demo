// WebSocket Gateway - Handles real-time communication with frontend

import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { KafkaConsumer, CONSUMER_GROUPS, TOPICS } from "kafka-config";
import {
  WebSocketMessage,
  OrderUpdateMessage,
  StockUpdateMessage,
  ErrorMessage,
  NotificationOrderUpdateEvent,
  NotificationStockUpdateEvent,
  OrderStatus,
} from "shared-types";
import { Logger } from "common-utils";

@WSGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/ws",
})
@Injectable()
export class WebsocketGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server | any; // Allow manual assignment for separate server

  private consumer: KafkaConsumer;
  private connectedClients = new Map<string, Socket>();

  constructor() {
    this.consumer = new KafkaConsumer(CONSUMER_GROUPS.API_GATEWAY);
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribeMultiple([TOPICS.NOTIFICATION_EVENTS]);

      // Start consuming messages
      await this.consumer.run(this.handleKafkaMessage.bind(this));
      Logger.info("✅ WebSocket Gateway Kafka consumer connected");
    } catch (error) {
      Logger.error("❌ Failed to initialize WebSocket Gateway:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      Logger.info("✅ WebSocket Gateway Kafka consumer disconnected");
    } catch (error) {
      Logger.error("❌ Error disconnecting WebSocket Gateway:", error);
    }
  }

  afterInit(server: Server) {
    Logger.info("🚀 WebSocket Gateway initialized");
  }

  handleConnection(client: Socket, ...args: any[]) {
    Logger.info("🔗 Client connected", { clientId: client.id });
    this.connectedClients.set(client.id, client);

    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: "system",
      data: { message: "Connected to Flash Sale WebSocket" },
      timestamp: new Date().toISOString(),
    };

    client.emit("message", welcomeMessage);
  }

  handleDisconnect(client: Socket) {
    Logger.info("🔌 Client disconnected", { clientId: client.id });
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage("subscribe_order")
  handleSubscribeOrder(client: Socket, orderId: string) {
    Logger.info("📋 Client subscribed to order updates", {
      clientId: client.id,
      orderId,
    });

    // Join room for order-specific updates
    client.join(`order_${orderId}`);

    client.emit("subscribed", { orderId, status: "success" });
  }

  @SubscribeMessage("unsubscribe_order")
  handleUnsubscribeOrder(client: Socket, orderId: string) {
    Logger.info("📋 Client unsubscribed from order updates", {
      clientId: client.id,
      orderId,
    });

    client.leave(`order_${orderId}`);
    client.emit("unsubscribed", { orderId, status: "success" });
  }

  @SubscribeMessage("ping")
  handlePing(client: Socket) {
    client.emit("pong", { timestamp: new Date().toISOString() });
  }

  private async handleKafkaMessage(topic: string, message: any) {
    try {
      Logger.debug("Received Kafka message in WebSocket Gateway", {
        topic,
        eventType: message.eventType,
        eventId: message.eventId,
      });

      switch (message.eventType) {
        case "notification.order_update":
          await this.handleOrderUpdate(message as NotificationOrderUpdateEvent);
          break;

        case "notification.stock_update":
          await this.handleStockUpdate(message as NotificationStockUpdateEvent);
          break;

        default:
          Logger.warn("Unknown event type received", {
            eventType: message.eventType,
          });
      }
    } catch (error) {
      Logger.error("Error handling Kafka message in WebSocket Gateway:", error);
    }
  }

  private async handleOrderUpdate(event: NotificationOrderUpdateEvent) {
    const orderUpdateMessage: OrderUpdateMessage = {
      type: "order_update",
      data: {
        id: event.data.orderId,
        userId: event.data.userId,
        productId: "FLASH_SALE_PRODUCT_001", // Default product ID
        quantity: 1, // Default quantity
        status: event.data.status as OrderStatus,
        reason: event.data.status === "CANCELLED" ? "Out of stock" : undefined,
        createdAt: event.timestamp,
        updatedAt: event.timestamp,
      },
      timestamp: new Date().toISOString(),
    };

    // Send to specific order room
    this.server
      .to(`order_${event.data.orderId}`)
      .emit("message", orderUpdateMessage);

    // Also broadcast to all clients for general updates
    this.server.emit("order_update", orderUpdateMessage);

    Logger.info("📤 Broadcasted order update via WebSocket", {
      orderId: event.data.orderId,
      status: event.data.status,
      clientsInRoom:
        this.server.sockets.adapter.rooms.get(`order_${event.data.orderId}`)
          ?.size || 0,
    });
  }

  private async handleStockUpdate(event: NotificationStockUpdateEvent) {
    const stockUpdateMessage: StockUpdateMessage = {
      type: "stock_update",
      data: {
        productId: event.data.productId,
        availableStock: event.data.availableStock,
        lastOrderId: undefined, // Could be enhanced to track last order
      },
      timestamp: new Date().toISOString(),
    };

    // Broadcast stock updates to all connected clients
    this.server.emit("message", stockUpdateMessage);
    this.server.emit("stock_update", stockUpdateMessage);

    Logger.info("📤 Broadcasted stock update via WebSocket", {
      productId: event.data.productId,
      availableStock: event.data.availableStock,
      connectedClients: this.connectedClients.size,
    });
  }

  // Utility method to send error messages
  private sendError(clientId: string, error: ErrorMessage) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit("message", error);
    }
  }

  // Get connection stats (could be used for monitoring)
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()).filter(
        (key: string) => key.startsWith("order_")
      ),
    };
  }
}
