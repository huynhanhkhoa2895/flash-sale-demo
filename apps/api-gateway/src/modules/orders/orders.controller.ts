// Orders Controller - REST API endpoints for orders

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderResponse,
} from "shared-types";
import { OrdersService } from "./orders.service";
import { Logger } from "common-utils";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body() request: CreateOrderRequest
  ): Promise<CreateOrderResponse> {
    try {
      Logger.info("Received order creation request", {
        userId: request.userId,
        productId: request.productId,
        quantity: request.quantity,
      });

      const result = await this.ordersService.createOrder(request);

      Logger.info("Order creation request processed successfully", {
        orderId: result.orderId,
        status: result.status,
      });

      return result;
    } catch (error) {
      Logger.error("Order creation failed", {
        error: error.message,
        userId: request.userId,
        productId: request.productId,
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
          error: "Bad Request",
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(":orderId")
  async getOrderStatus(
    @Param("orderId") orderId: string
  ): Promise<OrderResponse> {
    try {
      Logger.info("Received order status request", { orderId });

      const order = await this.ordersService.getOrderStatus(orderId);

      if (!order) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Order with ID ${orderId} not found`,
            error: "Not Found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      return order;
    } catch (error) {
      Logger.error("Failed to get order status", {
        error: error.message,
        orderId,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: "Internal Server Error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
