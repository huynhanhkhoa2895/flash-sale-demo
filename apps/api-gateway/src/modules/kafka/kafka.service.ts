// Kafka Service - Handles Kafka producer operations for API Gateway

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { KafkaProducer, TOPICS } from "kafka-config";
import { Logger } from "common-utils";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private producer: KafkaProducer;

  constructor() {
    this.producer = new KafkaProducer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      Logger.info("✅ Kafka producer connected in API Gateway");
    } catch (error) {
      Logger.error("❌ Failed to connect Kafka producer:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      Logger.info("✅ Kafka producer disconnected");
    } catch (error) {
      Logger.error("❌ Error disconnecting Kafka producer:", error);
    }
  }

  async publishOrderCreated(event: any) {
    await this.producer.sendMessage("order.created" as any, event);
    Logger.info("📤 Published order.created event", { eventId: event.eventId });
  }
}
