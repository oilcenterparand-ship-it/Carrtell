import { supabase } from '../lib/supabase';
import { clearCart } from '../lib/cart';

export type UserRole = 'admin' | 'technician' | 'driver' | 'customer';
export type CarrtellAuthUser = { id: string; phone: string | null; email: string | null; role: UserRole; fullName: string | null };
const AUTH_EVENT = 'carrtell-auth-updated';
const ROLES: UserRole[] = ['admin', 'technician', 'driver', 'customer'];

export function normalizeIranPhone(input: string) {
  const digits = String(input || '').replace(/\D/g, '');
  if (/^09\d{9}$/.test(digits)) return `+98${digits.slice(1)}`;
  if (/^9\d{9}$/.test(digits)) return `+98${digits}`;
  if (/^989\d{9}$/.test(digits)) return `+${digits}`;
  throw new Error('شماره موبایل معتبر وارد کنید؛ مانند 09123456789.');
}
function normalizeRole(value: unknown): UserRole {
  if (value === 'driver') return 'technician';
  return typeof value === 'string' && ROLES.includes(value as UserRole) ? value as UserRole : 'customer';
}
export function emitAuthChanged() { window.dispatchEvent(new CustomEvent(AUTH_EVENT)); }
export function onAuthChanged(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(AUTH_EVENT, callback); window.removeEventListener('storage', callback); };
}
export async function sendMobileOtp(phone: string) {
  const normalized = normalizeIranPhone(phone);
  const { error } = await supabase.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: true } });
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
async function loadProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('role,full_name,phone').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getCurrentCarrtellUser(): Promise<CarrtellAuthUser | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const profile = await loadProfile(user.id);
  return { id: user.id, phone: profile?.phone || user.phone || null, email: user.email || null, role: normalizeRole(profile?.role), fullName: profile?.full_name || null };
}
export async function refreshStoredRoleFromSupabase() { return (await getCurrentCarrtellUser())?.role || null; }
export async function signOutCarrtell() {
  await supabase.auth.signOut({ scope: 'local' });
  clearCart(); sessionStorage.removeItem('carrtell_checkout_resume'); emitAuthChanged();
}

export function enableLocalDevAdmin() { console.warn('Dev admin bypass is disabled in RC1-01B.'); }
export function disableLocalDevAdmin() { /* disabled for security */ }
export function setLocalRole(_role: UserRole) { console.warn('Local role changes are disabled.'); }
