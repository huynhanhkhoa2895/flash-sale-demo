// Orders Service - Handles order creation logic

import { Injectable } from "@nestjs/common";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatus,
  OrderResponse,
} from "shared-types";
import {
  IdGenerator,
  ValidationUtils,
  Logger,
  createBaseEvent,
} from "common-utils";
import { KafkaService } from "../kafka/kafka.service";
import axios from "axios";

@Injectable()
export class OrdersService {
  private readonly orderServiceUrl: string;

  constructor(private readonly kafkaService: KafkaService) {
    this.orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:3002";
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    Logger.info("Creating order", {
      userId: request.userId,
      productId: request.productId,
    });

    // Validate input
    const validation = ValidationUtils.validateOrderData(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Generate order ID
    const orderId = IdGenerator.generateOrderId();

    // Create order created event
    const orderCreatedEvent = createBaseEvent("order.created", {
      orderId,
      userId: request.userId,
      productId: request.productId,
      quantity: request.quantity,
    });

    // Publish event to Kafka (fire and forget)
    await this.kafkaService.publishOrderCreated(orderCreatedEvent);

    // Return immediate response
    const response: CreateOrderResponse = {
      orderId,
      status: OrderStatus.PENDING,
      message: "Order is being processed. Status will be updated shortly.",
      estimatedProcessingTime: 2000, // 2 seconds estimate
    };

    Logger.info("Order creation initiated", {
      orderId,
      userId: request.userId,
      status: response.status,
    });

    return response;
  }

  async getOrderStatus(orderId: string): Promise<OrderResponse> {
    Logger.info("Getting order status", { orderId });

    try {
      // Call order service via HTTP to get order status
      const response = await axios.get<OrderResponse>(
        `${this.orderServiceUrl}/orders/${orderId}`,
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      Logger.error("Failed to get order status", {
        error: error.message,
        orderId,
        status: error.response?.status,
        code: error.code,
        url: `${this.orderServiceUrl}/orders/${orderId}`,
        fullError: error.toString(),
      });

      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new Error(
          `Cannot connect to Order Service at ${this.orderServiceUrl}. Please ensure the service is running.`
        );
      }

      if (error.response?.status === 404) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to get order status"
      );
    }
  }
}
