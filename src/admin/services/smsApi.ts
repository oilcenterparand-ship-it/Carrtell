import { supabase } from '../../lib/supabase';

export type SmsProvider = 'manual' | 'kavenegar' | 'melipayamak' | 'farazsms';
export type SmsStatus = 'pending' | 'sent' | 'failed' | 'disabled' | 'manual';

export type SmsSettings = {
  id?: string;
  provider: SmsProvider;
  is_enabled: boolean;
  sender_number?: string | null;
  api_key?: string | null;
  api_secret?: string | null;
  username?: string | null;
  password?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SmsTemplate = {
  id: string;
  template_key: string;
  title: string;
  body: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SmsLog = {
  id: string;
  phone: string;
  message: string;
  template_key?: string | null;
  related_type?: string | null;
  related_id?: string | null;
  status: SmsStatus;
  provider?: string | null;
  error_message?: string | null;
  provider_response?: unknown;
  sent_at?: string | null;
  created_at: string;
};

export type SmsTemplateVariables = Record<string, string | number | null | undefined>;

const DEFAULT_SETTINGS: SmsSettings = {
  provider: 'manual',
  is_enabled: false,
  sender_number: null,
  api_key: null,
  api_secret: null,
  username: null,
  password: null,
};

const DEFAULT_TEMPLATES: Array<Omit<SmsTemplate, 'id'>> = [
  {
    template_key: 'order_created',
    title: 'ثبت سفارش',
    body: 'سفارش شما در کارتل با کد {{order_code}} ثبت شد و در انتظار بررسی است.',
    is_enabled: true,
  },
  {
    template_key: 'order_status_changed',
    title: 'تغییر وضعیت سفارش',
    body: 'وضعیت سفارش {{order_code}} به {{status}} تغییر کرد.',
    is_enabled: true,
  },
  {
    template_key: 'service_assigned',
    title: 'تخصیص سرویس‌کار',
    body: 'درخواست سرویس شما به سرویس‌کار کارتل اختصاص داده شد. کد: {{service_code}}',
    is_enabled: true,
  },
  {
    template_key: 'service_completed',
    title: 'پایان سرویس',
    body: 'سرویس خودروی شما انجام شد. لطفاً نظر خود را ثبت کنید: {{review_link}}',
    is_enabled: true,
  },
  {
    template_key: 'review_link',
    title: 'لینک ثبت نظر',
    body: 'ممنون از انتخاب کارتل. ثبت نظر شما: {{review_link}}',
    is_enabled: true,
  },
];

function getCurrentOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

function normalizePhone(phone?: string | null) {
  return String(phone ?? '').trim();
}

function safeId(value?: string | number | null) {
  return String(value ?? '').trim();
}

export function makeReviewLink(orderId?: string | number | null, baseUrl?: string) {
  const origin = (baseUrl ?? getCurrentOrigin()).replace(/\/$/, '');
  const id = encodeURIComponent(safeId(orderId));
  return `${origin}/review${id ? `?orderId=${id}` : ''}`;
}

export function makeServiceReviewLink(serviceId?: string | number | null, baseUrl?: string) {
  const origin = (baseUrl ?? getCurrentOrigin()).replace(/\/$/, '');
  const id = encodeURIComponent(safeId(serviceId));
  return `${origin}/review${id ? `?serviceId=${id}` : ''}`;
}

export function renderSmsTemplate(body: string, variables: SmsTemplateVariables = {}) {
  return String(body ?? '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => String(variables[key] ?? ''));
}

async function ensureSmsTablesAreUsable() {
  // This function intentionally does not create tables from the browser.
  // Run docs/sql/2026_sms_system.sql if a table is missing.
  return true;
}

export async function getSmsSettings(): Promise<SmsSettings> {
  await ensureSmsTablesAreUsable();
  const { data, error } = await supabase
    .from('sms_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('getSmsSettings failed:', error.message);
    return DEFAULT_SETTINGS;
  }

  if (data) return data as SmsSettings;

  const { data: created, error: insertError } = await supabase
    .from('sms_settings')
    .insert(DEFAULT_SETTINGS)
    .select('*')
    .single();

  if (insertError) {
    console.warn('create default sms settings failed:', insertError.message);
    return DEFAULT_SETTINGS;
  }

  return created as SmsSettings;
}

export async function saveSmsSettings(settings: SmsSettings): Promise<SmsSettings> {
  const current = await getSmsSettings();
  const payload = { ...settings, updated_at: new Date().toISOString() };

  if (current.id) {
    const { data, error } = await supabase
      .from('sms_settings')
      .update(payload)
      .eq('id', current.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as SmsSettings;
  }

  const { data, error } = await supabase
    .from('sms_settings')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as SmsSettings;
}

export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('getSmsTemplates failed:', error.message);
    return [];
  }

  return (data ?? []) as SmsTemplate[];
}

export async function seedSmsTemplatesIfEmpty() {
  const current = await getSmsTemplates();
  if (current.length > 0) return current;

  const { data, error } = await supabase
    .from('sms_templates')
    .insert(DEFAULT_TEMPLATES)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('seedSmsTemplatesIfEmpty failed:', error.message);
    return [];
  }

  return (data ?? []) as SmsTemplate[];
}

export async function getSmsTemplateByKey(templateKey: string): Promise<SmsTemplate | null> {
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('template_key', templateKey)
    .maybeSingle();

  if (error) {
    console.warn('getSmsTemplateByKey failed:', error.message);
    return null;
  }

  return (data as SmsTemplate | null) ?? null;
}

export async function updateSmsTemplate(id: string, patch: Partial<SmsTemplate>) {
  const { data, error } = await supabase
    .from('sms_templates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SmsTemplate;
}

export async function getSmsLogs(filters?: { status?: string; phone?: string; template_key?: string }): Promise<SmsLog[]> {
  let query = supabase.from('sms_logs').select('*').order('created_at', { ascending: false }).limit(300);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.template_key && filters.template_key !== 'all') query = query.eq('template_key', filters.template_key);
  if (filters?.phone) query = query.ilike('phone', `%${filters.phone}%`);

  const { data, error } = await query;
  if (error) {
    console.warn('getSmsLogs failed:', error.message);
    return [];
  }

  return (data ?? []) as SmsLog[];
}

export async function createSmsLog(input: {
  phone: string;
  message: string;
  template_key?: string;
  related_type?: string;
  related_id?: string;
  status?: SmsStatus;
  error_message?: string;
  provider_response?: unknown;
}) {
  const phone = normalizePhone(input.phone);
  const settings = await getSmsSettings();

  const { data, error } = await supabase
    .from('sms_logs')
    .insert({
      phone,
      message: input.message,
      template_key: input.template_key ?? null,
      related_type: input.related_type ?? null,
      related_id: input.related_id ?? null,
      provider: settings.provider,
      provider_response: input.provider_response ?? null,
      status: input.status ?? (settings.is_enabled ? 'pending' : 'disabled'),
      error_message: input.error_message ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.warn('createSmsLog failed:', error.message);
    return {
      id: `local-${Date.now()}`,
      phone,
      message: input.message,
      template_key: input.template_key,
      related_type: input.related_type,
      related_id: input.related_id,
      provider: settings.provider,
      status: 'failed',
      error_message: error.message,
      created_at: new Date().toISOString(),
    } as SmsLog;
  }

  return data as SmsLog;
}

export async function logSmsEvent(input: {
  phone?: string | null;
  message?: string | null;
  template_key?: string | null;
  related_type?: string | null;
  related_id?: string | number | null;
  status?: SmsStatus;
  error_message?: string | null;
  variables?: SmsTemplateVariables;
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return null;
  }

  let message = input.message ?? '';
  if (!message && input.template_key) {
    const template = await getSmsTemplateByKey(input.template_key);
    message = template ? renderSmsTemplate(template.body, input.variables ?? {}) : `Template not found: ${input.template_key}`;
  }

  return createSmsLog({
    phone,
    message,
    template_key: input.template_key ?? undefined,
    related_type: input.related_type ?? undefined,
    related_id: input.related_id == null ? undefined : String(input.related_id),
    status: input.status ?? 'disabled',
    error_message: input.error_message ?? undefined,
  });
}

export async function sendSmsByTemplate(args: {
  phone?: string | null;
  template_key: string;
  variables?: SmsTemplateVariables;
  related_type?: string;
  related_id?: string | number | null;
}) {
  const phone = normalizePhone(args.phone);
  if (!phone) return null;

  const [settings, templates] = await Promise.all([getSmsSettings(), getSmsTemplates()]);
  const template = templates.find((item) => item.template_key === args.template_key);

  if (!template) {
    return createSmsLog({
      phone,
      message: `Template not found: ${args.template_key}`,
      template_key: args.template_key,
      related_type: args.related_type,
      related_id: args.related_id == null ? undefined : String(args.related_id),
      status: 'failed',
      error_message: 'قالب پیامک پیدا نشد',
    });
  }

  const message = renderSmsTemplate(template.body, args.variables ?? {});
  if (!settings.is_enabled || !template.is_enabled) {
    return createSmsLog({
      phone,
      message,
      template_key: args.template_key,
      related_type: args.related_type,
      related_id: args.related_id == null ? undefined : String(args.related_id),
      status: 'disabled',
      error_message: 'ارسال پیامک غیرفعال است',
    });
  }

  // Browser-safe mode: real provider calls must be done through Supabase Edge Functions.
  // Until provider integration is configured server-side, Carrtell logs the SMS instead of crashing the app.
  return createSmsLog({
    phone,
    message,
    template_key: args.template_key,
    related_type: args.related_type,
    related_id: args.related_id == null ? undefined : String(args.related_id),
    status: settings.provider === 'manual' ? 'manual' : 'pending',
  });
}

export async function sendOrderCreatedSms(order: {
  id?: string | number;
  order_code?: string | number | null;
  customer_phone?: string | null;
  phone?: string | null;
  total?: number | string | null;
}) {
  return sendSmsByTemplate({
    phone: order.customer_phone ?? order.phone,
    template_key: 'order_created',
    related_type: 'order',
    related_id: order.id,
    variables: {
      order_code: order.order_code ?? order.id,
      total: order.total ?? '',
    },
  });
}

export async function sendOrderStatusSms(order: {
  id?: string | number;
  order_code?: string | number | null;
  customer_phone?: string | null;
  phone?: string | null;
}, statusLabel: string) {
  return sendSmsByTemplate({
    phone: order.customer_phone ?? order.phone,
    template_key: 'order_status_changed',
    related_type: 'order',
    related_id: order.id,
    variables: {
      order_code: order.order_code ?? order.id,
      status: statusLabel,
    },
  });
}

export async function sendReviewLinkSms(order: {
  id?: string | number;
  order_code?: string | number | null;
  customer_phone?: string | null;
  phone?: string | null;
}) {
  return sendSmsByTemplate({
    phone: order.customer_phone ?? order.phone,
    template_key: 'review_link',
    related_type: 'order',
    related_id: order.id,
    variables: {
      order_code: order.order_code ?? order.id,
      review_link: makeReviewLink(order.id),
    },
  });
}

export async function sendServiceAssignedSms(service: {
  id?: string | number;
  service_code?: string | number | null;
  customer_phone?: string | null;
  phone?: string | null;
}) {
  return sendSmsByTemplate({
    phone: service.customer_phone ?? service.phone,
    template_key: 'service_assigned',
    related_type: 'service_request',
    related_id: service.id,
    variables: {
      service_code: service.service_code ?? service.id,
    },
  });
}

export async function sendServiceCompletedSms(service: {
  id?: string | number;
  service_code?: string | number | null;
  customer_phone?: string | null;
  phone?: string | null;
}) {
  return sendSmsByTemplate({
    phone: service.customer_phone ?? service.phone,
    template_key: 'service_completed',
    related_type: 'service_request',
    related_id: service.id,
    variables: {
      service_code: service.service_code ?? service.id,
      review_link: makeServiceReviewLink(service.id),
    },
  });
}

export async function retrySmsLog(log: SmsLog) {
  const { data, error } = await supabase
    .from('sms_logs')
    .insert({
      phone: log.phone,
      message: log.message,
      template_key: log.template_key,
      related_type: log.related_type,
      related_id: log.related_id,
      provider: log.provider ?? 'manual',
      status: 'pending',
      error_message: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SmsLog;
}

export async function markSmsLogSent(id: string) {
  const { data, error } = await supabase
    .from('sms_logs')
    .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SmsLog;
}

export async function markSmsLogFailed(id: string, errorMessage?: string) {
  const { data, error } = await supabase
    .from('sms_logs')
    .update({ status: 'failed', error_message: errorMessage ?? 'ارسال ناموفق بود' })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SmsLog;
}
