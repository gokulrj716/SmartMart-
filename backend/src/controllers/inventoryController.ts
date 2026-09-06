import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { socketManager } from '../sockets/socketManager';
import { logAuditEvent } from '../middleware/auditLogger';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lowStockOnly, category, search } = req.query;

    let whereClauses: string[] = ['p.is_active = 1'];
    const params: any[] = [];

    if (lowStockOnly === 'true') {
      whereClauses.push('p.stock <= p.min_stock_alert');
    }

    if (category) {
      whereClauses.push('p.category_id = ?');
      params.push(category);
    }

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const products = await db.query<any>(`
      SELECT 
        p.id, p.sku, p.barcode, p.name, p.unit, p.price, p.cost_price, p.stock,
        p.min_stock_alert, p.is_weighted, c.name as category_name,
        (p.stock * p.cost_price) as inventory_value,
        CASE 
          WHEN p.stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.stock <= p.min_stock_alert THEN 'LOW_STOCK'
          ELSE 'NORMAL'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY (p.stock <= p.min_stock_alert) DESC, p.stock ASC
    `, params);

    // Calculate summary statistics
    const statsRow = await db.query<any>(`
      SELECT 
        COUNT(id) as total_products,
        SUM(stock * cost_price) as total_inventory_valuation,
        SUM(CASE WHEN stock <= min_stock_alert THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
      WHERE is_active = 1
    `);

    res.json({
      success: true,
      data: products,
      summary: {
        totalProducts: Number(statsRow[0]?.total_products || 0),
        totalValuation: Math.round(Number(statsRow[0]?.total_inventory_valuation || 0)),
        lowStockCount: Number(statsRow[0]?.low_stock_count || 0),
        outOfStockCount: Number(statsRow[0]?.out_of_stock_count || 0)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory: ' + err.message });
  }
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, type = 'ADJUSTMENT', quantityChange, reason, batchId } = req.body;
    const userId = req.user?.id || null;

    if (!productId || quantityChange === undefined || quantityChange === 0) {
      res.status(400).json({ success: false, message: 'Product ID and non-zero quantityChange required.' });
      return;
    }

    const prodRows = await db.query<any>(`SELECT * FROM products WHERE id = ?`, [productId]);
    if (prodRows.length === 0) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const product = prodRows[0];
    const newStock = Math.max(0, Number(product.stock) + Number(quantityChange));

    await db.transaction(async (trx) => {
      // Update product stock
      await trx.execute(`UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`, [newStock, productId]);

      // If batchId provided, adjust batch remaining quantity
      if (batchId) {
        await trx.execute(`
          UPDATE product_batches 
          SET remaining_qty = MAX(0, remaining_qty + ?) 
          WHERE id = ?
        `, [Number(quantityChange), batchId]);
      }

      // Record transaction
      await trx.execute(`
        INSERT INTO inventory_transactions (id, product_id, batch_id, type, quantity, reason, reference_id, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'MANUAL_ADJUSTMENT', ?, datetime('now'))
      `, [uuidv4(), productId, batchId || null, type, Number(quantityChange), reason || 'Inventory manual adjustment', userId]);
    });

    socketManager.broadcastInventoryUpdate(productId, newStock, Number(quantityChange));

    await logAuditEvent({
      userId: userId || undefined,
      action: 'STOCK_ADJUSTMENT',
      entity: 'inventory',
      entityId: productId,
      oldValues: { stock: product.stock },
      newValues: { stock: newStock, change: quantityChange, reason }
    });

    res.json({
      success: true,
      message: `Stock adjusted successfully for ${product.name}. New stock: ${newStock} ${product.unit}`,
      newStock
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to adjust stock: ' + err.message });
  }
};
