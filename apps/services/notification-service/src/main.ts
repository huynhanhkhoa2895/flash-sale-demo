// Notification Service - Main Application Entry Point

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { Logger } from "common-utils";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: "notification-service",
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
          groupId: "notification-service-group",
          sessionTimeout: 60000,
          heartbeatInterval: 5000,
          rebalanceTimeout: 120000,
          allowAutoTopicCreation: true,
          maxInFlightRequests: 1,
        },
      },
    }
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen();
  Logger.info("🚀 Notification Service is running as Kafka microservice");
}

bootstrap().catch((error) => {
  Logger.error("Failed to start Notification Service:", error);
  process.exit(1);
});
