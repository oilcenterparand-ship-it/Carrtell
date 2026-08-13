import { supabase } from '../../lib/supabase';
import type { AdminPermission } from './adminPermissions';

export type AdminIdentity = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  roleId: string | null;
  roleTitle: string | null;
  permissions: AdminPermission[];
};

function usernameToEmail(username: string) {
  const clean = username.trim().toLowerCase().replace(/\s+/g, '');
  if (!/^[a-z0-9_.-]{3,40}$/.test(clean)) throw new Error('نام کاربری باید حداقل ۳ کاراکتر و فقط شامل حروف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.');
  return clean.includes('@') ? clean : `${clean}@admin.carrtell.local`;
}

export async function adminSignIn(username: string, password: string) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('نام کاربری یا رمز عبور اشتباه است.');
  const identity = await loadCurrentAdmin();
  if (!identity) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('این حساب اجازه ورود به پنل مدیریت را ندارد.');
  }
  if (!identity.isActive) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('حساب مدیریتی شما غیرفعال شده است.');
  }
  return { session: data.session, identity };
}

export async function loadCurrentAdmin(): Promise<AdminIdentity | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await supabase.rpc('get_my_admin_access');
  if (error || !data || !Array.isArray(data) || !data[0]) return null;
  const row = data[0] as any;
  return {
    id: user.id,
    username: row.username,
    fullName: row.full_name || row.username,
    email: row.email || user.email || null,
    isSuperAdmin: Boolean(row.is_super_admin),
    isActive: Boolean(row.is_active),
    roleId: row.role_id || null,
    roleTitle: row.role_title || null,
    permissions: (row.permissions || []) as AdminPermission[],
  };
}

export async function adminSignOut() {
  await supabase.rpc('admin_log_event', { p_action: 'logout', p_entity: 'admin_session', p_entity_id: null, p_meta: {} });
  await supabase.auth.signOut({ scope: 'local' });
}

export function hasAdminPermission(admin: AdminIdentity | null, permission: AdminPermission | null) {
  if (!admin) return false;
  if (admin.isSuperAdmin) return true;
  if (!permission) return true;
  return admin.permissions.includes(permission);
}
