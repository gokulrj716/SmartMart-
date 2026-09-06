import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { logAuditEvent } from '../middleware/auditLogger';

export const getCurrentSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const cashierId = req.user?.id;
    const sessions = await db.query<any>(`
      SELECT cs.*, u.name as cashier_name
      FROM cashier_sessions cs
      JOIN users u ON cs.cashier_id = u.id
      WHERE cs.cashier_id = ? AND cs.status = 'OPEN'
      ORDER BY cs.opened_at DESC
      LIMIT 1
    `, [cashierId]);

    if (sessions.length === 0) {
      res.json({ success: true, session: null });
      return;
    }

    const session = sessions[0];

    // Compute live shift metrics: cash sales, refunds, expenses
    const cashSalesRow = await db.query<any>(`
      SELECT COALESCE(SUM(total_amount), 0) as cash_total, COUNT(id) as sale_count
      FROM sales
      WHERE session_id = ? AND payment_method = 'CASH'
    `, [session.id]);

    const otherSalesRow = await db.query<any>(`
      SELECT COALESCE(SUM(total_amount), 0) as digital_total, COUNT(id) as sale_count
      FROM sales
      WHERE session_id = ? AND payment_method != 'CASH'
    `, [session.id]);

    const expensesRow = await db.query<any>(`
      SELECT COALESCE(SUM(amount), 0) as expense_total
      FROM expenses
      WHERE session_id = ?
    `, [session.id]);

    const cashSales = Number(cashSalesRow[0]?.cash_total || 0);
    const digitalSales = Number(otherSalesRow[0]?.digital_total || 0);
    const expenses = Number(expensesRow[0]?.expense_total || 0);
    const openingCash = Number(session.opening_cash);
    const expectedCashInDrawer = openingCash + cashSales - expenses;

    res.json({
      success: true,
      session: {
        ...session,
        cashSales,
        digitalSales,
        totalSales: cashSales + digitalSales,
        expenses,
        expectedCashInDrawer
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch active session' });
  }
};

export const openSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const cashierId = req.user?.id;
    const { openingCash = 1000, deviceId = 'POS-01', notes } = req.body;

    const existingOpen = await db.query<any>(`
      SELECT id FROM cashier_sessions WHERE cashier_id = ? AND status = 'OPEN'
    `, [cashierId]);

    if (existingOpen.length > 0) {
      res.status(400).json({ success: false, message: 'You already have an active open cashier session.' });
      return;
    }

    const id = uuidv4();
    await db.execute(`
      INSERT INTO cashier_sessions (
        id, cashier_id, device_id, opening_cash, expected_cash, actual_cash, difference, status, notes, opened_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 'OPEN', ?, datetime('now'))
    `, [id, cashierId, deviceId, Number(openingCash), Number(openingCash), notes || null]);

    await logAuditEvent({
      userId: cashierId,
      action: 'CASHIER_SESSION_OPEN',
      entity: 'cashier_sessions',
      entityId: id,
      newValues: { deviceId, openingCash }
    });

    res.status(201).json({
      success: true,
      message: 'Cashier shift register opened successfully.',
      session: { id, openingCash, status: 'OPEN', deviceId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to open cashier session: ' + err.message });
  }
};

export const closeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, actualCashCounted, notes } = req.body;
    const cashierId = req.user?.id;

    const sessionRows = await db.query<any>(`SELECT * FROM cashier_sessions WHERE id = ? AND status = 'OPEN'`, [sessionId]);
    if (sessionRows.length === 0) {
      res.status(404).json({ success: false, message: 'Open session not found.' });
      return;
    }

    const session = sessionRows[0];
    const cashSalesRow = await db.query<any>(`
      SELECT COALESCE(SUM(total_amount), 0) as cash_total
      FROM sales
      WHERE session_id = ? AND payment_method = 'CASH'
    `, [sessionId]);

    const expensesRow = await db.query<any>(`
      SELECT COALESCE(SUM(amount), 0) as expense_total
      FROM expenses
      WHERE session_id = ?
    `, [sessionId]);

    const openingCash = Number(session.opening_cash);
    const cashSales = Number(cashSalesRow[0]?.cash_total || 0);
    const expenses = Number(expensesRow[0]?.expense_total || 0);
    const expectedCash = openingCash + cashSales - expenses;
    const actualCash = Number(actualCashCounted);
    const difference = Number((actualCash - expectedCash).toFixed(2));

    await db.execute(`
      UPDATE cashier_sessions SET
        closing_cash = ?,
        expected_cash = ?,
        actual_cash = ?,
        difference = ?,
        status = 'CLOSED',
        notes = ?,
        closed_at = datetime('now')
      WHERE id = ?
    `, [actualCash, expectedCash, actualCash, difference, notes || null, sessionId]);

    await logAuditEvent({
      userId: cashierId,
      action: 'CASHIER_SESSION_CLOSE',
      entity: 'cashier_sessions',
      entityId: sessionId,
      newValues: { expectedCash, actualCash, difference }
    });

    res.json({
      success: true,
      message: 'Cashier session closed and audited successfully.',
      report: {
        sessionId,
        openingCash,
        cashSales,
        expenses,
        expectedCash,
        actualCash,
        difference,
        varianceStatus: difference === 0 ? 'BALANCED' : (difference > 0 ? 'OVERAGE' : 'SHORTAGE')
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to close session: ' + err.message });
  }
};
