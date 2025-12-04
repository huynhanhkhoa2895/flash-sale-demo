// Notifications Module - Handles notification broadcasting

import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [
    // Kafka client for publishing to notification.events topic
    ClientsModule.register([
      {
        name: "NOTIFICATION_KAFKA_CLIENT",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "notification-service-broadcaster",
            brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
          },
        },
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
