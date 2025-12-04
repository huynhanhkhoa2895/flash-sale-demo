// Inventory Service - Main Application Entry Point

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
          clientId: "inventory-service",
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
          groupId: "inventory-service-group",
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          rebalanceTimeout: 60000,
          allowAutoTopicCreation: true,
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
  Logger.info("🚀 Inventory Service is running as Kafka microservice");
}

bootstrap().catch((error) => {
  Logger.error("Failed to start Inventory Service:", error);
  process.exit(1);
});
