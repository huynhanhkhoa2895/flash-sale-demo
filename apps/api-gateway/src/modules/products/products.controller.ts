// Products Controller - REST API endpoints for products

import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ProductResponse } from "shared-types";
import { ProductsService } from "./products.service";
import { Logger } from "common-utils";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(":productId")
  async getProduct(
    @Param("productId") productId: string
  ): Promise<ProductResponse> {
    try {
      Logger.info("Received product request", { productId });

      const product = await this.productsService.getProduct(productId);

      return product;
    } catch (error) {
      Logger.error("Failed to get product", {
        error: error.message,
        productId,
      });

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

  @Put(":productId/stock")
  async setStock(
    @Param("productId") productId: string,
    @Body() body: { stock: number }
  ): Promise<{ productId: string; availableStock: number }> {
    try {
      Logger.info("Received stock update request", { productId, stock: body.stock });

      if (typeof body.stock !== "number" || body.stock < 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Stock must be a non-negative number",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.productsService.setStock(productId, body.stock);
      return result;
    } catch (error) {
      Logger.error("Failed to set stock", {
        error: error.message,
        productId,
        stock: body.stock,
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

