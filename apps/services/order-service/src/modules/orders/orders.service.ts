// Orders Service - Handles order processing and status updates

import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderEntity } from "./order.entity";
import { ProductEntity } from "./product.entity";
import {
  OrderStatus,
  OrderConfirmedEvent,
  OrderCancelledEvent,
} from "shared-types";
import { Logger, createBaseEvent } from "common-utils";

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @Inject("KAFKA_CLIENT")
    private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    // Subscribe to inventory events for status updates
    this.kafkaClient.subscribeToResponseOf("inventory.reserved");
    this.kafkaClient.subscribeToResponseOf("inventory.insufficient");

    await this.kafkaClient.connect();
    Logger.info("✅ Order Service Kafka client connected");
  }

  async createOrder(orderData: {
    orderId: string;
    userId: string;
    productId: string;
    quantity: number;
  }): Promise<OrderEntity> {
    Logger.info("Creating order in database", {
      orderId: orderData.orderId,
      userId: orderData.userId,
      productId: orderData.productId,
    });

    const order = this.orderRepository.create({
      id: orderData.orderId,
      userId: orderData.userId,
      productId: orderData.productId,
      quantity: orderData.quantity,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Publish order.saved event
    const orderSavedEvent = createBaseEvent("order.saved", {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      productId: savedOrder.productId,
      quantity: savedOrder.quantity,
      status: savedOrder.status,
    });

    await this.kafkaClient.emit("order.saved", orderSavedEvent);

    Logger.info("Order saved and order.saved event published", {
      orderId: savedOrder.id,
      status: savedOrder.status,
    });

    return savedOrder;
  }

  async confirmOrder(orderId: string): Promise<void> {
    Logger.info("Confirming order", { orderId });

    await this.orderRepository.update(
      { id: orderId },
      { status: OrderStatus.CONFIRMED }
    );

    // Publish order.confirmed event
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      Logger.error("Order not found for confirmation", { orderId });
      return;
    }

    const orderConfirmedEvent = createBaseEvent("order.confirmed", {
      orderId: order.id,
      userId: order.userId,
      productId: order.productId,
      quantity: order.quantity,
    });

    await this.kafkaClient.emit("order.confirmed", orderConfirmedEvent);

    Logger.info("Order confirmed and event published", { orderId });
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    Logger.info("Cancelling order", { orderId, reason });

    await this.orderRepository.update(
      { id: orderId },
      { status: OrderStatus.CANCELLED, reason }
    );

    // Publish order.cancelled event
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      Logger.error("Order not found for cancellation", { orderId });
      return;
    }

    const orderCancelledEvent = createBaseEvent("order.cancelled", {
      orderId: order.id,
      userId: order.userId,
      productId: order.productId,
      quantity: order.quantity,
      reason,
    });

    await this.kafkaClient.emit("order.cancelled", orderCancelledEvent);

    Logger.info("Order cancelled and event published", { orderId, reason });
  }

  async getOrderById(orderId: string): Promise<OrderEntity | null> {
    return this.orderRepository.findOne({ where: { id: orderId } });
  }

  // Event handlers for inventory responses
  async handleInventoryReserved(data: any) {
    Logger.info("Received inventory.reserved event", { orderId: data.orderId });
    await this.confirmOrder(data.orderId);
  }

  async handleInventoryInsufficient(data: any) {
    Logger.info("Received inventory.insufficient event", {
      orderId: data.orderId,
      reason: "Out of stock",
    });
    await this.cancelOrder(data.orderId, "Out of stock");
  }

  async getProductById(productId: string): Promise<ProductEntity | null> {
    return this.productRepository.findOne({ where: { id: productId } });
  }
}
