import { supabase } from '../lib/supabase';
import { clearCart } from '../lib/cart';

export type UserRole = 'admin' | 'technician' | 'driver' | 'customer';
export type CarrtellAuthUser = { id: string; phone: string | null; email: string | null; role: UserRole; fullName: string | null; username?: string | null };
const AUTH_EVENT = 'carrtell-auth-updated';
const ROLES: UserRole[] = ['admin', 'technician', 'driver', 'customer'];
const otpInFlightByPhone = new Map<string, Promise<string>>();
const otpLastAcceptedAt = new Map<string, number>();
const OTP_DUPLICATE_GUARD_MS = 2500;

export function normalizeDigits(input: string) {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function normalizeIranPhone(input: string) {
  const digits = normalizeDigits(input).replace(/\D/g, '');
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
  const existing = otpInFlightByPhone.get(normalized);
  if (existing) return existing;

  const lastAcceptedAt = otpLastAcceptedAt.get(normalized) || 0;
  if (Date.now() - lastAcceptedAt < OTP_DUPLICATE_GUARD_MS) {
    throw new Error('درخواست قبلی کد تأیید همین الان ارسال شده است؛ چند لحظه صبر کنید.');
  }

  const request = (async () => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
    otpLastAcceptedAt.set(normalized, Date.now());
    return normalized;
  })();

  otpInFlightByPhone.set(normalized, request);
  try {
    return await request;
  } finally {
    otpInFlightByPhone.delete(normalized);
  }
}
export async function verifyMobileOtp(phone: string, token: string) {
  const normalized = normalizeIranPhone(phone);
  const { data, error } = await supabase.auth.verifyOtp({ phone: normalized, token, type: 'sms' });
  if (error) throw error;
  emitAuthChanged();
  return data;
}
async function loadProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('role,full_name,phone,username').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getCurrentCarrtellUser(): Promise<CarrtellAuthUser | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const profile = await loadProfile(user.id);
  return { id: user.id, phone: profile?.phone || user.phone || null, email: user.email || null, role: normalizeRole(profile?.role), fullName: profile?.full_name || null, username: profile?.username || null };
}

export async function saveCustomerDisplayName(fullName: string) {
  const clean = String(fullName || '').replace(/\s+/g, ' ').trim();
  if (clean.length < 2) throw new Error('نام و نام خانوادگی را وارد کنید.');
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) throw new Error('برای ذخیره نام ابتدا ورود را تکمیل کنید.');
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', authUser.id).maybeSingle();
  const payload = { full_name: clean, phone: authUser.phone || null };
  const result = existing?.id
    ? await supabase.from('profiles').update(payload).eq('id', authUser.id)
    : await supabase.from('profiles').upsert({ id: authUser.id, role: 'customer', ...payload }, { onConflict: 'id' });
  if (result.error) throw result.error;
  emitAuthChanged();
  return clean;
}


export async function setCustomerCredentials(username: string, password: string) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(cleanUsername)) throw new Error('نام کاربری باید ۳ تا ۳۲ کاراکتر و شامل حروف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.');
  if (String(password || '').length < 8) throw new Error('رمز عبور باید حداقل ۸ کاراکتر باشد.');
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('برای تعیین نام کاربری ابتدا ورود پیامکی را تکمیل کن.');
  const { data, error } = await supabase.functions.invoke('customer-credentials', {
    body: { action: 'setup', username: cleanUsername, password },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) throw new Error((data as any)?.error || error.message || 'ذخیره نام کاربری انجام نشد.');
  if (!data?.ok) throw new Error(data?.error || 'ذخیره نام کاربری انجام نشد.');
  emitAuthChanged();
  return data;
}

export async function signInWithUsername(username: string, password: string) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!cleanUsername || !password) throw new Error('نام کاربری و رمز عبور را وارد کن.');
  const { data, error } = await supabase.functions.invoke('customer-credentials', {
    body: { action: 'login', username: cleanUsername, password },
  });
  if (error) throw new Error((data as any)?.error || error.message || 'ورود با نام کاربری انجام نشد.');
  if (!data?.access_token || !data?.refresh_token) throw new Error(data?.error || 'نام کاربری یا رمز عبور صحیح نیست.');
  const { error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (sessionError) throw sessionError;
  emitAuthChanged();
  return data;
}


export async function deleteCurrentCustomerAccount() {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('برای حذف حساب ابتدا وارد حساب خود شوید.');
  const { data, error } = await supabase.functions.invoke('customer-account-delete', {
    body: { action: 'delete_account' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) throw new Error((data as any)?.error || error.message || 'حذف حساب انجام نشد.');
  if (!data?.ok) throw new Error(data?.error || 'حذف حساب انجام نشد.');
  clearCart();
  localStorage.removeItem('carrtell_customer_profile');
  sessionStorage.removeItem('carrtell_checkout_resume');
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  emitAuthChanged();
  return data;
}

export async function refreshStoredRoleFromSupabase() { return (await getCurrentCarrtellUser())?.role || null; }
export async function signOutCarrtell() {
  await supabase.auth.signOut({ scope: 'local' });
  clearCart(); sessionStorage.removeItem('carrtell_checkout_resume'); emitAuthChanged();
}

export function enableLocalDevAdmin() { console.warn('Dev admin bypass is disabled in RC1-01B.'); }
export function disableLocalDevAdmin() { /* disabled for security */ }
export function setLocalRole(_role: UserRole) { console.warn('Local role changes are disabled.'); }
