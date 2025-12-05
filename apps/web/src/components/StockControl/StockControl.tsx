// Stock Control Component - Admin controls for stock management

import React, { useState } from 'react';
import { apiClient } from '../../utils/api';

interface StockControlProps {
  productId: string;
  currentStock: number;
  onStockUpdated: (newStock: number) => void;
}

export const StockControl: React.FC<StockControlProps> = ({
  productId,
  currentStock,
  onStockUpdated,
}) => {
  const [stockInput, setStockInput] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetStock = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiClient.resetStock(productId);
      setSuccess(`Stock reset to ${result.availableStock}`);
      onStockUpdated(result.availableStock);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset stock');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetStock = async () => {
    const stock = parseInt(stockInput, 10);
    
    if (isNaN(stock) || stock < 0) {
      setError('Please enter a valid non-negative number');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiClient.setStock(productId, stock);
      setSuccess(`Stock set to ${result.availableStock}`);
      onStockUpdated(result.availableStock);
      setStockInput('1');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to set stock');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        🔧 Stock Control
      </h3>
      
      <div className="space-y-3">
        {/* Current Stock Display */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-sm font-medium text-gray-700">Current Stock:</span>
          <span className="text-lg font-bold text-blue-600">{currentStock}</span>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleResetStock}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Resetting...' : '🔄 Reset to 1'}
        </button>

        {/* Set Stock Input */}
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            placeholder="Enter stock"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSetStock}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
          >
            {isLoading ? 'Setting...' : 'Set Stock'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            ✅ {success}
          </div>
        )}
      </div>
    </div>
  );
};

