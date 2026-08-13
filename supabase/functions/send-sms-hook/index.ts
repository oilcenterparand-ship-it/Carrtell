import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Payload = { user: { id: string; phone: string }; sms: { otp: string } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function toIranLocal(phone: string) { const d = phone.replace(/\D/g, ''); return d.startsWith('98') ? `0${d.slice(2)}` : d.startsWith('9') ? `0${d}` : d; }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const raw = await req.text();
  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET');
  try {
    if (hookSecret) {
      const headers = Object.fromEntries(req.headers.entries());
      new Webhook(hookSecret.replace('v1,whsec_', '')).verify(raw, headers);
    }
    const payload = JSON.parse(raw) as Payload;
    const apiKey = Deno.env.get('KAVENEGAR_API_KEY');
    const template = Deno.env.get('KAVENEGAR_TEMPLATE') || 'carrtelllogin';
    if (!apiKey) throw new Error('KAVENEGAR_API_KEY is missing');
    const receptor = toIranLocal(payload.user.phone);
    const body = new URLSearchParams({ receptor, token: payload.sms.otp, template });
    const response = await fetch(`https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    const provider = await response.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from('sms_logs').insert({ phone: receptor, template_key: 'otp_login', status: response.ok ? 'sent' : 'failed', provider: 'kavenegar', provider_response: provider });
    }
    if (!response.ok || provider?.return?.status !== 200) return json({ error: 'sms_provider_failed', provider }, 502);
    return new Response(null, { status: 200 });
  } catch (error) { console.error(error); return json({ error: error instanceof Error ? error.message : 'unknown_error' }, 400); }
});
