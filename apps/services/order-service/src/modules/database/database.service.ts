// Database Service - Database health checks and utilities

import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { Logger } from "common-utils";

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async healthCheck(): Promise<boolean> {
    try {
      await this.connection.query("SELECT 1");
      Logger.debug("Database health check passed");
      return true;
    } catch (error) {
      Logger.error("Database health check failed:", error);
      return false;
    }
  }

  async getConnectionStats() {
    return {
      isConnected: this.connection.isConnected,
      name: this.connection.name,
      options: {
        type: this.connection.options.type,
        host: (this.connection.options as any).host,
        database: (this.connection.options as any).database,
      },
    };
  }
}
