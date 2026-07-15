import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'driver' | 'customer';

export type CarrtellAuthUser = {
  id?: string;
  phone?: string | null;
  email?: string | null;
  role: UserRole;
  fullName?: string | null;
};

const LOCAL_PROFILE_KEY = 'carrtell_customer_profile';
const LOCAL_ROLE_KEY = 'carrtell_user_role';
const LOCAL_DEV_ADMIN_KEY = 'carrtell_dev_admin';
const AUTH_EVENT = 'carrtell-auth-updated';

const USER_ROLES: UserRole[] = ['admin', 'driver', 'customer'];

function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function normalizeIranPhone(phone: string) {
  const digits = phone.trim().replace(/[\s-]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0098')) return `+98${digits.slice(4)}`;
  if (digits.startsWith('98')) return `+${digits}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  return digits;
}

export function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function onAuthChanged(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function readStoredRole(): UserRole | null {
  const localRole = localStorage.getItem(LOCAL_ROLE_KEY);
  return isValidRole(localRole) ? localRole : null;
}

export function readLocalCustomer(): CarrtellAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as { phone?: string; fullName?: string };
    if (!profile.phone) return null;

    const storedRole = readStoredRole();
    const devAdminEnabled = import.meta.env.DEV && localStorage.getItem(LOCAL_DEV_ADMIN_KEY) === 'true';

    return {
      phone: profile.phone,
      fullName: profile.fullName || null,
      role: storedRole || (devAdminEnabled ? 'admin' : 'customer'),
    };
  } catch {
    return null;
  }
}

export function setLocalRole(role: UserRole) {
  localStorage.setItem(LOCAL_ROLE_KEY, role);
  emitAuthChanged();
}

export function enableLocalDevAdmin() {
  localStorage.setItem(LOCAL_DEV_ADMIN_KEY, 'true');
  localStorage.setItem(LOCAL_ROLE_KEY, 'admin');
  emitAuthChanged();
}

export function disableLocalDevAdmin() {
  localStorage.removeItem(LOCAL_DEV_ADMIN_KEY);
  localStorage.removeItem(LOCAL_ROLE_KEY);
  emitAuthChanged();
}

export async function sendMobileOtp(phone: string) {
  const normalized = normalizeIranPhone(phone);
  const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
  if (error) throw error;
  return normalized;
}

export async function verifyMobileOtp(phone: string, token: string) {
  const normalized = normalizeIranPhone(phone);
  const { data, error } = await supabase.auth.verifyOtp({ phone: normalized, token, type: 'sms' });
  if (error) throw error;
  emitAuthChanged();
  return data;
}

async function profilesTableHasAnyUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

async function ensureProfileAndReadRole(user: { id: string; phone?: string | null; email?: string | null; user_metadata?: Record<string, unknown> }): Promise<UserRole> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && isValidRole(profile?.role)) {
    localStorage.setItem(LOCAL_ROLE_KEY, profile.role);
    return profile.role;
  }

  // اگر پروفایل وجود نداشت، برای کاربر فعلی می‌سازیم.
  // در اولین نصب پروژه، اولین پروفایل مدیر می‌شود تا قفل ادمین پیش نیاید.
  if (!error || error.code === 'PGRST116') {
    const hasAnyProfile = await profilesTableHasAnyUser().catch(() => true);
    const role: UserRole = hasAnyProfile ? 'customer' : 'admin';

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        phone: user.phone || null,
        full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
        role,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('role')
      .single();

    if (!insertError && isValidRole(created?.role)) {
      localStorage.setItem(LOCAL_ROLE_KEY, created.role);
      return created.role;
    }
  }

  // اگر جدول profiles هنوز migration نشده باشد، حداقل نقش محلی را نگه می‌داریم.
  const storedRole = readStoredRole();
  return storedRole || 'customer';
}

export async function refreshStoredRoleFromSupabase(): Promise<UserRole | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return readStoredRole();
  return ensureProfileAndReadRole(data.user);
}

export async function getCurrentCarrtellUser(): Promise<CarrtellAuthUser | null> {
  const { data } = await supabase.auth.getUser();
  const supabaseUser = data.user;

  if (supabaseUser) {
    const role = await ensureProfileAndReadRole(supabaseUser);
    return {
      id: supabaseUser.id,
      phone: supabaseUser.phone,
      email: supabaseUser.email,
      role,
      fullName: (supabaseUser.user_metadata?.full_name as string | undefined) || null,
    };
  }

  return readLocalCustomer();
}

export async function signOutCarrtell() {
  await supabase.auth.signOut();
  localStorage.removeItem(LOCAL_PROFILE_KEY);
  localStorage.removeItem(LOCAL_ROLE_KEY);
  localStorage.removeItem(LOCAL_DEV_ADMIN_KEY);
  emitAuthChanged();
}
