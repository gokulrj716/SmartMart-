import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, tier } = req.query;
    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(name LIKE ? OR phone LIKE ? OR customer_code LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (tier) {
      whereClauses.push('loyalty_tier = ?');
      params.push(tier);
    }

    const whereSql = whereClauses.join(' AND ');
    const customers = await db.query<any>(`
      SELECT 
        c.*,
        COUNT(s.id) as order_count
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE ${whereSql}
      GROUP BY c.id
      ORDER BY c.total_spent DESC
    `, params);

    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers: ' + err.message });
  }
};

export const getCustomerByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params;
    const rows = await db.query<any>(`
      SELECT c.*, COUNT(s.id) as order_count
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE c.phone = ?
      GROUP BY c.id
      LIMIT 1
    `, [phone]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Customer lookup failed' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone are required.' });
      return;
    }

    const existing = await db.query<any>(`SELECT id FROM customers WHERE phone = ?`, [phone]);
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'Customer with this phone already exists.' });
      return;
    }

    const id = uuidv4();
    const customerCode = `SM-${Date.now().toString().slice(-6)}`;

    await db.execute(`
      INSERT INTO customers (id, customer_code, name, email, phone, loyalty_points, loyalty_tier, total_spent, created_at)
      VALUES (?, ?, ?, ?, ?, 50, 'Bronze', 0.0, datetime('now'))
    `, [id, customerCode, name, email || null, phone]);

    res.status(201).json({
      success: true,
      message: 'Customer enrolled successfully with 50 Welcome Bonus Points!',
      data: { id, customerCode, name, phone, loyalty_points: 50, loyalty_tier: 'Bronze' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create customer: ' + err.message });
  }
};

export const getCustomerLoyalty = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.params.id;
    const custRows = await db.query<any>(`SELECT * FROM customers WHERE id = ?`, [customerId]);
    if (custRows.length === 0) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const customer = custRows[0];
    const coupons = await db.query<any>(`
      SELECT * FROM coupons 
      WHERE is_active = 1 
      ORDER BY discount_value DESC
    `);

    // Available redemption rewards
    const rewards = [
      { id: 'rew-1', title: '₹100 Off Supermarket Grocery Voucher', pointsRequired: 200, discountAmount: 100 },
      { id: 'rew-2', title: '₹250 Off Fresh Produce Bundle', pointsRequired: 450, discountAmount: 250 },
      { id: 'rew-3', title: '₹500 Mega Supermarket Savings Voucher', pointsRequired: 800, discountAmount: 500 },
      { id: 'rew-4', title: 'Free Premium Delivery for 1 Month', pointsRequired: 150, discountAmount: 149 }
    ];

    res.json({
      success: true,
      data: {
        pointsBalance: customer.loyalty_points,
        totalSpent: customer.total_spent,
        tier: customer.loyalty_tier,
        availableCoupons: coupons,
        redeemableRewards: rewards
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty details' });
  }
};
