// WebSocket Status Component

import React from 'react';

interface WebSocketStatusProps {
  isConnected: boolean;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  isConnected,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected
            ? 'bg-green-500 animate-pulse'
            : 'bg-red-500 animate-pulse'
        }`}
      />
      <span className="text-sm font-medium">
        {isConnected ? '🟢 Live' : '🔴 Offline'}
      </span>
      <span className="text-xs text-gray-500 hidden sm:inline">
        {isConnected ? 'Real-time updates active' : 'Real-time updates disabled'}
      </span>
    </div>
  );
};
