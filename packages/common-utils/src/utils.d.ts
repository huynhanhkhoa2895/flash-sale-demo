export declare class IdGenerator {
    static generate(): string;
    static generateOrderId(): string;
    static generateEventId(): string;
}
export declare function createBaseEvent(eventType: string, data: any): {
    eventId: string;
    eventType: string;
    timestamp: string;
    version: string;
    data: any;
};
export declare class Logger {
    private static formatMessage;
    static info(message: string, meta?: any): void;
    static error(message: string, meta?: any): void;
    static warn(message: string, meta?: any): void;
    static debug(message: string, meta?: any): void;
}
export declare class ValidationUtils {
    static isValidUUID(uuid: string): boolean;
    static isPositiveInteger(value: any): boolean;
    static isValidEmail(email: string): boolean;
    static validateOrderData(data: {
        userId: string;
        productId: string;
        quantity: number;
    }): {
        isValid: boolean;
        errors: string[];
    };
}
export declare class PerformanceMonitor {
    private static timers;
    static startTimer(key: string): void;
    static endTimer(key: string): number;
    static measureAsync<T>(key: string, operation: () => Promise<T>): Promise<T>;
}
export declare class RetryUtils {
    static withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number, backoffMultiplier?: number): Promise<T>;
}
export declare class EnvUtils {
    static getRequiredEnv(name: string): string;
    static getOptionalEnv(name: string, defaultValue?: string): string | undefined;
    static getPort(defaultPort?: number): number;
    static isProduction(): boolean;
    static isDevelopment(): boolean;
}
