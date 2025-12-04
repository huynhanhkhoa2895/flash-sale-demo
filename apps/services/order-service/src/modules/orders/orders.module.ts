// Orders Module - Handles order processing and Kafka events

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { OrderEntity } from "./order.entity";

@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([OrderEntity]),

    // Kafka client for publishing events
    ClientsModule.register([
      {
        name: "KAFKA_CLIENT",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "order-service-publisher",
            brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
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
