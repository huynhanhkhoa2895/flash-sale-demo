import { Kafka, Producer, Consumer, KafkaConfig } from "kafkajs";
export declare const kafkaConfig: KafkaConfig;
export declare const CONSUMER_GROUPS: {
    readonly ORDER_SERVICE: "order-service-group";
    readonly INVENTORY_SERVICE: "inventory-service-group";
    readonly NOTIFICATION_SERVICE: "notification-service-group";
    readonly API_GATEWAY: "api-gateway-group";
};
export declare const TOPICS: {
    readonly ORDER_EVENTS: "order.events";
    readonly INVENTORY_EVENTS: "inventory.events";
    readonly NOTIFICATION_EVENTS: "notification.events";
};
export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];
export type ConsumerGroupName = (typeof CONSUMER_GROUPS)[keyof typeof CONSUMER_GROUPS];
export declare function createKafka(): Kafka;
export declare function createProducer(): Producer;
export declare function createConsumer(groupId: ConsumerGroupName): Consumer;
export declare class KafkaProducer {
    private producer;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(topic: TopicName, message: any, key?: string): Promise<void>;
    sendMessages(topic: TopicName, messages: any[]): Promise<void>;
}
export declare class KafkaConsumer {
    private consumer;
    constructor(groupId: ConsumerGroupName);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(topic: TopicName): Promise<void>;
    subscribeMultiple(topics: TopicName[]): Promise<void>;
    run(onMessage: (topic: string, message: any) => Promise<void>): Promise<void>;
}
