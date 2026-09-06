import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { UserRole } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    let sql = `
      SELECT id, name, email, role, phone, status, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role && role !== 'ALL') {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY created_at DESC`;

    const users = await db.query<any>(sql, params);

    // Summary counts by role
    const counts = await db.query<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'CASHIER' THEN 1 ELSE 0 END) as cashiers,
        SUM(CASE WHEN role = 'MANAGER' THEN 1 ELSE 0 END) as managers,
        SUM(CASE WHEN role = 'INVENTORY_STAFF' THEN 1 ELSE 0 END) as inventory,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END) as customers
      FROM users
    `);

    res.json({
      success: true,
      data: users,
      summary: counts[0] || {
        total: users.length,
        cashiers: 0,
        managers: 0,
        inventory: 0,
        admins: 0,
        customers: 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch users: ' + err.message });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'CASHIER', phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Full name, email, and initial password are required.' });
      return;
    }

    const validRoles: UserRole[] = ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF', 'CUSTOMER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const existing = await db.query<any>(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    await db.execute(`
      INSERT INTO users (id, name, email, password_hash, role, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
    `, [id, name.trim(), email.toLowerCase().trim(), passwordHash, role, phone?.trim() || null]);

    // If role is CUSTOMER, also create linked customer record
    if (role === 'CUSTOMER') {
      const custId = uuidv4();
      const custCode = `CUST-${Date.now().toString().slice(-6)}`;
      await db.execute(`
        INSERT INTO customers (id, user_id, customer_code, name, email, phone, loyalty_points, loyalty_tier, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 50, 'Bronze', datetime('now'))
      `, [custId, id, custCode, name.trim(), email.toLowerCase().trim(), phone?.trim() || '0000000000']);
    }

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_CREATE',
      entity: 'users',
      entityId: id,
      newValues: { name, email, role, phone }
    });

    res.status(201).json({
      success: true,
      message: `User '${name}' successfully registered with role '${role}'.`,
      user: { id, name, email: email.toLowerCase().trim(), role, phone, status: 'ACTIVE' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create user: ' + err.message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status } = req.body;

    const existing = await db.query<any>(`SELECT * FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const validRoles: UserRole[] = ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF', 'CUSTOMER'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ success: false, message: `Invalid role '${role}'.` });
      return;
    }

    await db.execute(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ?
    `, [name?.trim() || null, email?.toLowerCase().trim() || null, phone?.trim() || null, role || null, status || null, id]);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_UPDATE',
      entity: 'users',
      entityId: id as string,
      oldValues: existing[0],
      newValues: { name, email, phone, role, status }
    });

    res.json({
      success: true,
      message: 'User profile and role allocation updated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update user: ' + err.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const existing = await db.query<any>(`SELECT id, name, email FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.execute(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [passwordHash, id]);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_PASSWORD_RESET',
      entity: 'users',
      entityId: id as string,
      newValues: { targetUser: existing[0].email }
    });

    res.json({
      success: true,
      message: `Password for ${existing[0].name} has been successfully updated.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password: ' + err.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own active administrator account.' });
      return;
    }

    const existing = await db.query<any>(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Soft delete by setting INACTIVE
    await db.execute(`UPDATE users SET status = 'INACTIVE', updated_at = datetime('now') WHERE id = ?`, [id]);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'USER_DEACTIVATE',
      entity: 'users',
      entityId: id as string,
      oldValues: existing[0]
    });

    res.json({
      success: true,
      message: `User '${existing[0].name}' (${existing[0].role}) deactivated successfully.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete user: ' + err.message });
  }
};
