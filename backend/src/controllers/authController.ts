import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { generateToken, AuthUser } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const users = await db.query<any>(`SELECT * FROM users WHERE email = ? AND status = 'ACTIVE'`, [email]);
    if (users.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found or inactive.' });
      return;
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(authUser);

    await logAuditEvent({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'users',
      entityId: user.id,
      deviceInfo: req.headers['user-agent']?.substring(0, 100)
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: authUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Authentication failed. Please try again.' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role = 'CUSTOMER' } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existing = await db.query<any>(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    await db.execute(`
      INSERT INTO users (id, name, email, password_hash, role, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
    `, [id, name, email, passwordHash, role, phone || null]);

    // If customer, also create customer record
    if (role === 'CUSTOMER') {
      const custId = uuidv4();
      const custCode = `CUST-${Date.now().toString().slice(-6)}`;
      await db.execute(`
        INSERT INTO customers (id, user_id, customer_code, name, email, phone, loyalty_points, loyalty_tier, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 50, 'Bronze', datetime('now'))
      `, [custId, id, custCode, name, email, phone || '0000000000']);
    }

    const authUser: AuthUser = { id, name, email, role };
    const token = generateToken(authUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: authUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const users = await db.query<any>(`SELECT id, name, email, role, phone, status FROM users WHERE id = ?`, [req.user.id]);
    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, user: users[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

// Demo quick-login/switcher helper for easily demonstrating all 5 roles
export const demoSwitchRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF', 'CUSTOMER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role requested.' });
      return;
    }

    const users = await db.query<any>(`SELECT * FROM users WHERE role = ? LIMIT 1`, [role]);
    if (users.length === 0) {
      res.status(404).json({ success: false, message: `No demo user found for role ${role}` });
      return;
    }

    const user = users[0];
    const authUser: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = generateToken(authUser);

    res.json({
      success: true,
      message: `Switched active session to ${role}`,
      token,
      user: authUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Role switch failed' });
  }
};
