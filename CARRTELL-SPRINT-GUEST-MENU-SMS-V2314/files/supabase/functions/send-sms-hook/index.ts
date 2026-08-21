import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SmsHookPayload = {
  user?: {
    id?: string;
    phone?: string;
  };
  sms?: {
    otp?: string;
  };
};

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
  entries?: unknown[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

function toIranLocal(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('98')) return `0${digits.slice(2)}`;
  if (digits.startsWith('9')) return `0${digits}`;
  return digits;
}

async function writeSmsLog(input: {
  phone: string;
  status: 'sent' | 'failed';
  providerResponse: unknown;
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return;

  try {
    const admin = createClient(supabaseUrl, serviceKey);
    const { error } = await admin.from('sms_logs').insert({
      phone: input.phone,
      template_key: 'otp_login',
      status: input.status,
      provider: 'kavenegar',
      provider_response: input.providerResponse,
    });
    if (error) console.error('[CARRTELL_SMS] sms_logs insert failed', error.message);
  } catch (error) {
    console.error('[CARRTELL_SMS] sms_logs unexpected failure', error);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const hookSecretRaw = Deno.env.get('SEND_SMS_HOOK_SECRET');
  const apiKey = Deno.env.get('KAVENEGAR_API_KEY');
  const template = Deno.env.get('KAVENEGAR_TEMPLATE') || 'carrtelllogin';

  if (!hookSecretRaw) {
    console.error('[CARRTELL_SMS] SEND_SMS_HOOK_SECRET is missing');
    return json({ error: 'sms_hook_secret_missing' }, 500);
  }

  if (!apiKey) {
    console.error('[CARRTELL_SMS] KAVENEGAR_API_KEY is missing');
    return json({ error: 'kavenegar_api_key_missing' }, 500);
  }

  const raw = await req.text();

  let payload: SmsHookPayload;
  try {
    const hookSecret = hookSecretRaw.replace('v1,whsec_', '');
    const headers = Object.fromEntries(req.headers.entries());
    payload = new Webhook(hookSecret).verify(raw, headers) as SmsHookPayload;
  } catch (error) {
    console.error('[CARRTELL_SMS] invalid hook signature', error);
    return json({ error: 'invalid_hook_signature' }, 401);
  }

  const phone = payload.user?.phone || '';
  const otp = payload.sms?.otp || '';
  const receptor = toIranLocal(phone);

  if (!/^09\d{9}$/.test(receptor) || !/^\d{4,8}$/.test(otp)) {
    console.error('[CARRTELL_SMS] invalid payload', {
      hasPhone: Boolean(phone),
      receptorLength: receptor.length,
      otpLength: otp.length,
    });
    return json({ error: 'invalid_sms_hook_payload' }, 400);
  }

  const body = new URLSearchParams({
    receptor,
    token: otp,
    template,
  });

  let response: Response;
  let provider: KavenegarResponse = {};

  try {
    response = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    provider = (await response.json().catch(() => ({}))) as KavenegarResponse;
  } catch (error) {
    console.error('[CARRTELL_SMS] Kavenegar network failure', error);
    await writeSmsLog({
      phone: receptor,
      status: 'failed',
      providerResponse: { error: 'network_failure' },
    });
    return json({ error: 'sms_provider_network_failure' }, 502);
  }

  const providerStatus = Number(provider?.return?.status || 0);
  const sent = response.ok && providerStatus === 200;

  await writeSmsLog({
    phone: receptor,
    status: sent ? 'sent' : 'failed',
    providerResponse: provider,
  });

  if (!sent) {
    console.error('[CARRTELL_SMS] Kavenegar rejected request', {
      httpStatus: response.status,
      providerStatus,
      providerMessage: provider?.return?.message || '',
      template,
    });
    return json(
      {
        error: 'sms_provider_failed',
        provider_status: providerStatus,
        provider_message: provider?.return?.message || '',
      },
      502,
    );
  }

  console.info('[CARRTELL_SMS] OTP sent', {
    phoneSuffix: receptor.slice(-4),
    template,
  });

  // Supabase Send SMS Hook treats an empty 200 response as success.
  return new Response(null, { status: 200 });
});
