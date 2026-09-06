import { Request, Response } from 'express';
import { db } from '../database/db';

export const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, paymentMethod, search, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (startDate) {
      whereClauses.push('s.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('s.created_at <= ?');
      params.push(endDate);
    }

    if (paymentMethod) {
      whereClauses.push('s.payment_method = ?');
      params.push(paymentMethod);
    }

    if (search) {
      whereClauses.push('(s.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRow = await db.query<any>(`
      SELECT COUNT(*) as total 
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${whereSql}
    `, params);
    const total = countRow[0]?.total || 0;

    const sales = await db.query<any>(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE ${whereSql}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    res.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales: ' + err.message });
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sales = await db.query<any>(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ? OR s.invoice_number = ?
    `, [id, id]);

    if (sales.length === 0) {
      res.status(404).json({ success: false, message: 'Sale invoice not found' });
      return;
    }

    const sale = sales[0];
    const items = await db.query<any>(`
      SELECT si.*, p.barcode
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [sale.id]);

    const payments = await db.query<any>(`SELECT * FROM payments WHERE sale_id = ?`, [sale.id]);

    res.json({
      success: true,
      data: {
        ...sale,
        items,
        payments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch sale details' });
  }
};
