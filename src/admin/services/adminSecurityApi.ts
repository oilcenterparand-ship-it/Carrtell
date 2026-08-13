import { supabase } from '../../lib/supabase';
import type { AdminPermission } from '../auth/adminPermissions';

export type AdminRoleRow = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  permissions: AdminPermission[];
  is_system: boolean;
  created_at: string;
};

export type AdminAccountRow = {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  role_id: string | null;
  role_title: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  last_login_at: string | null;
  created_at: string;
};

function unwrapRpcArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  return data as T[];
}

export async function listAdminRoles() {
  const { data, error } = await supabase.rpc('admin_list_roles');
  if (error) throw new Error(error.message || 'خطا در دریافت نقش‌ها');
  return unwrapRpcArray<AdminRoleRow>(data);
}

export async function saveAdminRole(payload: Partial<AdminRoleRow>) {
  const { data, error } = await supabase.rpc('admin_save_role', {
    p_id: payload.id || null,
    p_name: payload.name || '',
    p_title: payload.title || '',
    p_description: payload.description || null,
    p_permissions: payload.permissions || [],
  });
  if (error) throw new Error(error.message || 'ذخیره نقش ناموفق بود');
  const row = Array.isArray(data) ? data[0] : data;
  return row as AdminRoleRow;
}

export async function removeAdminRole(id: string) {
  const { error } = await supabase.rpc('admin_delete_role', { p_id: id });
  if (error) throw new Error(error.message || 'حذف نقش ناموفق بود');
}

export async function listAdminAccounts() {
  const { data, error } = await supabase.rpc('admin_list_accounts');
  if (error) throw new Error(error.message || 'خطا در دریافت کاربران پنل');
  return unwrapRpcArray<AdminAccountRow>(data);
}

type ManagePayload =
  | { action: 'create'; username: string; password: string; fullName: string; roleId: string | null; isActive: boolean }
  | { action: 'update'; userId: string; fullName?: string; roleId?: string | null; isActive?: boolean }
  | { action: 'reset_password'; userId: string; password: string }
  | { action: 'delete'; userId: string };

export async function manageAdminAccount(payload: ManagePayload) {
  const body = {
    p_action: payload.action,
    p_user_id: 'userId' in payload ? payload.userId : null,
    p_username: 'username' in payload ? payload.username : null,
    p_password: 'password' in payload ? payload.password : null,
    p_full_name: 'fullName' in payload ? payload.fullName : null,
    p_role_id: 'roleId' in payload ? payload.roleId : null,
    p_is_active: 'isActive' in payload ? payload.isActive : null,
  };
  const { data, error } = await supabase.rpc('admin_manage_account', body);
  if (error) throw new Error(error.message || 'عملیات کاربر مدیریتی ناموفق بود');
  return data;
}
