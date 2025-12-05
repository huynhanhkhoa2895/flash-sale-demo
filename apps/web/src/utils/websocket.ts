// WebSocket utilities for real-time communication using Socket.IO

import { io, Socket } from "socket.io-client";
import {
  WebSocketMessage,
  OrderUpdateMessage,
  StockUpdateMessage,
  ErrorMessage,
} from "shared-types";

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private orderSubscriptions: Set<string> = new Set();
  private isConnecting = false;

  constructor(private url: string = "http://localhost:3003") {
    // Socket.IO client connects to separate WebSocket server
    // Namespace /ws will be added automatically
  }

  connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // Socket.IO client with namespace /ws
        this.socket = io(`${this.url}/ws`, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          reconnectionDelayMax: 8000,
          timeout: 20000,
          forceNew: false,
        });

        this.socket.on("connect", () => {
          console.log("✅ WebSocket connected", { socketId: this.socket?.id });
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emitEvent("connected", {
            type: "system",
            data: { message: "Connected" },
            timestamp: new Date().toISOString(),
          });

          // Re-subscribe to orders
          this.resubscribeToOrders();

          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("❌ WebSocket disconnected", { reason });
          this.isConnecting = false;
          this.emitEvent("disconnected", {
            type: "system",
            data: { message: "Disconnected", reason },
            timestamp: new Date().toISOString(),
          });
        });

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          this.isConnecting = false;
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        });

        // Listen for messages from server
        this.socket.on("message", (message: WebSocketMessage) => {
          this.handleMessage(message);
        });

        // Listen for order updates
        this.socket.on("order_update", (message: OrderUpdateMessage) => {
          this.emitEvent("order_update", message);
        });

        // Listen for stock updates
        this.socket.on("stock_update", (message: StockUpdateMessage) => {
          this.emitEvent("stock_update", message);
        });

        // Listen for errors
        this.socket.on("error", (message: ErrorMessage) => {
          this.emitEvent("error", message);
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log("📨 Received WebSocket message:", message);

    switch (message.type) {
      case "order_update":
        this.emitEvent("order_update", message as OrderUpdateMessage);
        break;
      case "stock_update":
        this.emitEvent("stock_update", message as StockUpdateMessage);
        break;
      case "error":
        this.emitEvent("error", message as ErrorMessage);
        break;
      default:
        this.emitEvent("message", message);
    }
  }

  private emitEvent(eventType: string, message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("Error in WebSocket event handler:", error);
        }
      });
    }
  }

  // Event subscription methods
  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler?: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) return;

    if (handler) {
      const handlers = this.eventHandlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(eventType);
    }
  }

  // Order subscription methods
  subscribeToOrder(orderId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("subscribe_order", orderId);
      this.orderSubscriptions.add(orderId);
    }
  }

  unsubscribeFromOrder(orderId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("unsubscribe_order", orderId);
      this.orderSubscriptions.delete(orderId);
    }
  }

  private resubscribeToOrders(): void {
    this.orderSubscriptions.forEach((orderId) => {
      this.subscribeToOrder(orderId);
    });
  }

  // Send ping to keep connection alive
  ping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("ping");
    }
  }

  // Connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionState(): string {
    if (!this.socket) return "disconnected";

    if (this.socket.connected) return "connected";
    if (this.socket.disconnected) return "disconnected";
    return "connecting";
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();
