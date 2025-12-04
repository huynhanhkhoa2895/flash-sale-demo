// Inventory Service - Main Application Module

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { RedisModule } from "./modules/redis/redis.module";

// Custom naming strategy to convert camelCase to snake_case
class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[]
  ): string {
    if (customName) return customName;
    return propertyName.replace(/([A-Z])/g, "_$1").toLowerCase();
  }
}

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Database configuration (for reading product info)
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "flashsale",
      password: process.env.DB_PASSWORD || "flashsale123",
      database: process.env.DB_DATABASE || "flash_sale",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: false, // Don't sync in inventory service
      logging: process.env.NODE_ENV === "development",
      namingStrategy: new SnakeNamingStrategy(),
    }),

    // Feature modules
    RedisModule,
    InventoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
