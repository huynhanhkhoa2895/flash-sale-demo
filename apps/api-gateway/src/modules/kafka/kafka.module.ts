// Kafka Module - Provides Kafka producer for API Gateway

import { Module } from "@nestjs/common";
import { KafkaService } from "./kafka.service";

@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
