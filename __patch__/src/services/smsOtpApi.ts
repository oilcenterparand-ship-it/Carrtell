import { supabase } from '../lib/supabase';

export type SmsTemplateKey = 'otp_login' | 'order_created' | 'payment_success' | 'order_status' | 'driver_assigned' | 'review_link';

export function normalizeIranPhone(input: string) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('98')) return `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits;
}

export function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function renderTemplate(body: string, vars: Record<string, string | number | undefined>) {
  return body.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ''));
}

export async function getSmsSettings() {
  const { data, error } = await supabase.from('sms_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSmsTemplates() {
  const { data, error } = await supabase.from('sms_templates').select('*').order('template_key');
  if (error) throw error;
  return data || [];
}

export async function saveSmsSettings(payload: any) {
  const current = await getSmsSettings();
  if (current?.id) {
    const { error } = await supabase.from('sms_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', current.id);
    if (error) throw error;
    return current.id;
  }
  const { data, error } = await supabase.from('sms_settings').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function updateSmsTemplate(id: string, body: string, is_active: boolean) {
  const { error } = await supabase.from('sms_templates').update({ body, is_active, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function logSmsEvent(phone: string, template_key: string, message: string, status: 'logged' | 'queued' | 'sent' | 'failed' | 'test' = 'test', provider_response?: any) {
  const { error } = await supabase.from('sms_logs').insert({ phone, template_key, message, status, provider_response: provider_response || null });
  if (error) console.warn('sms log failed', error);
}

export async function sendSmsByTemplate(phone: string, template_key: SmsTemplateKey, vars: Record<string, string | number | undefined> = {}) {
  const safePhone = normalizeIranPhone(phone);
  const { data: tpl } = await supabase.from('sms_templates').select('*').eq('template_key', template_key).maybeSingle();
  const message = renderTemplate(tpl?.body || '', vars);
  const settings = await getSmsSettings().catch(() => null);
  if (!settings?.is_enabled || settings?.test_mode || settings?.provider === 'test') {
    await logSmsEvent(safePhone, template_key, message, 'test', { mode: 'test_only' });
    return { ok: true, test: true, message };
  }
  // Real provider integration will be added after API key is finalized.
  await logSmsEvent(safePhone, template_key, message, 'queued', { provider: settings.provider });
  return { ok: true, queued: true, message };
}

export async function requestOtp(phone: string) {
  const safePhone = normalizeIranPhone(phone);
  const code = createOtpCode();
  const expires = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  const { error } = await supabase.from('otp_codes').insert({ phone: safePhone, code, expires_at: expires });
  if (error) throw error;
  await sendSmsByTemplate(safePhone, 'otp_login', { code });
  return { ok: true, phone: safePhone, expires_at: expires, dev_code: code };
}

export async function verifyOtp(phone: string, code: string) {
  const safePhone = normalizeIranPhone(phone);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', safePhone)
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false };
  await supabase.from('otp_codes').update({ used_at: now }).eq('id', data.id);
  return { ok: true, phone: safePhone };
}
