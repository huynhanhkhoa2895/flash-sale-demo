// Order Status Component

import React from 'react';
import { OrderUpdateMessage } from 'shared-types';

interface OrderStatusProps {
  orders: OrderUpdateMessage[];
}

export const OrderStatus: React.FC<OrderStatusProps> = ({ orders }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-200 bg-yellow-50';
      case 'CONFIRMED':
        return 'border-green-200 bg-green-50';
      case 'CANCELLED':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'CONFIRMED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '🔄';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          📊 Live Order Status
        </h2>
        <span className="text-sm text-gray-500">
          {orders.length} recent orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-gray-500">No orders yet. Place your first order to see real-time updates!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {orders.map((order, index) => (
            <div
              key={order.data.id}
              className={`p-4 border rounded-lg transition-all duration-300 ${getStatusColor(order.data.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(order.data.status)}</span>
                  <span className="font-semibold text-gray-900">
                    Order #{order.data.id.slice(-8)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(order.timestamp)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">User:</span>
                  <span className="ml-1 font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                    {order.data.userId.slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="ml-1 font-semibold">{order.data.quantity}</span>
                </div>
              </div>

              {order.data.reason && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  Reason: {order.data.reason}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Status updated via WebSocket
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Legend:</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span>⏳</span>
            <span>PENDING - Order received, processing</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span>CONFIRMED - Payment ready</span>
          </div>
          <div className="flex items-center gap-1">
            <span>❌</span>
            <span>CANCELLED - Out of stock or error</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔄</span>
            <span>PROCESSING - Being handled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
