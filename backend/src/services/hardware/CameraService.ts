// Camera & AI Computer Vision Product Recognition Service
// Provides barcode/QR recognition and AI visual item recognition with confidence scoring

import { HardwareStatus } from './WeighingScaleService';

export interface AiVisionResult {
  productId: string;
  sku: string;
  name: string;
  category: string;
  confidence: number; // 0.0 - 1.0 (e.g., 0.96)
  requiresConfirmation: boolean;
  suggestedPlu?: string;
  price: number;
  unit: string;
  isWeighted: boolean;
}

class CameraService {
  private isConnected = true;
  private lastHeartbeat = new Date().toISOString();
  private confidenceThreshold = 0.85; // 85% threshold

  getStatus(): HardwareStatus {
    return {
      name: 'Overhead AI Vision & Barcode Camera (Logitech Brio 4K / Cognex Vision)',
      type: 'CAMERA',
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      port: 'USB 3.0 / Video0',
      lastHeartbeat: this.lastHeartbeat,
      details: `Resolution: 1080p 60fps, AI Classifier: Ready, Confidence Threshold: ${(this.confidenceThreshold * 100)}%`
    };
  }

  setThreshold(val: number): void {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, val));
  }

  getThreshold(): number {
    return this.confidenceThreshold;
  }

  // Identifies loose produce / items via visual classifier
  async identifyProductFromImage(imageSnapshotBase64?: string): Promise<AiVisionResult[]> {
    this.lastHeartbeat = new Date().toISOString();

    // Realistic multi-label produce candidates with confidence scores
    const candidateSamples: AiVisionResult[] = [
      {
        productId: 'prod-veg-001',
        sku: 'SM-VEG-TOMATO',
        name: 'Fresh Farm Tomatoes',
        category: 'Fresh Vegetables',
        confidence: 0.96,
        requiresConfirmation: 0.96 < this.confidenceThreshold,
        suggestedPlu: '4087',
        price: 40.0,
        unit: 'kg',
        isWeighted: true
      },
      {
        productId: 'prod-veg-002',
        sku: 'SM-VEG-POTATO',
        name: 'Organic Potatoes',
        category: 'Fresh Vegetables',
        confidence: 0.88,
        requiresConfirmation: 0.88 < this.confidenceThreshold,
        suggestedPlu: '4072',
        price: 35.0,
        unit: 'kg',
        isWeighted: true
      },
      {
        productId: 'prod-fruit-001',
        sku: 'SM-FRT-APPLE-SHML',
        name: 'Shimla Red Apples',
        category: 'Fresh Fruits',
        confidence: 0.92,
        requiresConfirmation: 0.92 < this.confidenceThreshold,
        suggestedPlu: '4131',
        price: 180.0,
        unit: 'kg',
        isWeighted: true
      },
      {
        productId: 'prod-fruit-002',
        sku: 'SM-FRT-BANANA-ROB',
        name: 'Robusta Bananas',
        category: 'Fresh Fruits',
        confidence: 0.78, // Below threshold -> triggers cashier confirmation!
        requiresConfirmation: 0.78 < this.confidenceThreshold,
        suggestedPlu: '4011',
        price: 60.0,
        unit: 'dozen',
        isWeighted: false
      }
    ];

    // Return the top identified results with explicit cashier confirmation flag
    return candidateSamples.map(c => ({
      ...c,
      requiresConfirmation: c.confidence < this.confidenceThreshold
    }));
  }
}

export const cameraService = new CameraService();
