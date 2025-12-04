// Order Form Component

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../utils/api';
import { CreateOrderRequest, CreateOrderResponse } from 'shared-types';

interface OrderFormProps {
  onOrderCreated: (orderId: string) => void;
  currentStock: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  onOrderCreated,
  currentStock,
}) => {
  const [userId, setUserId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // Generate random user ID for demo
  const generateRandomUserId = () => {
    const randomId = `user_${Math.random().toString(36).substr(2, 9)}`;
    setUserId(randomId);
  };

  // Create order mutation
  const createOrderMutation = useMutation<
    CreateOrderResponse,
    Error,
    CreateOrderRequest
  >({
    mutationFn: apiClient.createOrder,
    onSuccess: (data) => {
      setLastOrderId(data.orderId);
      onOrderCreated(data.orderId);
      // Clear form
      setUserId('');
      setQuantity(1);
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      alert('Please enter a user ID');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    if (quantity > currentStock) {
      alert(`Cannot order ${quantity} items. Only ${currentStock} available.`);
      return;
    }

    const request: CreateOrderRequest = {
      userId: userId.trim(),
      productId: 'FLASH_SALE_PRODUCT_001',
      quantity,
    };

    createOrderMutation.mutate(request);
  };

  const isLoading = createOrderMutation.isPending;
  const error = createOrderMutation.error;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🛒 Place Your Order
      </h2>

      {/* Stock Warning */}
      {currentStock <= 10 && currentStock > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              🔥
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-800">
                Only <strong>{currentStock}</strong> items left! Order quickly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock */}
      {currentStock === 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              ❌
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Sorry, this product is currently out of stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {createOrderMutation.isSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              ✅
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                Order created successfully! Order ID: <strong>{lastOrderId}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              ❌
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {handleApiError(error).message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your user ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={generateRandomUserId}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              disabled={isLoading}
            >
              🎲 Random
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            max={currentStock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum available: {currentStock}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || currentStock === 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : currentStock === 0 ? (
            'Out of Stock'
          ) : (
            '🚀 Buy Now'
          )}
        </button>
      </form>

      {/* Demo Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          📚 Demo Instructions
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use the "Random" button to generate a user ID</li>
          <li>• Try ordering multiple items quickly to see race condition handling</li>
          <li>• Watch real-time updates in the order status panel</li>
          <li>• Open multiple browser tabs to simulate concurrent users</li>
        </ul>
      </div>
    </div>
  );
};
