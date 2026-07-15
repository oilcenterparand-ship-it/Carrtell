import { createAuditLog } from '../admin/services/auditApi';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'logout'
  | 'export'
  | 'manual';

export async function logActivity(params: {
  action: AuditAction | string;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await createAuditLog(params);
  } catch (error) {
    console.warn('logActivity failed', error);
  }
}
