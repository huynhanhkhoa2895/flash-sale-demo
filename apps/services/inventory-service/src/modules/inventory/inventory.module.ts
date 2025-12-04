// Inventory Module - Handles inventory management and Kafka events

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { ProductEntity } from "./product.entity";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([ProductEntity]),

    // Redis module
    RedisModule,

    // Kafka client for publishing events
    ClientsModule.register([
      {
        name: "KAFKA_CLIENT",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "inventory-service-publisher",
            brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
          },
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
