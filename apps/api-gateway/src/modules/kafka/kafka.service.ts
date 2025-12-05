// Kafka Service - Handles Kafka producer operations for API Gateway

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { KafkaProducer, TOPICS } from "kafka-config";
import { Logger, RetryUtils } from "common-utils";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private producer: KafkaProducer;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.producer = new KafkaProducer();
  }

  async onModuleInit() {
    // Start connection in background, don't block startup
    this.connectionPromise = this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        Logger.info("✅ Kafka producer connected in API Gateway", {
          attempt,
        });
        return;
      } catch (error: any) {
        Logger.warn(
          `⚠️ Kafka producer connection attempt ${attempt}/${maxRetries} failed:`,
          {
            error: error.message,
            attempt,
          }
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          Logger.error(
            "❌ Failed to connect Kafka producer after all retries:",
            error
          );
          // Don't throw - allow service to start and retry on first publish
        }
      }
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    // Wait for ongoing connection attempt
    if (this.connectionPromise) {
      try {
        await this.connectionPromise;
        if (this.isConnected) {
          return;
        }
      } catch (error) {
        // Connection failed, will retry below
      }
    }

    // Retry connection if not connected (with timeout)
    const connectionTimeout = 5000; // 5 seconds max wait
    const startTime = Date.now();

    while (!this.isConnected && Date.now() - startTime < connectionTimeout) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        Logger.info("✅ Kafka producer connected (retry)");
        return;
      } catch (error: any) {
        Logger.warn("⚠️ Kafka producer connection retry failed:", {
          error: error.message,
          elapsed: Date.now() - startTime,
        });
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // If still not connected after timeout, log warning but don't throw
    if (!this.isConnected) {
      Logger.warn(
        "⚠️ Kafka producer not connected after timeout, will retry on next publish"
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      Logger.info("✅ Kafka producer disconnected");
    } catch (error) {
      Logger.error("❌ Error disconnecting Kafka producer:", error);
    }
  }

  async publishOrderCreated(event: any): Promise<void> {
    // Ensure connection before publishing (non-blocking)
    try {
      await this.ensureConnected();
    } catch (error: any) {
      Logger.warn("⚠️ Kafka producer not ready, skipping publish:", {
        error: error.message,
        eventId: event.eventId,
      });
      // Don't throw - allow order creation to succeed
      return;
    }

    // Only publish if connected
    if (!this.isConnected) {
      Logger.warn("⚠️ Kafka producer not connected, skipping publish:", {
        eventId: event.eventId,
      });
      return;
    }

    // Retry logic for publishing
    try {
      await RetryUtils.withRetry(
        async () => {
          await this.producer.sendMessage("order.created" as any, event);
        },
        3, // maxRetries
        500, // initial delay
        2 // backoff multiplier
      );

      Logger.info("📤 Published order.created event", {
        eventId: event.eventId,
      });
    } catch (error: any) {
      Logger.error("❌ Failed to publish order.created event after retries:", {
        error: error.message,
        eventId: event.eventId,
      });
      // Don't throw - allow order creation to succeed even if Kafka fails
      // In production, you might want to queue this for later retry
    }
  }
}
