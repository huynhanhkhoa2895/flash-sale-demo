// Custom Socket.IO Adapter with CORS configuration

import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";

export class SocketIOAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const allowedOrigins = [
      frontendUrl,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    const serverOptions: ServerOptions = {
      ...options,
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
    };

    return super.createIOServer(port, serverOptions);
  }
}
