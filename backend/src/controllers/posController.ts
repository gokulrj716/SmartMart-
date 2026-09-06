import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { socketManager } from '../sockets/socketManager';
import { cashDrawerService } from '../services/hardware/CashDrawerService';
import { receiptPrinterService, ReceiptData } from '../services/hardware/ReceiptPrinterService';
import { paymentTerminalService } from '../services/hardware/PaymentTerminalService';
import { logAuditEvent } from '../middleware/auditLogger';

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export const processSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      items,
      paymentMethod = 'CASH',
      discountAmount = 0,
      idempotencyKey,
      notes,
      amountTendered = 0
    } = req.body;

    const cashierId = req.user?.id || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
      return;
    }

    // 1. Idempotency Check: Prevent duplicate billing
    if (idempotencyKey) {
      const existingSale = await db.query<any>(`SELECT * FROM sales WHERE idempotency_key = ?`, [idempotencyKey]);
      if (existingSale.length > 0) {
        console.log(`ℹ️ [POS] Idempotency match: returning existing sale ${existingSale[0].invoice_number}`);
        res.json({
          success: true,
          message: 'Sale already processed (Idempotent response)',
          data: existingSale[0]
        });
        return;
      }
    }

    // 2. Perform Atomic Database Transaction
    const result = await db.transaction(async (trx) => {
      let subtotal = 0;
      let totalTax = 0;
      const saleId = uuidv4();
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

      // Validate stock and prepare sale items
      const processedItems: any[] = [];

      for (const item of items) {
        const prodRows = await trx.query(`SELECT * FROM products WHERE id = ? AND is_active = 1`, [item.productId]);
        if (prodRows.length === 0) {
          throw new Error(`Product ID ${item.productId} not found or inactive.`);
        }

        const product = prodRows[0];
        const requestedQty = Number(item.quantity);

        if (Number(product.stock) < requestedQty) {
          throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.stock} ${product.unit}, requested: ${requestedQty}`);
        }

        const unitPrice = Number(item.unitPrice || product.price);
        const itemDiscount = Number(item.discountAmount || 0);
        const itemSubtotal = (unitPrice * requestedQty) - itemDiscount;
        const taxRate = Number(product.gst_rate || 5);
        const taxAmount = Number(((itemSubtotal * taxRate) / 100).toFixed(2));
        const itemTotal = Number((itemSubtotal + taxAmount).toFixed(2));

        subtotal += itemSubtotal;
        totalTax += taxAmount;

        // FEFO Batch Allocation: deduct from earliest expiring batch
        const batches = await trx.query(`
          SELECT * FROM product_batches 
          WHERE product_id = ? AND remaining_qty > 0 
          ORDER BY expiry_date ASC
        `, [product.id]);

        let remainingToDeduct = requestedQty;
        let selectedBatchId: string | null = null;

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          selectedBatchId = batch.id;
          const deductFromThisBatch = Math.min(Number(batch.remaining_qty), remainingToDeduct);
          await trx.execute(`
            UPDATE product_batches 
            SET remaining_qty = remaining_qty - ? 
            WHERE id = ?
          `, [deductFromThisBatch, batch.id]);
          remainingToDeduct -= deductFromThisBatch;
        }

        // Deduct master product stock
        const newStock = Number((Number(product.stock) - requestedQty).toFixed(3));
        await trx.execute(`UPDATE products SET stock = ? WHERE id = ?`, [newStock, product.id]);

        // Insert inventory transaction record
        await trx.execute(`
          INSERT INTO inventory_transactions (id, product_id, batch_id, type, quantity, reason, reference_id, user_id, created_at)
          VALUES (?, ?, ?, 'SALE', ?, 'POS Customer Sale', ?, ?, datetime('now'))
        `, [uuidv4(), product.id, selectedBatchId, -requestedQty, invoiceNumber, cashierId]);

        processedItems.push({
          id: uuidv4(),
          saleId,
          productId: product.id,
          batchId: selectedBatchId,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          quantity: requestedQty,
          unitPrice,
          costPrice: Number(product.cost_price || 0),
          discountAmount: itemDiscount,
          taxRate,
          taxAmount,
          itemTotal,
          newStock,
          minStockAlert: Number(product.min_stock_alert)
        });
      }

      const totalAmount = Number((subtotal + totalTax - Number(discountAmount || 0)).toFixed(2));

      // Get active cashier session if any
      const openSession = await trx.query(`SELECT id FROM cashier_sessions WHERE cashier_id = ? AND status = 'OPEN'`, [cashierId]);
      const sessionId = openSession.length > 0 ? openSession[0].id : null;

      // Insert Sale Master
      await trx.execute(`
        INSERT INTO sales (
          id, invoice_number, customer_id, cashier_id, session_id, subtotal, discount_amount,
          tax_amount, total_amount, payment_method, payment_status, sync_status, idempotency_key, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'ONLINE', ?, ?, datetime('now'))
      `, [
        saleId, invoiceNumber, customerId || null, cashierId, sessionId,
        subtotal, Number(discountAmount || 0), totalTax, totalAmount, paymentMethod,
        idempotencyKey || null, notes || null
      ]);

      // Insert Sale Items
      for (const pi of processedItems) {
        await trx.execute(`
          INSERT INTO sale_items (
            id, sale_id, product_id, batch_id, product_name, sku, unit, quantity,
            unit_price, cost_price, discount_amount, tax_rate, tax_amount, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          pi.id, pi.saleId, pi.productId, pi.batchId, pi.name, pi.sku, pi.unit,
          pi.quantity, pi.unitPrice, pi.costPrice, pi.discountAmount, pi.taxRate, pi.taxAmount, pi.itemTotal
        ]);
      }

      // Insert Payment
      await trx.execute(`
        INSERT INTO payments (id, sale_id, payment_method, amount, transaction_ref, provider_status, created_at)
        VALUES (?, ?, ?, ?, ?, 'SUCCESS', datetime('now'))
      `, [uuidv4(), saleId, paymentMethod, totalAmount, `TXN-${Date.now()}`]);

      // Customer Loyalty Points: 1 point per 100 INR spent
      let loyaltyEarned = 0;
      let loyaltyBalance = 0;
      if (customerId) {
        loyaltyEarned = Math.floor(totalAmount / 100);
        await trx.execute(`
          UPDATE customers 
          SET loyalty_points = loyalty_points + ?, total_spent = total_spent + ?
          WHERE id = ?
        `, [loyaltyEarned, totalAmount, customerId]);

        const custRow = await trx.query(`SELECT loyalty_points FROM customers WHERE id = ?`, [customerId]);
        loyaltyBalance = custRow[0]?.loyalty_points || 0;
      }

      return {
        saleId,
        invoiceNumber,
        subtotal,
        discountAmount,
        totalTax,
        totalAmount,
        paymentMethod,
        processedItems,
        loyaltyEarned,
        loyaltyBalance
      };
    });

    // 3. Post-Transaction Triggers & Hardware Integrations
    // Cash Drawer Kick on cash payment
    if (paymentMethod === 'CASH') {
      await cashDrawerService.kickDrawer(cashierId || undefined, `POS_SALE_${result.invoiceNumber}`);
    }

    // Thermal Receipt Generation
    const receiptData: ReceiptData = {
      storeName: 'SMARTMART SUPERMARKET',
      storeAddress: '100 Metro Hypermarket Boulevard, Central Hub',
      storePhone: '+91 800-SMARTMART',
      storeGst: '29AAAAA0000A1Z5',
      invoiceNumber: result.invoiceNumber,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      cashierName: req.user?.name || 'Cashier 01',
      loyaltyPointsEarned: result.loyaltyEarned,
      loyaltyPointsBalance: result.loyaltyBalance,
      items: result.processedItems.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        unitPrice: p.unitPrice,
        discount: p.discountAmount,
        tax: p.taxAmount,
        total: p.itemTotal
      })),
      subtotal: result.subtotal,
      discountTotal: Number(result.discountAmount),
      taxTotal: result.totalTax,
      grandTotal: result.totalAmount,
      paymentMethod,
      changeGiven: amountTendered > result.totalAmount ? Number((amountTendered - result.totalAmount).toFixed(2)) : 0
    };

    const printedReceipt = await receiptPrinterService.printReceipt(receiptData);

    // 4. Real-time WebSockets Broadcasts
    result.processedItems.forEach(p => {
      socketManager.broadcastInventoryUpdate(p.productId, p.newStock, -p.quantity);
      if (p.newStock <= p.minStockAlert) {
        socketManager.broadcastNotification({
          title: 'Low Stock Alert',
          message: `${p.name} is running low! Current stock: ${p.newStock} ${p.unit} (Threshold: ${p.minStockAlert})`,
          type: 'WARNING'
        });
      }
    });

    // Update Customer-facing display state
    socketManager.broadcastNotification({
      title: 'Sale Completed',
      message: `Invoice ${result.invoiceNumber} processed successfully. Grand Total: ₹${result.totalAmount.toFixed(2)}`,
      type: 'SUCCESS'
    });

    await logAuditEvent({
      userId: cashierId || undefined,
      action: 'SALE_CHECKOUT',
      entity: 'sales',
      entityId: result.saleId,
      newValues: { invoice: result.invoiceNumber, total: result.totalAmount, paymentMethod }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction completed successfully.',
      data: {
        ...result,
        receipt: printedReceipt.formattedText
      }
    });
  } catch (err: any) {
    console.error('❌ [POS Checkout Error]:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Transaction failed. Please try again.' });
  }
};

export const syncOfflineSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offlineTransactions } = req.body;
    if (!offlineTransactions || !Array.isArray(offlineTransactions)) {
      res.status(400).json({ success: false, message: 'Invalid offline transactions array.' });
      return;
    }

    const syncedResults: any[] = [];
    const conflicts: any[] = [];

    for (const txn of offlineTransactions) {
      try {
        // Use txn.idempotencyKey or generate one
        const key = txn.idempotencyKey || `OFFLINE-${txn.id}`;
        const existing = await db.query<any>(`SELECT invoice_number FROM sales WHERE idempotency_key = ?`, [key]);
        if (existing.length > 0) {
          syncedResults.push({ id: txn.id, status: 'ALREADY_SYNCED', invoice: existing[0].invoice_number });
          continue;
        }

        // Process offline sale
        const saleId = uuidv4();
        const invoiceNumber = txn.invoiceNumber || `OFF-${Date.now().toString().slice(-8)}`;

        await db.transaction(async (trx) => {
          await trx.execute(`
            INSERT INTO sales (
              id, invoice_number, customer_id, cashier_id, subtotal, discount_amount,
              tax_amount, total_amount, payment_method, payment_status, sync_status, idempotency_key, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'OFFLINE_SYNCED', ?, ?)
          `, [
            saleId, invoiceNumber, txn.customerId || null, txn.cashierId || null,
            txn.subtotal || 0, txn.discountAmount || 0, txn.taxAmount || 0, txn.totalAmount || 0,
            txn.paymentMethod || 'CASH', key, txn.timestamp || new Date().toISOString()
          ]);

          for (const item of (txn.items || [])) {
            await trx.execute(`
              INSERT INTO sale_items (
                id, sale_id, product_id, product_name, sku, unit, quantity, unit_price, cost_price, discount_amount, tax_rate, tax_amount, total_amount
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 5, 0, ?)
            `, [
              uuidv4(), saleId, item.productId, item.name, item.sku || 'N/A', item.unit || 'piece',
              item.quantity, item.unitPrice, item.costPrice || item.unitPrice * 0.8, item.total
            ]);

            // Deduct inventory
            await trx.execute(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`, [item.quantity, item.productId]);
          }
        });

        syncedResults.push({ id: txn.id, status: 'SYNCED', invoice: invoiceNumber });
      } catch (err: any) {
        conflicts.push({ id: txn.id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Offline synchronization completed: ${syncedResults.length} synced, ${conflicts.length} conflicts.`,
      syncedResults,
      conflicts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Offline sync failed: ' + err.message });
  }
};
