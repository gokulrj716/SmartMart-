import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { socketManager } from '../sockets/socketManager';

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await db.query<any>(`
      SELECT 
        s.*,
        COUNT(p.id) as total_purchases
      FROM suppliers s
      LEFT JOIN purchases p ON s.id = p.supplier_id
      WHERE s.is_active = 1
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    res.json({ success: true, data: suppliers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, contactPerson, email, phone, address, taxId } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Supplier name is required' });
      return;
    }

    const id = uuidv4();
    await db.execute(`
      INSERT INTO suppliers (id, name, contact_person, email, phone, address, tax_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `, [id, name, contactPerson || null, email || null, phone || null, address || null, taxId || null]);

    res.status(201).json({ success: true, message: 'Supplier added successfully', id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create supplier' });
  }
};

export const getPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const purchases = await db.query<any>(`
      SELECT 
        p.*,
        s.name as supplier_name,
        u.name as creator_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: purchases });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
};

export const receivePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId, invoiceNumber, items } = req.body;
    const userId = req.user?.id;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Supplier ID and purchase items are required' });
      return;
    }

    const purchaseId = uuidv4();
    const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
    let totalAmount = 0;

    await db.transaction(async (trx) => {
      // Calculate total
      for (const item of items) {
        totalAmount += Number(item.quantity) * Number(item.unitCost);
      }

      await trx.execute(`
        INSERT INTO purchases (id, purchase_number, supplier_id, invoice_number, total_amount, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, 'RECEIVED', ?, datetime('now'))
      `, [purchaseId, purchaseNumber, supplierId, invoiceNumber || null, totalAmount, userId]);

      for (const item of items) {
        const batchId = uuidv4();
        const batchNumber = item.batchNumber || `BAT-${Date.now().toString().slice(-6)}`;
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);

        // Calculate standard 1 year expiry if not given
        const futureExp = new Date();
        futureExp.setMonth(futureExp.getMonth() + 12);
        const expiryDate = item.expiryDate || futureExp.toISOString().split('T')[0];

        // 1. Insert Batch for FEFO
        await trx.execute(`
          INSERT INTO product_batches (
            id, product_id, batch_number, initial_qty, remaining_qty, cost_price, mfg_date, expiry_date, supplier_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          batchId, item.productId, batchNumber, qty, qty, cost,
          item.mfgDate || new Date().toISOString().split('T')[0], expiryDate, supplierId
        ]);

        // 2. Insert Purchase Item
        await trx.execute(`
          INSERT INTO purchase_items (
            id, purchase_id, product_id, batch_number, quantity, unit_cost, mfg_date, expiry_date, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), purchaseId, item.productId, batchNumber, qty, cost, item.mfgDate || null, expiryDate, qty * cost]);

        // 3. Increment Master Product Stock
        await trx.execute(`
          UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?
        `, [qty, cost, item.productId]);

        // 4. Inventory transaction
        await trx.execute(`
          INSERT INTO inventory_transactions (id, product_id, batch_id, type, quantity, reason, reference_id, user_id, created_at)
          VALUES (?, ?, ?, 'PURCHASE', ?, 'Purchase Order Inward', ?, ?, datetime('now'))
        `, [uuidv4(), item.productId, batchId, qty, purchaseNumber, userId]);

        const updated = await trx.query(`SELECT stock FROM products WHERE id = ?`, [item.productId]);
        socketManager.broadcastInventoryUpdate(item.productId, updated[0].stock, qty);
      }
    });

    res.status(201).json({
      success: true,
      message: `Purchase Order ${purchaseNumber} received and FEFO batches created.`,
      purchaseNumber,
      totalAmount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to process purchase order: ' + err.message });
  }
};
