import { Request, Response } from 'express';
import { db } from '../database/db';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.query<any>(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};
