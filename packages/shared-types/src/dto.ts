// Data Transfer Objects for API communication

import { OrderStatus } from "./domain";

// Request DTOs
export interface CreateOrderRequest {
  userId: string;
  productId: string;
  quantity: number;
}

export interface GetProductRequest {
  productId: string;
}

// Response DTOs
export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  message: string;
  estimatedProcessingTime?: number; // in milliseconds
}

export interface OrderResponse {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: OrderStatus;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  availableStock: number;
}

export interface StockResponse {
  productId: string;
  availableStock: number;
  isAvailable: boolean;
}

// WebSocket DTOs
export interface WebSocketMessage {
  type: "order_update" | "stock_update" | "error" | "system";
  data: any;
  timestamp: string;
}

export interface OrderUpdateMessage extends WebSocketMessage {
  type: "order_update";
  data: OrderResponse;
}

export interface StockUpdateMessage extends WebSocketMessage {
  type: "stock_update";
  data: {
    productId: string;
    availableStock: number;
    lastOrderId?: string;
  };
}

export interface ErrorMessage extends WebSocketMessage {
  type: "error";
  data: {
    message: string;
    orderId?: string;
  };
}
