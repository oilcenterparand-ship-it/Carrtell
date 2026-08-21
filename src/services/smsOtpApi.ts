import { sendMobileOtp, verifyMobileOtp, normalizeIranPhone } from '../auth/authApi';
export { normalizeIranPhone };
export async function requestOtp(phone: string) {
  const normalized = await sendMobileOtp(phone);
  return { ok: true, phone: normalized, expires_in: 120 };
}

export function friendlyOtpRequestError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || '');
  const clean = raw.trim();
  if (!clean || clean === '{}' || clean === '[object Object]') return 'ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.';
  return clean;
}

export async function requestOtpWithRetry(phone: string, attempts = 2) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < Math.max(1, attempts); attempt += 1) {
    try {
      return await requestOtp(phone);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => window.setTimeout(resolve, 1100));
    }
  }
  throw new Error(friendlyOtpRequestError(lastError));
}
export async function verifyOtp(phone: string, code: string) {
  const data = await verifyMobileOtp(phone, code);
  return { ok: Boolean(data.session), session: data.session, user: data.user };
}
import { supabase } from '../lib/supabase';
export type SmsTemplateKey = 'otp_login' | 'order_created' | 'payment_success' | 'order_status' | 'driver_assigned' | 'review_link';
export function renderTemplate(body: string, vars: Record<string, string | number | undefined>) { return body.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? '')); }
export async function getSmsSettings() { const { data, error } = await supabase.from('sms_settings').select('*').limit(1).maybeSingle(); if (error) throw error; return data; }
export async function getSmsTemplates() { const { data, error } = await supabase.from('sms_templates').select('*').order('template_key'); if (error) throw error; return data || []; }
export async function saveSmsSettings(payload: any) { const current = await getSmsSettings(); if (current?.id) { const { error } = await supabase.from('sms_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', current.id); if (error) throw error; return current.id; } const { data, error } = await supabase.from('sms_settings').insert(payload).select('id').single(); if (error) throw error; return data.id; }
export async function updateSmsTemplate(id: string, body: string, is_active: boolean) { const { error } = await supabase.from('sms_templates').update({ body, is_active, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }
export async function sendTestSms(phone: string, template_key: string, vars: Record<string, string | number | undefined> = {}) { const local = normalizeIranPhone(phone); const { data: template, error } = await supabase.from('sms_templates').select('*').eq('template_key', template_key).maybeSingle(); if (error) throw error; return { ok: true, test: true, message: renderTemplate(template?.body || '', vars), phone: local }; }
