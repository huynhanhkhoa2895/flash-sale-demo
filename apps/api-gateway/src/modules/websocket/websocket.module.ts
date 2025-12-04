// WebSocket Module - Provides real-time updates via WebSocket

import { Module } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gateway";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [KafkaModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
