import { supabase } from '../lib/supabase';
import { emitAuthChanged } from './authApi';
import { withAuthTimeout } from './authRequest';

export type StaffLoginRole = 'admin' | 'technician';

type StaffLoginResponse = {
  ok?: boolean;
  role?: StaffLoginRole;
  email?: string;
  token_hash?: string;
  error?: string;
};

export async function signInStaffWithTemporaryPassword(role: StaffLoginRole, username: string, password: string) {
  const { data, error } = await withAuthTimeout(supabase.functions.invoke<StaffLoginResponse>('staff-password-login', {
    body: { action: 'login', role, username: username.trim().toLowerCase(), password },
  }), 18_000);
  if (error) throw new Error(data?.error || error.message || 'ورود انجام نشد.');
  if (!data?.ok) throw new Error(data?.error || 'نام کاربری یا رمز عبور صحیح نیست.');

  // V4.6: the Edge Function validates Carrtell's temporary credential and then
  // synchronizes the matching Supabase Auth user's password. A regular
  // signInWithPassword creates a deterministic, refreshable browser session and
  // avoids the fragile magic-link token exchange used by the previous version.
  if (data.token_hash) {
    const { error: verifyError } = await withAuthTimeout(supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' }));
    if (verifyError) throw new Error('نشست ورود ساخته نشد. لطفاً دوباره تلاش کنید.');
  } else if (data.email) {
    const { error: signInError } = await withAuthTimeout(supabase.auth.signInWithPassword({ email: data.email, password }));
    if (signInError) throw new Error('نشست ورود ساخته نشد. لطفاً دوباره تلاش کنید.');
  } else {
    throw new Error('پاسخ ورود ناقص است.');
  }

  if (role === 'admin') {
    const { data: access, error: accessError } = await withAuthTimeout(supabase.rpc('get_my_admin_access'));
    if (accessError || !Array.isArray(access) || !access[0] || !access[0].is_active) {
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('دسترسی مدیریت برای این حساب ساخته نشده است.');
    }
  }

  emitAuthChanged();
  return data;
}

export async function updateStaffTemporaryCredentials(role: StaffLoginRole, username: string, password: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('نشست مدیریت معتبر نیست.');
  const { data, error } = await supabase.functions.invoke('staff-password-login', {
    body: { action: 'update', role, username: username.trim().toLowerCase(), password },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error((data as any)?.error || error.message || 'ذخیره اطلاعات ورود انجام نشد.');
  if (!data?.ok) throw new Error(data?.error || 'ذخیره اطلاعات ورود انجام نشد.');
  return data;
}
