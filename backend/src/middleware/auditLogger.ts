import { db } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export const logAuditEvent = async (options: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  deviceInfo?: string;
}): Promise<void> => {
  try {
    const id = uuidv4();
    const oldVal = options.oldValues ? JSON.stringify(options.oldValues) : null;
    const newVal = options.newValues ? JSON.stringify(options.newValues) : null;

    await db.execute(`
      INSERT INTO audit_logs (id, user_id, action, entity, entity_id, old_values, new_values, ip_address, device_info, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      id,
      options.userId || null,
      options.action,
      options.entity,
      options.entityId || null,
      oldVal,
      newVal,
      options.ipAddress || '127.0.0.1',
      options.deviceInfo || 'POS-Terminal-01'
    ]);
  } catch (err: any) {
    console.error('⚠️ [AuditLog] Failed to record audit log:', err.message);
  }
};
