// Notification Service - Main Application Module

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Kafka client for publishing events (to WebSocket gateway)
    ClientsModule.register([
      {
        name: "KAFKA_CLIENT",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "notification-service-publisher",
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
            groupId: "notification-service-publisher-group",
            sessionTimeout: 60000,
            heartbeatInterval: 5000,
            rebalanceTimeout: 120000,
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),

    // Feature modules
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
