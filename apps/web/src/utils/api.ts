// API utilities for HTTP requests

import axios, { AxiosResponse } from "axios";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  ProductResponse,
  OrderResponse,
} from "shared-types";

// Configure axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log("📤 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log("📥 API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Response Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// API functions
export const apiClient = {
  // Create order
  createOrder: async (
    request: CreateOrderRequest
  ): Promise<CreateOrderResponse> => {
    const response: AxiosResponse<CreateOrderResponse> = await api.post(
      "/api/orders",
      request
    );
    return response.data;
  },

  // Get product (for future use)
  getProduct: async (productId: string): Promise<ProductResponse> => {
    const response: AxiosResponse<ProductResponse> = await api.get(
      `/api/products/${productId}`
    );
    return response.data;
  },

  // Get order status
  getOrderStatus: async (orderId: string): Promise<OrderResponse> => {
    const response: AxiosResponse<OrderResponse> = await api.get(
      `/api/orders/${orderId}`
    );
    return response.data;
  },

  // Reset stock to 1
  resetStock: async (
    productId: string
  ): Promise<{ productId: string; availableStock: number }> => {
    const response: AxiosResponse<{
      productId: string;
      availableStock: number;
    }> = await api.put(`/api/products/${productId}/stock`, { stock: 1 });
    return response.data;
  },

  // Set stock to a specific value
  setStock: async (
    productId: string,
    stock: number
  ): Promise<{ productId: string; availableStock: number }> => {
    const response: AxiosResponse<{
      productId: string;
      availableStock: number;
    }> = await api.put(`/api/products/${productId}/stock`, { stock });
    return response.data;
  },
};

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return new ApiError(
      data.message || `Request failed with status ${status}`,
      status,
      data
    );
  } else if (error.request) {
    // Network error
    return new ApiError(
      "Network error - please check your connection",
      undefined,
      error.request
    );
  } else {
    // Other error
    return new ApiError(error.message || "An unexpected error occurred");
  }
};
