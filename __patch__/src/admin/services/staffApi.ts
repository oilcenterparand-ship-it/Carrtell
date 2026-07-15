import { supabase } from '../../lib/supabase';

export type StaffStatus = 'active' | 'inactive';
export type PermissionKey =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'finance'
  | 'customers'
  | 'support'
  | 'content'
  | 'dispatch'
  | 'settings';

export type StaffRole = {
  id: string;
  title: string;
  description?: string | null;
  permissions: PermissionKey[];
  created_at?: string;
};

export type StaffMember = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  branch_id?: string | null;
  role_id?: string | null;
  role_title?: string | null;
  status: StaffStatus;
  notes?: string | null;
  created_at?: string;
};

export async function getStaffRoles(): Promise<StaffRole[]> {
  const { data, error } = await supabase
    .from('staff_roles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StaffRole[];
}

export async function upsertStaffRole(payload: Partial<StaffRole>) {
  const { data, error } = await supabase
    .from('staff_roles')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as StaffRole;
}

export async function deleteStaffRole(id: string) {
  const { error } = await supabase.from('staff_roles').delete().eq('id', id);
  if (error) throw error;
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff_members_view')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error) return (data ?? []) as StaffMember[];

  const fallback = await supabase
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: false });
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as StaffMember[];
}

export async function upsertStaffMember(payload: Partial<StaffMember>) {
  const { data, error } = await supabase
    .from('staff_members')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as StaffMember;
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase.from('staff_members').delete().eq('id', id);
  if (error) throw error;
}

export async function logStaffActivity(action: string, entity?: string, entityId?: string, meta?: Record<string, unknown>) {
  const { error } = await supabase.from('staff_activity_logs').insert({
    action,
    entity,
    entity_id: entityId,
    meta: meta ?? {},
  });
  if (error) console.warn('staff activity log failed', error.message);
}
