// Stock Display Component

import React from 'react';

interface StockDisplayProps {
  currentStock: number;
  totalStock: number;
}

export const StockDisplay: React.FC<StockDisplayProps> = ({
  currentStock,
  totalStock,
}) => {
  const percentage = (currentStock / totalStock) * 100;
  const isLowStock = currentStock <= 10;
  const isOutOfStock = currentStock === 0;

  const getStockColor = () => {
    if (isOutOfStock) return 'text-red-600';
    if (isLowStock) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isOutOfStock) return 'bg-red-500';
    if (isLowStock) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStockMessage = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return 'Low Stock - Order Now!';
    if (percentage <= 25) return 'Limited Availability';
    if (percentage <= 50) return 'Popular Item';
    return 'In Stock';
  };

  const getStockIcon = () => {
    if (isOutOfStock) return '❌';
    if (isLowStock) return '⚠️';
    return '✅';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Stock Status
        </span>
        <span className={`text-sm font-semibold ${getStockColor()}`}>
          {getStockIcon()} {getStockMessage()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
          style={{ width: `${Math.max(percentage, 0)}%` }}
        />
      </div>

      {/* Stock Numbers */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          Available: <strong className={getStockColor()}>{currentStock}</strong>
        </span>
        <span className="text-gray-500">
          Total: {totalStock}
        </span>
      </div>

      {/* Sold Count */}
      <div className="mt-2 text-xs text-gray-500">
        Sold: {totalStock - currentStock} • Remaining: {currentStock}
      </div>

      {/* Urgency Messages */}
      {isLowStock && !isOutOfStock && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded animate-pulse">
          <p className="text-xs text-orange-800 text-center">
            🔥 Only {currentStock} left! Don't miss out!
          </p>
        </div>
      )}

      {isOutOfStock && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-800 text-center">
            😞 This item is currently out of stock
          </p>
        </div>
      )}
    </div>
  );
};
