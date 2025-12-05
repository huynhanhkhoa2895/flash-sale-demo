// Products Service - Handles product retrieval logic

import { Injectable } from "@nestjs/common";
import { ProductResponse } from "shared-types";
import { Logger } from "common-utils";
import axios from "axios";

@Injectable()
export class ProductsService {
  private readonly orderServiceUrl: string;
  private readonly inventoryServiceUrl: string;

  constructor() {
    this.orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:3002";
    this.inventoryServiceUrl =
      process.env.INVENTORY_SERVICE_URL || "http://localhost:3004";
  }

  async getProduct(productId: string): Promise<ProductResponse> {
    Logger.info("Getting product", { productId });

    try {
      // Call order service via HTTP to get product
      const response = await axios.get<ProductResponse>(
        `${this.orderServiceUrl}/products/${productId}`,
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      Logger.error("Failed to get product", {
        error: error.message,
        productId,
        status: error.response?.status,
        code: error.code,
        url: `${this.orderServiceUrl}/products/${productId}`,
      });

      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new Error(
          `Cannot connect to Order Service at ${this.orderServiceUrl}. Please ensure the service is running.`
        );
      }

      if (error.response?.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to get product"
      );
    }
  }

  async setStock(
    productId: string,
    stock: number
  ): Promise<{ productId: string; availableStock: number }> {
    Logger.info("Setting stock", { productId, stock });

    try {
      const response = await axios.put<{
        productId: string;
        availableStock: number;
      }>(
        `${this.inventoryServiceUrl}/stock/${productId}`,
        { stock },
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      Logger.error("Failed to set stock", {
        error: error.message,
        productId,
        stock,
        status: error.response?.status,
        code: error.code,
        url: `${this.inventoryServiceUrl}/stock/${productId}`,
      });

      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new Error(
          `Cannot connect to Inventory Service at ${this.inventoryServiceUrl}. Please ensure the service is running.`
        );
      }

      throw new Error(
        error.response?.data?.message || error.message || "Failed to set stock"
      );
    }
  }
}
