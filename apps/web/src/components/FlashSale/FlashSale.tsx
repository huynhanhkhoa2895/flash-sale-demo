// Main Flash Sale Component

import React, { useState, useEffect, useRef } from 'react';
import { OrderForm } from '../OrderForm/OrderForm';
import { OrderStatus } from '../OrderStatus/OrderStatus';
import { StockDisplay } from '../StockDisplay/StockDisplay';
import { StockControl } from '../StockControl/StockControl';
import { apiClient } from '../../utils/api';
import { websocketManager } from '../../utils/websocket';
import { OrderResponse, OrderStatus as OrderStatusEnum, StockUpdateMessage, WebSocketMessage } from 'shared-types';

export const FlashSale: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(1);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch stock on mount (F5)
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const product = await apiClient.getProduct('FLASH_SALE_PRODUCT_001');
        setCurrentStock(product.availableStock);
      } catch (error) {
        console.error('Failed to fetch stock:', error);
      }
    };

    fetchStock();
  }, []);

  // Simple polling to check order status
  const pollOrderStatus = (orderId: string) => {
    // Clear existing interval if any
    const existingInterval = pollingIntervals.current.get(orderId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Poll every 1 second
    let pollCount = 0;
    const interval = setInterval(async () => {
      try {
        const order = await apiClient.getOrderStatus(orderId);
        setOrders(prev => {
          const existingIndex = prev.findIndex(o => o.id === order.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = order;
            return updated;
          } else {
            return [order, ...prev];
          }
        });

        // Update stock based on order status
        if (order.status === OrderStatusEnum.CONFIRMED) {
          setCurrentStock(prev => Math.max(0, prev - order.quantity));
        } else if (order.status === OrderStatusEnum.CANCELLED) {
          // When order is cancelled, stock should be restored
          // But actually, cancelled orders never reserved stock, so no change needed
          // However, we should refresh stock to get accurate count
          try {
            const product = await apiClient.getProduct('FLASH_SALE_PRODUCT_001');
            setCurrentStock(product.availableStock);
          } catch (error) {
            console.error('Failed to refresh stock after cancellation:', error);
          }
        }

        // Stop polling when order is finalized (CONFIRMED or CANCELLED)
        if (order.status === OrderStatusEnum.CONFIRMED || order.status === OrderStatusEnum.CANCELLED) {
          clearInterval(interval);
          pollingIntervals.current.delete(orderId);
        }

        pollCount++;
        // Stop polling after 30 seconds max
        if (pollCount >= 30) {
          clearInterval(interval);
          pollingIntervals.current.delete(orderId);
        }
      } catch (error: any) {
        console.error('Failed to poll order status:', error);
        // If order not found, stop polling
        if (error.message?.includes('not found')) {
          clearInterval(interval);
          pollingIntervals.current.delete(orderId);
        }
        // Continue polling for other errors (network issues, etc.)
      }
    }, 1000);

    pollingIntervals.current.set(orderId, interval);
  };

  useEffect(() => {
    // Connect WebSocket and listen for stock updates
    websocketManager.connect().catch(console.error);

    // Listen for stock updates via WebSocket
    const handleStockUpdate = (message: WebSocketMessage) => {
      if (message.type === 'stock_update') {
        const stockMessage = message as StockUpdateMessage;
        if (stockMessage.data.productId === 'FLASH_SALE_PRODUCT_001') {
          setCurrentStock(stockMessage.data.availableStock);
        }
      }
    };

    websocketManager.on('stock_update', handleStockUpdate);

    // Cleanup intervals and WebSocket on unmount
    return () => {
      pollingIntervals.current.forEach(interval => clearInterval(interval));
      pollingIntervals.current.clear();
      websocketManager.off('stock_update', handleStockUpdate);
    };
  }, []);

  const handleOrderCreated = (orderId: string) => {
    // Start polling for order status
    pollOrderStatus(orderId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚡ Flash Sale Demo
              </h1>
              <p className="text-gray-600 mt-1">
                Kafka Event-Driven Architecture Showcase
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Form and Status */}
          <div className="space-y-8">
            {/* Product Display */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  iPhone 15 Pro Max
                </h2>
                <span className="text-3xl font-bold text-green-600">
                  $999
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Limited time flash sale! Only <strong>1 unit</strong> remaining!
                Experience the power of event-driven architecture with Kafka.
              </p>
                      <StockDisplay currentStock={currentStock} totalStock={100} />
                      <div className="mt-4">
                        <StockControl
                          productId="FLASH_SALE_PRODUCT_001"
                          currentStock={currentStock}
                          onStockUpdated={(newStock) => {
                            setCurrentStock(newStock);
                          }}
                        />
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ Demo Mode:</strong> Only 1 item left! Try opening this page in 2 browser tabs and clicking "Buy Now" simultaneously to see race condition handling.
                        </p>
                      </div>
            </div>

            {/* Order Form */}
            <OrderForm
              onOrderCreated={handleOrderCreated}
              currentStock={currentStock}
            />

            {/* Recent Orders */}
            <OrderStatus orders={orders.slice(0, 10).map(order => ({
              type: 'order_update' as const,
              data: {
                id: order.id,
                userId: order.userId,
                productId: order.productId,
                quantity: order.quantity,
                status: order.status,
                reason: order.reason,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
              },
              timestamp: order.updatedAt || order.createdAt,
            }))} />
          </div>

          {/* Right Column - Demo Information */}
          <div className="space-y-8">
            {/* Architecture Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🏗️ Architecture Overview
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span><strong>Frontend:</strong> Next.js + WebSocket</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span><strong>API Gateway:</strong> NestJS + REST + WebSocket</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span><strong>Order Service:</strong> PostgreSQL + Kafka</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span><strong>Inventory Service:</strong> Redis + Kafka</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span><strong>Notification Service:</strong> Kafka Broadcasting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span><strong>Message Broker:</strong> Apache Kafka</span>
                </div>
              </div>
            </div>

            {/* Event Flow Demo */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Event Flow
              </h3>
              <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded-lg">
                <div className="text-blue-600">1. User clicks "Buy Now"</div>
                <div className="text-green-600">2. → API Gateway → order.created</div>
                <div className="text-purple-600">3. → Order Service → order.saved</div>
                <div className="text-red-600">4. → Inventory Service → inventory.reserved</div>
                <div className="text-yellow-600">5. → Order Service → order.confirmed</div>
                <div className="text-orange-600">6. → Notification Service → WebSocket broadcast</div>
                <div className="text-green-600 font-bold">7. ✅ User sees real-time update!</div>
              </div>
            </div>

            {/* Kafka Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Why Kafka?
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span><strong>Non-blocking:</strong> API responds immediately</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span><strong>Scalable:</strong> Services scale independently</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span><strong>Reliable:</strong> At-least-once delivery</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span><strong>Race-condition free:</strong> Atomic Redis operations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✅</span>
                  <span><strong>Real-time:</strong> WebSocket updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
