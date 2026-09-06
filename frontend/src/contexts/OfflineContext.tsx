import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface QueuedTransaction {
  id: string;
  invoiceNumber: string;
  idempotencyKey: string;
  customerId?: string;
  cashierId?: string;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  timestamp: string;
}

interface OfflineContextType {
  isOnline: boolean;
  queuedCount: number;
  queueSale: (sale: Omit<QueuedTransaction, 'id' | 'idempotencyKey' | 'timestamp'>) => Promise<QueuedTransaction>;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queuedSales, setQueuedSales] = useState<QueuedTransaction[]>(() => {
    const saved = localStorage.getItem('smartmart_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [Network] Connection restored. Starting automatic sync...');
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      console.warn('⚠️ [Network] Connection lost. POS entering offline queue mode.');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedSales]);

  const queueSale = async (saleData: Omit<QueuedTransaction, 'id' | 'idempotencyKey' | 'timestamp'>): Promise<QueuedTransaction> => {
    const id = `OFF-${Date.now()}`;
    const newTxn: QueuedTransaction = {
      ...saleData,
      id,
      idempotencyKey: `IDEM-OFF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString()
    };

    const updated = [...queuedSales, newTxn];
    setQueuedSales(updated);
    localStorage.setItem('smartmart_offline_queue', JSON.stringify(updated));
    return newTxn;
  };

  const syncNow = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    const currentQueue = JSON.parse(localStorage.getItem('smartmart_offline_queue') || '[]');
    if (currentQueue.length === 0) {
      return { success: true, syncedCount: 0, message: 'No offline transactions pending.' };
    }

    setIsSyncing(true);
    try {
      const res = await api.post<any>('/pos/sync', { offlineTransactions: currentQueue });
      if (res.success) {
        localStorage.removeItem('smartmart_offline_queue');
        setQueuedSales([]);
        setIsSyncing(false);
        return {
          success: true,
          syncedCount: currentQueue.length,
          message: `Successfully synchronized ${currentQueue.length} offline transactions.`
        };
      }
      throw new Error(res.message);
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, syncedCount: 0, message: 'Sync failed: ' + err.message };
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedCount: queuedSales.length,
        queueSale,
        syncNow,
        isSyncing
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
