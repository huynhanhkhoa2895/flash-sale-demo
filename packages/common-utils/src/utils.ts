// Common utilities used across services

import { v4 as uuidv4 } from "uuid";

// ID Generation
export class IdGenerator {
  static generate(): string {
    return uuidv4();
  }

  static generateOrderId(): string {
    return `order_${uuidv4()}`;
  }

  static generateEventId(): string {
    return `event_${uuidv4()}`;
  }
}

// Event creation helpers
export function createBaseEvent(eventType: string, data: any) {
  return {
    eventId: IdGenerator.generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    version: "1.0",
    data,
  };
}

// Logging utilities
export class Logger {
  private static formatMessage(
    level: string,
    message: string,
    meta?: any
  ): string {
    const timestamp = new Date().toISOString();
    const service = process.env.SERVICE_NAME || "unknown-service";
    const baseMessage = `[${timestamp}] [${service}] [${level}] ${message}`;

    if (meta) {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }

    return baseMessage;
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage("INFO", message, meta));
  }

  static error(message: string, meta?: any): void {
    console.error(this.formatMessage("ERROR", message, meta));
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage("WARN", message, meta));
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("DEBUG", message, meta));
    }
  }
}

// Validation utilities
export class ValidationUtils {
  static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isPositiveInteger(value: any): boolean {
    return Number.isInteger(value) && value > 0;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateOrderData(data: {
    userId: string;
    productId: string;
    quantity: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // userId can be any non-empty string (not necessarily UUID)
    if (
      !data.userId ||
      typeof data.userId !== "string" ||
      data.userId.trim().length === 0
    ) {
      errors.push("Invalid userId - must be a non-empty string");
    }

    if (
      !data.productId ||
      typeof data.productId !== "string" ||
      data.productId.trim().length === 0
    ) {
      errors.push("Invalid productId - must be a non-empty string");
    }

    if (!this.isPositiveInteger(data.quantity)) {
      errors.push("Quantity must be a positive integer");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(key: string): void {
    this.timers.set(key, Date.now());
  }

  static endTimer(key: string): number {
    const startTime = this.timers.get(key);
    if (!startTime) {
      Logger.warn(`Timer ${key} not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);
    Logger.info(`Timer ${key} completed in ${duration}ms`);
    return duration;
  }

  static async measureAsync<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.startTimer(key);
    try {
      const result = await operation();
      this.endTimer(key);
      return result;
    } catch (error) {
      this.endTimer(key);
      throw error;
    }
  }
}

// Retry utilities for resilient operations
export class RetryUtils {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        Logger.warn(
          `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
          {
            error: lastError.message,
            attempt: attempt + 1,
          }
        );

        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(backoffMultiplier, attempt);
          Logger.info(`Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }
}

// Environment utilities
export class EnvUtils {
  static getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  static getOptionalEnv(
    name: string,
    defaultValue?: string
  ): string | undefined {
    return process.env[name] || defaultValue;
  }

  static getPort(defaultPort: number = 3000): number {
    const port = process.env.PORT;
    return port ? parseInt(port, 10) : defaultPort;
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  }
}
