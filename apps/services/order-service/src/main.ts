// Order Service - Main Application Entry Point

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { Logger } from "common-utils";

async function bootstrap() {
  // Create hybrid app: HTTP + Kafka microservice
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Connect Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "order-service",
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
        groupId: "order-service-group",
        sessionTimeout: 60000,
        heartbeatInterval: 5000,
        rebalanceTimeout: 120000,
        allowAutoTopicCreation: true,
        maxInFlightRequests: 1,
      },
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Start HTTP server
  const httpPort = parseInt(process.env.HTTP_PORT || "3002");
  await app.listen(httpPort);
  Logger.info(`🚀 Order Service HTTP server running on port ${httpPort}`);

  // Start Kafka microservice
  await app.startAllMicroservices();
  Logger.info("🚀 Order Service Kafka microservice started");
}

bootstrap().catch((error) => {
  Logger.error("Failed to start Order Service:", error);
  process.exit(1);
});
