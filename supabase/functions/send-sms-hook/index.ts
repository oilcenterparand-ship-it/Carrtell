import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SmsHookPayload = {
  user?: { id?: string; phone?: string };
  sms?: { otp?: string };
};

type ProviderResponse = {
  return?: { status?: number; message?: string };
  entries?: Array<Record<string, unknown>>;
};

type ProviderName = 'kavenegar' | 'ghasedak';

const TERMINAL_FAILURE_STATUSES = new Set([6, 11, 13, 14]);

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

function safeProviderResponse(provider: ProviderResponse) {
  const entries = Array.isArray(provider.entries)
    ? provider.entries.slice(0, 3).map((entry) => ({
        messageid: entry?.messageid ?? null,
        receptor: entry?.receptor ?? null,
        status: entry?.status ?? null,
        statustext: entry?.statustext ?? null,
        date: entry?.date ?? null,
        cost: entry?.cost ?? null,
      }))
    : [];
  return {
    return: {
      status: Number(provider?.return?.status || 0),
      message: String(provider?.return?.message || ''),
    },
    entries,
  };
}

function getEntryStatuses(provider: ProviderResponse) {
  return Array.isArray(provider.entries)
    ? provider.entries.map((entry) => Number(entry?.status)).filter(Number.isFinite)
    : [];
}

function providerAccepted(httpOk: boolean, provider: ProviderResponse) {
  const apiOk = Number(provider?.return?.status || 0) === 200;
  const statuses = getEntryStatuses(provider);
  const terminalFailure = statuses.some((status) => TERMINAL_FAILURE_STATUSES.has(status));
  return httpOk && apiOk && !terminalFailure && statuses.length > 0;
}

async function writeSmsLog(input: {
  phone: string;
  provider: ProviderName;
  status: 'sent' | 'failed';
  providerResponse: unknown;
  errorMessage?: string | null;
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return;

  try {
    const admin = createClient(supabaseUrl, serviceKey);
    const { error } = await admin.from('sms_logs').insert({
      phone: input.phone,
      message: `OTP login via ${input.provider}`,
      type: 'otp_login',
      template_key: 'otp_login',
      status: input.status,
      provider: input.provider,
      provider_response: input.providerResponse,
      error_message: input.errorMessage ?? null,
    });
    if (error) console.error('[CARRTELL_SMS] sms_logs insert failed', error.message);
  } catch (error) {
    console.error('[CARRTELL_SMS] sms_logs unexpected failure', error);
  }
}

async function sendVerifyLookup(input: {
  endpoint: string;
  apiKey: string;
  template: string;
  receptor: string;
  otp: string;
}) {
  const body = new URLSearchParams({
    receptor: input.receptor,
    token: input.otp,
    template: input.template,
  });

  const response = await fetch(`${input.endpoint}/${input.apiKey}/verify/lookup.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const provider = (await response.json().catch(() => ({}))) as ProviderResponse;
  return { response, provider, accepted: providerAccepted(response.ok, provider) };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const hookSecretRaw = Deno.env.get('SEND_SMS_HOOK_SECRET');
  const kavenegarApiKey = Deno.env.get('KAVENEGAR_API_KEY');
  const kavenegarTemplate = Deno.env.get('KAVENEGAR_TEMPLATE') || 'carrtelllogin';
  const ghasedakApiKey = Deno.env.get('GHASEDAK_API_KEY');
  const ghasedakTemplate = Deno.env.get('GHASEDAK_TEMPLATE');

  if (!hookSecretRaw) {
    console.error('[CARRTELL_SMS] SEND_SMS_HOOK_SECRET is missing');
    return json({ error: 'sms_hook_secret_missing' }, 500);
  }
  if (!kavenegarApiKey) {
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

  const receptor = toIranLocal(payload.user?.phone || '');
  const otp = payload.sms?.otp || '';
  if (!/^09\d{9}$/.test(receptor) || !/^\d{4,8}$/.test(otp)) {
    console.error('[CARRTELL_SMS] invalid payload', { receptorLength: receptor.length, otpLength: otp.length });
    return json({ error: 'invalid_sms_hook_payload' }, 400);
  }

  try {
    const primary = await sendVerifyLookup({
      endpoint: 'https://api.kavenegar.com/v1',
      apiKey: kavenegarApiKey,
      template: kavenegarTemplate,
      receptor,
      otp,
    });

    if (primary.accepted) {
      await writeSmsLog({
        phone: receptor,
        provider: 'kavenegar',
        status: 'sent',
        providerResponse: safeProviderResponse(primary.provider),
      });
      console.info('[CARRTELL_SMS] OTP accepted by Kavenegar', { phoneSuffix: receptor.slice(-4), statuses: getEntryStatuses(primary.provider) });
      return json({}, 200);
    }

    await writeSmsLog({
      phone: receptor,
      provider: 'kavenegar',
      status: 'failed',
      providerResponse: safeProviderResponse(primary.provider),
      errorMessage: `Kavenegar delivery status: ${getEntryStatuses(primary.provider).join(',') || 'unknown'}`,
    });

    console.warn('[CARRTELL_SMS] Kavenegar did not accept delivery', {
      providerStatus: primary.provider?.return?.status,
      entryStatuses: getEntryStatuses(primary.provider),
      phoneSuffix: receptor.slice(-4),
    });

    // Optional failover. It stays disabled until both server-side secrets are configured.
    if (ghasedakApiKey && ghasedakTemplate) {
      const fallback = await sendVerifyLookup({
        endpoint: 'https://api.ghasedak.me/kavenegar/v1',
        apiKey: ghasedakApiKey,
        template: ghasedakTemplate,
        receptor,
        otp,
      });

      await writeSmsLog({
        phone: receptor,
        provider: 'ghasedak',
        status: fallback.accepted ? 'sent' : 'failed',
        providerResponse: safeProviderResponse(fallback.provider),
        errorMessage: fallback.accepted ? null : `Ghasedak delivery status: ${getEntryStatuses(fallback.provider).join(',') || 'unknown'}`,
      });

      if (fallback.accepted) {
        console.info('[CARRTELL_SMS] OTP accepted by Ghasedak fallback', { phoneSuffix: receptor.slice(-4), statuses: getEntryStatuses(fallback.provider) });
        return json({}, 200);
      }
    }

    return json({ error: 'sms_provider_failed' }, 502);
  } catch (error) {
    console.error('[CARRTELL_SMS] provider network failure', error);
    await writeSmsLog({
      phone: receptor,
      provider: 'kavenegar',
      status: 'failed',
      providerResponse: { error: 'network_failure' },
      errorMessage: 'SMS provider network failure',
    });
    return json({ error: 'sms_provider_network_failure' }, 502);
  }
});
