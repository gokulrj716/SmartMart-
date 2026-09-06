import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { socketManager } from '../sockets/socketManager';
import { logAuditEvent } from '../middleware/auditLogger';

export const getReturns = async (req: Request, res: Response): Promise<void> => {
  try {
    const returns = await db.query<any>(`
      SELECT 
        r.*,
        s.invoice_number as original_invoice,
        u.name as cashier_name,
        c.name as customer_name
      FROM returns r
      JOIN sales s ON r.original_sale_id = s.id
      JOIN users u ON r.cashier_id = u.id
      LEFT JOIN customers c ON r.customer_id = c.id
      ORDER BY r.created_at DESC
    `);

    res.json({ success: true, data: returns });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch returns: ' + err.message });
  }
};

export const processReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalInvoiceNumber, items, reason, conditionStatus = 'RESELLABLE' } = req.body;
    const cashierId = req.user?.id;

    if (!originalInvoiceNumber || !items || !Array.isArray(items) || items.length === 0 || !reason) {
      res.status(400).json({ success: false, message: 'Original invoice, items, and return reason are required.' });
      return;
    }

    const saleRows = await db.query<any>(`SELECT * FROM sales WHERE invoice_number = ?`, [originalInvoiceNumber]);
    if (saleRows.length === 0) {
      res.status(404).json({ success: false, message: 'Original invoice not found' });
      return;
    }

    const sale = saleRows[0];
    const returnId = uuidv4();
    const returnNumber = `RET-${Date.now().toString().slice(-8)}`;

    let totalRefund = 0;

    await db.transaction(async (trx) => {
      for (const item of items) {
        const saleItemRows = await trx.query(`
          SELECT * FROM sale_items 
          WHERE sale_id = ? AND product_id = ?
        `, [sale.id, item.productId]);

        if (saleItemRows.length === 0) {
          throw new Error(`Product not found in original sale items.`);
        }

        const saleItem = saleItemRows[0];
        const returnQty = Number(item.quantity);
        const refundAmount = Number((Number(saleItem.unit_price) * returnQty).toFixed(2));
        totalRefund += refundAmount;

        // Insert return item
        await trx.execute(`
          INSERT INTO return_items (
            id, return_id, sale_item_id, product_id, quantity, unit_price, refund_amount, condition_status, restock_action
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), returnId, saleItem.id, item.productId, returnQty,
          saleItem.unit_price, refundAmount, conditionStatus,
          conditionStatus === 'RESELLABLE' ? 'RESTOCKED' : 'DISCARDED'
        ]);

        // If resellable, restock product inventory
        if (conditionStatus === 'RESELLABLE') {
          await trx.execute(`UPDATE products SET stock = stock + ? WHERE id = ?`, [returnQty, item.productId]);

          await trx.execute(`
            INSERT INTO inventory_transactions (id, product_id, type, quantity, reason, reference_id, user_id, created_at)
            VALUES (?, ?, 'RETURN', ?, 'Customer Return Restock', ?, ?, datetime('now'))
          `, [uuidv4(), item.productId, returnQty, returnNumber, cashierId]);

          const updatedProd = await trx.query(`SELECT stock FROM products WHERE id = ?`, [item.productId]);
          socketManager.broadcastInventoryUpdate(item.productId, updatedProd[0].stock, returnQty);
        }
      }

      // Insert Return Master
      await trx.execute(`
        INSERT INTO returns (
          id, return_number, original_sale_id, customer_id, cashier_id,
          total_refund_amount, reason, status, approved_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, datetime('now'))
      `, [
        returnId, returnNumber, sale.id, sale.customer_id, cashierId,
        totalRefund, reason, req.user?.id
      ]);
    });

    await logAuditEvent({
      userId: cashierId,
      action: 'PROCESS_RETURN',
      entity: 'returns',
      entityId: returnId,
      newValues: { returnNumber, originalInvoiceNumber, totalRefund, reason }
    });

    res.status(201).json({
      success: true,
      message: `Return ${returnNumber} processed successfully. Refund amount: ₹${totalRefund.toFixed(2)}`,
      data: { returnNumber, totalRefund }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to process return: ' + err.message });
  }
};
