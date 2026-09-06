import { Request, Response } from 'express';
import { db } from '../database/db';
import { logAuditEvent } from '../middleware/auditLogger';

export interface PaymentQrConfig {
  upiId: string;
  merchantName: string;
  mode: 'DYNAMIC_UPI' | 'CUSTOM_IMAGE';
  customQrImage?: string | null;
  currency: string;
  notes?: string;
}

const DEFAULT_CONFIG: PaymentQrConfig = {
  upiId: 'smartmart.supermarket@icici',
  merchantName: 'SMARTMART Supermarket Ltd',
  mode: 'DYNAMIC_UPI',
  customQrImage: null,
  currency: 'INR',
  notes: 'Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM)'
};

export const getPaymentQrSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db.query<any>(`SELECT value FROM system_settings WHERE key = 'payment_qr_config'`);
    const config: PaymentQrConfig = rows.length > 0 ? JSON.parse(rows[0].value) : DEFAULT_CONFIG;
    
    res.json({
      success: true,
      config,
      data: {
        vpa: config.upiId,
        upiId: config.upiId,
        merchantName: config.merchantName,
        mode: config.mode,
        qrImageUrl: config.customQrImage,
        customQrImage: config.customQrImage,
        currency: config.currency,
        notes: config.notes
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment QR settings: ' + err.message });
  }
};

export const savePaymentQrSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const finalUpiId = req.body.upiId || req.body.vpa;
    const finalMerchant = req.body.merchantName;
    const finalMode = req.body.mode === 'CUSTOM_IMAGE' ? 'CUSTOM_IMAGE' : 'DYNAMIC_UPI';
    const finalImage = req.body.customQrImage || req.body.qrImageUrl || null;
    const finalNotes = req.body.notes || 'Scan with any UPI App';

    if (!finalUpiId || !finalMerchant) {
      res.status(400).json({ success: false, message: 'UPI ID (VPA) and Merchant Name are required.' });
      return;
    }

    const newConfig: PaymentQrConfig = {
      upiId: finalUpiId.trim(),
      merchantName: finalMerchant.trim(),
      mode: finalMode,
      customQrImage: finalImage,
      currency: 'INR',
      notes: finalNotes
    };

    const valueStr = JSON.stringify(newConfig);

    // Upsert into system_settings
    const existing = await db.query<any>(`SELECT key FROM system_settings WHERE key = 'payment_qr_config'`);
    if (existing.length > 0) {
      await db.execute(`
        UPDATE system_settings 
        SET value = ?, updated_at = datetime('now')
        WHERE key = 'payment_qr_config'
      `, [valueStr]);
    } else {
      await db.execute(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('payment_qr_config', ?, datetime('now'))
      `, [valueStr]);
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'PAYMENT_QR_UPDATE',
      entity: 'system_settings',
      entityId: 'payment_qr_config',
      newValues: newConfig
    });

    res.json({
      success: true,
      message: 'Payment QR settings updated successfully.',
      config: newConfig
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save payment QR settings: ' + err.message });
  }
};
