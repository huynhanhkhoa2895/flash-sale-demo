export interface BaseEvent {
    eventId: string;
    timestamp: string;
    version: string;
}
export interface OrderCreatedEvent extends BaseEvent {
    eventType: "order.created";
    data: {
        orderId: string;
        userId: string;
        productId: string;
        quantity: number;
    };
}
export interface OrderSavedEvent extends BaseEvent {
    eventType: "order.saved";
    data: {
        orderId: string;
        userId: string;
        productId: string;
        quantity: number;
        status: "PENDING";
    };
}
export interface OrderConfirmedEvent extends BaseEvent {
    eventType: "order.confirmed";
    data: {
        orderId: string;
        userId: string;
        productId: string;
        quantity: number;
    };
}
export interface OrderCancelledEvent extends BaseEvent {
    eventType: "order.cancelled";
    data: {
        orderId: string;
        userId: string;
        productId: string;
        quantity: number;
        reason: string;
    };
}
export interface InventoryReservedEvent extends BaseEvent {
    eventType: "inventory.reserved";
    data: {
        orderId: string;
        productId: string;
        quantity: number;
        remainingStock: number;
    };
}
export interface InventoryInsufficientEvent extends BaseEvent {
    eventType: "inventory.insufficient";
    data: {
        orderId: string;
        productId: string;
        quantity: number;
        availableStock: number;
        reason: "OUT_OF_STOCK";
    };
}
export interface NotificationOrderUpdateEvent extends BaseEvent {
    eventType: "notification.order_update";
    data: {
        orderId: string;
        userId: string;
        status: "PENDING" | "CONFIRMED" | "CANCELLED";
        productName?: string;
        message: string;
    };
}
export interface NotificationStockUpdateEvent extends BaseEvent {
    eventType: "notification.stock_update";
    data: {
        productId: string;
        availableStock: number;
        totalSold: number;
        message: string;
    };
}
export type OrderEvent = OrderCreatedEvent | OrderSavedEvent | OrderConfirmedEvent | OrderCancelledEvent;
export type InventoryEvent = InventoryReservedEvent | InventoryInsufficientEvent;
export type NotificationEvent = NotificationOrderUpdateEvent | NotificationStockUpdateEvent;
export type FlashSaleEvent = OrderEvent | InventoryEvent | NotificationEvent;
export declare const TOPICS: {
    readonly ORDER_EVENTS: "order.events";
    readonly INVENTORY_EVENTS: "inventory.events";
    readonly NOTIFICATION_EVENTS: "notification.events";
};
export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];
