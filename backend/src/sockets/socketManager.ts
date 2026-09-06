// Real-Time Socket.IO Manager
// Coordinates inventory broadcasts, customer displays, POS events, and alerts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface CustomerDisplayPayload {
  terminalId: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentState: 'IDLE' | 'SCANNING' | 'PAYMENT_PENDING' | 'PAID';
  paymentMethod?: string;
  upiQrPayload?: string;
  changeDue?: number;
}

class SocketManager {
  private io: SocketIOServer | null = null;

  init(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`⚡ [Socket.IO] Client connected: ${socket.id}`);

      // Client joins dedicated room
      socket.on('join:room', (roomName: string) => {
        socket.join(roomName);
        console.log(`⚡ [Socket.IO] Socket ${socket.id} joined room: ${roomName}`);
      });

      // Cashier POS sends cart updates to Customer Facing Display
      socket.on('customer-display:sync', (payload: CustomerDisplayPayload) => {
        // Broadcast to all secondary displays listening on this terminal room or global
        this.io?.emit('customer-display:update', payload);
      });

      socket.on('disconnect', () => {
        console.log(`⚡ [Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Broadcasts deducted inventory to all POS clients and Admin dashboards
  broadcastInventoryUpdate(productId: string, newStock: number, change: number): void {
    if (!this.io) return;
    this.io.emit('inventory:update', {
      productId,
      newStock,
      change,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcasts high priority alerts (low stock, anomaly, large transaction)
  broadcastNotification(notification: { title: string; message: string; type: string; id?: string }): void {
    if (!this.io) return;
    this.io.emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcasts live hardware status update
  broadcastHardwareEvent(hardwareName: string, status: string, details?: string): void {
    if (!this.io) return;
    this.io.emit('hardware:event', {
      hardwareName,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export const socketManager = new SocketManager();
