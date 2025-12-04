// Kafka configuration utilities

import { Kafka, Producer, Consumer, KafkaConfig } from "kafkajs";

// Kafka configuration for different environments
export const kafkaConfig: KafkaConfig = {
  clientId: "flash-sale-demo",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 8,
    multiplier: 2,
    maxRetryTime: 30000,
  },
  connectionTimeout: 10000, // Increased to 10 seconds
  requestTimeout: 30000,
};

// Consumer groups for different services
export const CONSUMER_GROUPS = {
  ORDER_SERVICE: "order-service-group",
  INVENTORY_SERVICE: "inventory-service-group",
  NOTIFICATION_SERVICE: "notification-service-group",
  API_GATEWAY: "api-gateway-group",
} as const;

// Topics configuration
export const TOPICS = {
  ORDER_EVENTS: "order.events",
  INVENTORY_EVENTS: "inventory.events",
  NOTIFICATION_EVENTS: "notification.events",
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];
export type ConsumerGroupName =
  (typeof CONSUMER_GROUPS)[keyof typeof CONSUMER_GROUPS];

// Create Kafka instance
export function createKafka(): Kafka {
  return new Kafka(kafkaConfig);
}

// Create producer with default configuration
export function createProducer(): Producer {
  const kafka = createKafka();
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 8,
      multiplier: 2,
      maxRetryTime: 30000,
    },
  });

  return producer;
}

// Create consumer with default configuration
export function createConsumer(groupId: ConsumerGroupName): Consumer {
  const kafka = createKafka();
  const consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    rebalanceTimeout: 60000,
    allowAutoTopicCreation: true,
    retry: {
      initialRetryTime: 300,
      retries: 8,
      multiplier: 2,
      maxRetryTime: 30000,
    },
  });

  return consumer;
}

// Producer utilities
export class KafkaProducer {
  private producer: Producer;

  constructor() {
    this.producer = createProducer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async sendMessage(
    topic: TopicName,
    message: any,
    key?: string
  ): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: key || message.eventId,
          value: JSON.stringify(message),
          headers: {
            timestamp: new Date().toISOString(),
            version: "1.0",
          },
        },
      ],
    });
  }

  async sendMessages(topic: TopicName, messages: any[]): Promise<void> {
    const kafkaMessages = messages.map((message) => ({
      key: message.eventId,
      value: JSON.stringify(message),
      headers: {
        timestamp: new Date().toISOString(),
        version: "1.0",
      },
    }));

    await this.producer.send({
      topic,
      messages: kafkaMessages,
    });
  }
}

// Consumer utilities
export class KafkaConsumer {
  private consumer: Consumer;

  constructor(groupId: ConsumerGroupName) {
    this.consumer = createConsumer(groupId);
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  async subscribe(topic: TopicName): Promise<void> {
    await this.consumer.subscribe({
      topic,
      fromBeginning: false, // Start from latest for demo
    });
  }

  async subscribeMultiple(topics: TopicName[]): Promise<void> {
    for (const topic of topics) {
      await this.subscribe(topic);
    }
  }

  async run(
    onMessage: (topic: string, message: any) => Promise<void>
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const value = JSON.parse(message.value?.toString() || "{}");
          await onMessage(topic, value);
        } catch (error) {
          console.error("Error processing message:", error);
          // In production, you might want to send to dead letter queue
        }
      },
    });
  }
}
