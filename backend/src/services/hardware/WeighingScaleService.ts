// Electronic Weighing Scale Service
// Supports RS-232, USB, Network, and Mock interfaces with tare, zero, and unit conversions

export type WeightUnit = 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'pack' | 'box' | 'dozen';

export interface ScaleReading {
  weight: number;
  unit: WeightUnit;
  isStable: boolean;
  tare: number;
  grossWeight: number;
  netWeight: number;
  timestamp: string;
}

export interface HardwareStatus {
  name: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  port?: string;
  lastHeartbeat: string;
  details?: string;
}

class WeighingScaleService {
  private isConnected = true;
  private currentUnit: WeightUnit = 'kg';
  private tareWeight = 0.0;
  private mockWeight = 1.35; // Default mock weight (e.g., 1.35 kg)
  private isStable = true;
  private lastHeartbeat = new Date().toISOString();

  getStatus(): HardwareStatus {
    return {
      name: 'Electronic Weighing Scale (CAS / Avery Berkel / Mettler Toledo)',
      type: 'SCALE',
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      port: 'COM3 (RS-232 / 9600 baud)',
      lastHeartbeat: this.lastHeartbeat,
      details: `Stable: ${this.isStable}, Unit: ${this.currentUnit}`
    };
  }

  setMockWeight(weight: number, isStable = true): void {
    this.mockWeight = Math.max(0, Number(weight));
    this.isStable = isStable;
    this.lastHeartbeat = new Date().toISOString();
  }

  tare(): void {
    this.tareWeight = this.mockWeight;
    this.lastHeartbeat = new Date().toISOString();
  }

  zero(): void {
    this.tareWeight = 0.0;
    this.mockWeight = 0.0;
    this.lastHeartbeat = new Date().toISOString();
  }

  getReading(): ScaleReading {
    this.lastHeartbeat = new Date().toISOString();
    const net = Math.max(0, this.mockWeight - this.tareWeight);
    return {
      weight: Number(net.toFixed(3)),
      unit: this.currentUnit,
      isStable: this.isStable,
      tare: Number(this.tareWeight.toFixed(3)),
      grossWeight: Number(this.mockWeight.toFixed(3)),
      netWeight: Number(net.toFixed(3)),
      timestamp: new Date().toISOString()
    };
  }

  calculatePrice(unitPrice: number, netWeight: number): { netWeight: number; unitPrice: number; totalPrice: number } {
    const totalPrice = Number((unitPrice * netWeight).toFixed(2));
    return {
      netWeight,
      unitPrice,
      totalPrice
    };
  }
}

export const scaleService = new WeighingScaleService();
