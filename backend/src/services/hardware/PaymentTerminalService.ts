// Payment Terminal Integration Service
// Emulates EMV Chip/PIN/Contactless terminal handshakes and generates dynamic UPI QR payment strings

import { HardwareStatus } from './WeighingScaleService';

export interface PaymentRequest {
  amount: number;
  invoiceNumber: string;
  method: 'CARD' | 'UPI' | 'CASH';
  terminalId?: string;
}

export interface PaymentTerminalResponse {
  success: boolean;
  transactionRef: string;
  method: string;
  amount: number;
  authCode?: string;
  cardLast4?: string;
  upiRef?: string;
  qrPayload?: string;
  timestamp: string;
}

class PaymentTerminalService {
  private isConnected = true;
  private lastHeartbeat = new Date().toISOString();

  getStatus(): HardwareStatus {
    return {
      name: 'Integrated EMV & UPI Terminal (Verifone / Ingenico / Pine Labs)',
      type: 'PAYMENT_TERMINAL',
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      port: 'Ethernet IP (192.168.1.120:8080) & USB',
      lastHeartbeat: this.lastHeartbeat,
      details: 'Ready for EMV Chip, NFC Contactless, and Dynamic UPI QR'
    };
  }

  generateDynamicUpiQr(amount: number, invoiceNumber: string): string {
    const upiId = 'smartmart.supermarket@icici';
    const payeeName = 'SmartMart Supermarket';
    const txnRef = `TXN-${Date.now().toString().slice(-6)}`;
    // Standard NPCI UPI URI Specification
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill-${invoiceNumber}`)}&tr=${txnRef}`;
  }

  async processCardPayment(amount: number, invoiceNumber: string): Promise<PaymentTerminalResponse> {
    this.lastHeartbeat = new Date().toISOString();
    // Simulate terminal handshake with contactless/chip card
    const randomRef = `APPRV-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomCard = ['4111', '5200', '3782', '6011'][Math.floor(Math.random() * 4)];

    return {
      success: true,
      transactionRef: randomRef,
      method: 'CARD',
      amount,
      authCode: `AUTH${Math.floor(1000 + Math.random() * 9000)}`,
      cardLast4: randomCard,
      timestamp: new Date().toISOString()
    };
  }

  async verifyUpiPayment(amount: number, txnRef: string): Promise<PaymentTerminalResponse> {
    this.lastHeartbeat = new Date().toISOString();
    return {
      success: true,
      transactionRef: txnRef,
      method: 'UPI',
      amount,
      upiRef: `UPI-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }
}

export const paymentTerminalService = new PaymentTerminalService();
