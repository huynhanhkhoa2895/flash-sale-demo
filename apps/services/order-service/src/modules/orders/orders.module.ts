// Orders Module - Handles order processing and Kafka events

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { OrderEntity } from "./order.entity";
import { ProductEntity } from "./product.entity";

@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([OrderEntity, ProductEntity]),

    // Kafka client for publishing events
    ClientsModule.register([
      {
        name: "KAFKA_CLIENT",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "order-service-publisher",
            brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
            retry: {
              initialRetryTime: 300,
              retries: 8,
              multiplier: 2,
              maxRetryTime: 30000,
            },
            connectionTimeout: 10000,
            requestTimeout: 30000,
          },
          consumer: {
            groupId: "order-service-publisher-group",
            sessionTimeout: 60000,
            heartbeatInterval: 5000,
            rebalanceTimeout: 120000,
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
