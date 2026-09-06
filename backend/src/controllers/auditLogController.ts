import { Request, Response } from 'express';
import { db } from '../database/db';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entity, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (action) {
      whereClauses.push('al.action = ?');
      params.push(action);
    }

    if (entity) {
      whereClauses.push('al.entity = ?');
      params.push(entity);
    }

    const whereSql = whereClauses.join(' AND ');

    const logs = await db.query<any>(`
      SELECT 
        al.*,
        u.name as user_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereSql}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await db.query<any>(`
      SELECT * FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};
