import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' } });
const localPhone = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ ok: false, error: 'server_configuration_missing' }, 500);

  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ ok: false, error: 'unauthorized' }, 401);
    const caller = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) return json({ ok: false, error: 'نشست ورود معتبر نیست.' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile } = await admin.from('profiles').select('phone,role').eq('id', userData.user.id).maybeSingle();
    if (profile?.role && profile.role !== 'customer') return json({ ok: false, error: 'حذف حساب مدیر یا سرویس‌کار از این مسیر مجاز نیست.' }, 403);
    const phone = localPhone(profile?.phone || userData.user.phone || '');
    if (!phone) return json({ ok: false, error: 'شماره موبایل حساب پیدا نشد.' }, 400);

    // Keep financial/order records, but detach and anonymize personal identity.
    const anonymized = `حساب حذف‌شده-${userData.user.id.slice(0, 8)}`;
    const orderUpdate = await admin.from('orders').update({ user_id: null, customer_name: anonymized, customer_phone: '', customer_address: null, address_text: null, latitude: null, longitude: null, customer_note: null, note: null, updated_at: new Date().toISOString() }).eq('user_id', userData.user.id);
    if (orderUpdate.error) console.warn('orders anonymize by user_id', orderUpdate.error.message);
    const orderPhoneUpdate = await admin.from('orders').update({ customer_name: anonymized, customer_phone: '', customer_address: null, address_text: null, latitude: null, longitude: null, customer_note: null, note: null, updated_at: new Date().toISOString() }).eq('customer_phone', phone);
    if (orderPhoneUpdate.error) console.warn('orders anonymize by phone', orderPhoneUpdate.error.message);

    // Personal operational tables. Missing legacy tables are tolerated to keep deletion idempotent.
    for (const table of ['customer_addresses', 'customer_vehicles', 'customer_service_history', 'customer_profiles']) {
      const { error } = await admin.from(table).delete().eq('customer_phone', phone);
      if (error) console.warn(`delete ${table}`, error.message);
    }
    const { error: serviceError } = await admin.from('service_requests').update({ customer_user_id: null, customer_name: anonymized, customer_phone: '' }).eq('customer_user_id', userData.user.id);
    if (serviceError) console.warn('service_requests anonymize', serviceError.message);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
    if (deleteError) return json({ ok: false, error: deleteError.message }, 400);
    return json({ ok: true });
  } catch (error) {
    console.error('customer-account-delete', error);
    return json({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' }, 500);
  }
});
