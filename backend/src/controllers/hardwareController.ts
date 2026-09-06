import { Request, Response } from 'express';
import { scaleService } from '../services/hardware/WeighingScaleService';
import { receiptPrinterService } from '../services/hardware/ReceiptPrinterService';
import { cashDrawerService } from '../services/hardware/CashDrawerService';
import { paymentTerminalService } from '../services/hardware/PaymentTerminalService';
import { cameraService } from '../services/hardware/CameraService';

export const getAllHardwareStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = [
      {
        id: 'dev-scanner-1',
        name: 'Omnidirectional USB Laser Barcode Scanner (Honeywell Xenon 1900)',
        type: 'BARCODE_SCANNER',
        status: 'CONNECTED',
        port: 'HID Keyboard / USB COM',
        lastHeartbeat: new Date().toISOString(),
        details: 'Auto-detecting EAN-13, UPC-A, GS1-128, QR Code'
      },
      cameraService.getStatus(),
      scaleService.getStatus(),
      receiptPrinterService.getStatus(),
      cashDrawerService.getStatus(),
      paymentTerminalService.getStatus(),
      {
        id: 'dev-display-1',
        name: 'Customer-Facing Pole Display & Dual Monitor',
        type: 'CUSTOMER_DISPLAY',
        status: 'CONNECTED',
        port: 'WebSocket Live Channel / HDMI2',
        lastHeartbeat: new Date().toISOString(),
        details: 'Active stream synchronized to POS Cart state'
      }
    ];

    res.json({ success: true, devices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve hardware diagnostics' });
  }
};

export const getScaleReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const reading = scaleService.getReading();
    res.json({ success: true, data: reading });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Scale reading failed' });
  }
};

export const setScaleMockWeight = async (req: Request, res: Response): Promise<void> => {
  try {
    const { weight, isStable = true } = req.body;
    scaleService.setMockWeight(Number(weight), isStable);
    res.json({ success: true, message: `Mock weight set to ${weight} kg`, data: scaleService.getReading() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to set mock weight' });
  }
};

export const tareScale = async (req: Request, res: Response): Promise<void> => {
  try {
    scaleService.tare();
    res.json({ success: true, message: 'Scale tared successfully to 0.000 kg net.', data: scaleService.getReading() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Tare command failed' });
  }
};

export const zeroScale = async (req: Request, res: Response): Promise<void> => {
  try {
    scaleService.zero();
    res.json({ success: true, message: 'Scale zeroed to reference baseline.', data: scaleService.getReading() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Zero command failed' });
  }
};

export const testReceiptPrinter = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await receiptPrinterService.testPrint();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Printer diagnostic failed' });
  }
};

export const triggerCashDrawer = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await cashDrawerService.kickDrawer(req.user?.id, 'MANUAL_DIAGNOSTIC_TRIGGER');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Drawer trigger failed' });
  }
};

export const triggerCameraAiDetection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body || {};
    const candidates = await cameraService.identifyProductFromImage(image);
    res.json({
      success: true,
      confidenceThreshold: cameraService.getThreshold(),
      candidates
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'AI Camera recognition failed' });
  }
};

export const setAiThreshold = async (req: Request, res: Response): Promise<void> => {
  try {
    const { threshold } = req.body;
    cameraService.setThreshold(Number(threshold));
    res.json({
      success: true,
      message: `AI confidence threshold updated to ${(cameraService.getThreshold() * 100).toFixed(0)}%`,
      threshold: cameraService.getThreshold()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update threshold' });
  }
};
