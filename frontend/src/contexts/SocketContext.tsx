import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationItem[];
  clearNotification: (id: string) => void;
  lastInventoryUpdate: { productId: string; newStock: number; change: number } | null;
  emitCustomerDisplaySync: (data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState<any>(null);

  useEffect(() => {
    // Connect to backend websocket
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket] Connected to SMARTMART Real-Time Server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 [Socket] Disconnected from Real-Time Server');
      setIsConnected(false);
    });

    // Real-time inventory deduction notification
    socketInstance.on('inventory:update', (data: any) => {
      setLastInventoryUpdate(data);
    });

    // High priority system notification
    socketInstance.on('notification:new', (data: any) => {
      const newItem: NotificationItem = {
        id: data.id || `notif-${Date.now()}`,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        timestamp: data.timestamp || new Date().toLocaleTimeString()
      };
      setNotifications(prev => [newItem, ...prev.slice(0, 19)]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const emitCustomerDisplaySync = (data: any) => {
    if (socket && isConnected) {
      socket.emit('customer-display:sync', data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        clearNotification,
        lastInventoryUpdate,
        emitCustomerDisplaySync
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
