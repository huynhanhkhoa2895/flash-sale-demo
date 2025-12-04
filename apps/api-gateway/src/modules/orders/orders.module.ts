// Orders Module - Handles order creation and management

import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [KafkaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
