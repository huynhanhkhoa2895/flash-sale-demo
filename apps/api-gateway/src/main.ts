// API Gateway - Main Application Entry Point

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { EnvUtils, Logger } from "common-utils";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend - allow all origins in development
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // Allow all origins in dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix for API routes
  app.setGlobalPrefix("api");

  const port = EnvUtils.getPort(3001);
  await app.listen(port);

  Logger.info(`🚀 API Gateway is running on: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  Logger.error("Failed to start API Gateway:", error);
  process.exit(1);
});
