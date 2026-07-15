import { supabase } from '../../lib/supabase';

export type AuditLog = {
  id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type AuditFilters = {
  action?: string;
  entityType?: string;
  actorRole?: string;
  from?: string;
  to?: string;
  search?: string;
};

export async function getAuditLogs(filters: AuditFilters = {}) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (filters.action) query = query.eq('action', filters.action);
  if (filters.entityType) query = query.eq('entity_type', filters.entityType);
  if (filters.actorRole) query = query.eq('actor_role', filters.actorRole);
  if (filters.from) query = query.gte('created_at', filters.from);
  if (filters.to) query = query.lte('created_at', filters.to);
  if (filters.search) {
    query = query.or(`actor_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function createAuditLog(input: Omit<Partial<AuditLog>, 'id' | 'created_at'> & { action: string }) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let actorName = input.actor_name ?? user?.email ?? null;
  let actorRole = input.actor_role ?? null;

  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, role')
      .eq('id', user.id)
      .maybeSingle();

    actorName = input.actor_name ?? profile?.full_name ?? profile?.phone ?? user.email ?? null;
    actorRole = input.actor_role ?? profile?.role ?? null;
  }

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: input.actor_id ?? user?.id ?? null,
    actor_name: actorName,
    actor_role: actorRole,
    action: input.action,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) console.warn('audit log failed', error);
}

export function exportAuditLogsCsv(logs: AuditLog[]) {
  const headers = ['زمان', 'کاربر', 'نقش', 'عملیات', 'بخش', 'شناسه', 'توضیحات'];
  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString('fa-IR'),
    log.actor_name ?? '',
    log.actor_role ?? '',
    log.action ?? '',
    log.entity_type ?? '',
    log.entity_id ?? '',
    log.description ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `carrtell-audit-logs-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
