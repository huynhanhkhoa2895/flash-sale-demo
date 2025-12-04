"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaConsumer = exports.KafkaProducer = exports.TOPICS = exports.CONSUMER_GROUPS = exports.kafkaConfig = void 0;
exports.createKafka = createKafka;
exports.createProducer = createProducer;
exports.createConsumer = createConsumer;
const kafkajs_1 = require("kafkajs");
exports.kafkaConfig = {
    clientId: "flash-sale-demo",
    brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
    retry: {
        initialRetryTime: 100,
        retries: 10,
    },
    connectionTimeout: 3000,
    requestTimeout: 30000,
};
exports.CONSUMER_GROUPS = {
    ORDER_SERVICE: "order-service-group",
    INVENTORY_SERVICE: "inventory-service-group",
    NOTIFICATION_SERVICE: "notification-service-group",
    API_GATEWAY: "api-gateway-group",
};
exports.TOPICS = {
    ORDER_EVENTS: "order.events",
    INVENTORY_EVENTS: "inventory.events",
    NOTIFICATION_EVENTS: "notification.events",
};
function createKafka() {
    return new kafkajs_1.Kafka(exports.kafkaConfig);
}
function createProducer() {
    const kafka = createKafka();
    const producer = kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
    });
    return producer;
}
function createConsumer(groupId) {
    const kafka = createKafka();
    const consumer = kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        rebalanceTimeout: 60000,
        allowAutoTopicCreation: true,
    });
    return consumer;
}
class KafkaProducer {
    producer;
    constructor() {
        this.producer = createProducer();
    }
    async connect() {
        await this.producer.connect();
    }
    async disconnect() {
        await this.producer.disconnect();
    }
    async sendMessage(topic, message, key) {
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
    async sendMessages(topic, messages) {
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
exports.KafkaProducer = KafkaProducer;
class KafkaConsumer {
    consumer;
    constructor(groupId) {
        this.consumer = createConsumer(groupId);
    }
    async connect() {
        await this.consumer.connect();
    }
    async disconnect() {
        await this.consumer.disconnect();
    }
    async subscribe(topic) {
        await this.consumer.subscribe({
            topic,
            fromBeginning: false,
        });
    }
    async subscribeMultiple(topics) {
        for (const topic of topics) {
            await this.subscribe(topic);
        }
    }
    async run(onMessage) {
        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const value = JSON.parse(message.value?.toString() || "{}");
                    await onMessage(topic, value);
                }
                catch (error) {
                    console.error("Error processing message:", error);
                }
            },
        });
    }
}
exports.KafkaConsumer = KafkaConsumer;
//# sourceMappingURL=config.js.map