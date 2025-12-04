// WebSocket utilities for real-time communication

import {
  WebSocketMessage,
  OrderUpdateMessage,
  StockUpdateMessage,
  ErrorMessage,
} from "shared-types";

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private orderSubscriptions: Set<string> = new Set();

  constructor(private url: string = "ws://localhost:3001/ws") {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected");
          this.reconnectAttempts = 0;
          this.emitEvent("connected", {
            type: "system",
            data: { message: "Connected" },
            timestamp: new Date().toISOString(),
          });

          // Re-subscribe to orders
          this.resubscribeToOrders();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("❌ WebSocket disconnected");
          this.emitEvent("disconnected", {
            type: "system",
            data: { message: "Disconnected" },
            timestamp: new Date().toISOString(),
          });
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch(() => {
        // Ignore connection errors during reconnection
      });
    }, delay);
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: "subscribe_order",
          data: orderId,
        })
      );
      this.orderSubscriptions.add(orderId);
    }
  }

  unsubscribeFromOrder(orderId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: "unsubscribe_order",
          data: orderId,
        })
      );
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event: "ping" }));
    }
  }

  // Connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();
