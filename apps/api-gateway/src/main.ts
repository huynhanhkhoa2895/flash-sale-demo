// API Gateway - Main Application Entry Point

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { EnvUtils, Logger } from "common-utils";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { WebsocketGateway } from "./modules/websocket/websocket.gateway";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = [
    frontendUrl, // Docker internal URL (e.g., http://web:3000)
    "http://localhost:3000", // Local development
    "http://127.0.0.1:3000", // Alternative localhost
  ].filter(Boolean); // Remove undefined values

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Also allow localhost variations
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
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

  // Start HTTP API server
  const port = EnvUtils.getPort(3001);
  await app.listen(port);
  Logger.info(`🚀 API Gateway is running on: http://localhost:${port}/api`);

  // Create separate HTTP server for WebSocket
  const wsPort = parseInt(process.env.WS_PORT || "3003");
  const httpServer = createServer();

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Get WebSocketGateway instance and attach server
  const wsGateway = app.get(WebsocketGateway);
  const wsNamespace = io.of("/ws");
  wsGateway.server = wsNamespace;

  // Setup connection handlers manually
  wsNamespace.on("connection", (socket: any) => {
    wsGateway.handleConnection(socket);

    socket.on("disconnect", () => {
      wsGateway.handleDisconnect(socket);
    });

    socket.on("subscribe_order", (orderId: string) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("unsubscribe_order", (orderId: string) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Initialize gateway
  wsGateway.afterInit(wsNamespace as any);

  // Start WebSocket server
  httpServer.listen(wsPort, () => {
    Logger.info(
      `🔌 WebSocket server is running on: http://localhost:${wsPort}/ws`
    );
  });
}

bootstrap().catch((error) => {
  Logger.error("Failed to start API Gateway:", error);
  process.exit(1);
});
