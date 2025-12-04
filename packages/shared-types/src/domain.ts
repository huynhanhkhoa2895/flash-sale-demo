// Domain Models - Shared across all services

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  initialStock: number;
  currentStock: number;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: OrderStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSummary {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: OrderStatus;
  createdAt: Date;
}

export interface StockInfo {
  productId: string;
  availableStock: number;
  reservedStock: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
