import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' },
});

function validUsername(value: string) {
  return /^[a-z0-9_.-]{3,32}$/.test(value);
}

function normalizeAuthPhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^09\d{9}$/.test(digits)) return `+98${digits.slice(1)}`;
  if (/^9\d{9}$/.test(digits)) return `+98${digits}`;
  if (/^989\d{9}$/.test(digits)) return `+${digits}`;
  return String(value || '').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ ok: false, error: 'server_configuration_missing' }, 500);

  try {
    const body = await req.json();
    const action = String(body?.action || '');
    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!validUsername(username)) return json({ ok: false, error: 'نام کاربری نامعتبر است.' }, 400);
    if (password.length < 8) return json({ ok: false, error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    if (action === 'setup') {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) return json({ ok: false, error: 'unauthorized' }, 401);

      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (userError || !userData.user) return json({ ok: false, error: 'نشست ورود معتبر نیست.' }, 401);

      const { data: duplicate } = await admin
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .neq('id', userData.user.id)
        .maybeSingle();
      if (duplicate) return json({ ok: false, error: 'این نام کاربری قبلاً انتخاب شده است.' }, 409);

      const { error: passwordError } = await admin.auth.admin.updateUserById(userData.user.id, { password });
      if (passwordError) return json({ ok: false, error: passwordError.message }, 400);

      const { error: profileError } = await admin
        .from('profiles')
        .update({ username, updated_at: new Date().toISOString() })
        .eq('id', userData.user.id);
      if (profileError) return json({ ok: false, error: profileError.message }, 400);

      return json({ ok: true, username });
    }

    if (action === 'login') {
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('phone,username,is_active')
        .ilike('username', username)
        .maybeSingle();
      if (profileError || !profile?.phone || profile.is_active === false) return json({ ok: false, error: 'نام کاربری یا رمز عبور صحیح نیست.' }, 401);

      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ phone: normalizeAuthPhone(profile.phone), password }),
        signal: AbortSignal.timeout(12_000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.access_token) return json({ ok: false, error: 'نام کاربری یا رمز عبور صحیح نیست.' }, 401);
      return json(result);
    }

    return json({ ok: false, error: 'unsupported_action' }, 400);
  } catch (error) {
    console.error('customer-credentials', error);
    return json({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' }, 400);
  }
});
