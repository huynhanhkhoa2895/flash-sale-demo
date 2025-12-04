// API Gateway - Main Application Module

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OrdersModule } from "./modules/orders/orders.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Feature modules
    OrdersModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
