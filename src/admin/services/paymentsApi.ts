import { supabase } from '../../lib/supabase';
import { getOrder, type Order } from './ordersApi';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'test' | 'zarinpal' | 'idpay' | 'manual';

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  authority?: string | null;
  reference_id?: string | null;
  card_pan?: string | null;
  error_message?: string | null;
  paid_at?: string | null;
  created_at: string;
};

export type PaymentGatewaySettings = {
  activeProvider: PaymentProvider;
  zarinpalEnabled: boolean;
  zarinpalMode: 'sandbox' | 'production';
  zarinpalMerchantId: string;
  zarinpalEdgeRequestUrl: string;
  zarinpalEdgeVerifyUrl: string;
  callbackPath: string;
  testGatewayEnabled: boolean;
  descriptionPrefix: string;
};

export const defaultPaymentGatewaySettings: PaymentGatewaySettings = {
  activeProvider: 'test',
  zarinpalEnabled: false,
  zarinpalMode: 'sandbox',
  zarinpalMerchantId: '',
  zarinpalEdgeRequestUrl: '',
  zarinpalEdgeVerifyUrl: '',
  callbackPath: '/payment',
  testGatewayEnabled: true,
  descriptionPrefix: 'پرداخت سفارش Carrtell',
};

function makeTestReference(orderId: string) {
  const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const stamp = Date.now().toString().slice(-6);
  return `CTPAY-${shortId}-${stamp}`;
}

function getOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function makeCallbackUrl(orderId: string, settings: PaymentGatewaySettings) {
  const origin = getOrigin();
  const path = settings.callbackPath || '/payment';
  const url = new URL(path.startsWith('http') ? path : `${origin}${path}`);
  url.searchParams.set('orderId', orderId);
  url.searchParams.set('provider', 'zarinpal');
  return url.toString();
}

async function upsertSetting(key: string, value: unknown) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'payment_gateway')
    .maybeSingle();

  if (error) {
    console.warn('payment_gateway settings not found or site_settings missing:', error.message);
    return defaultPaymentGatewaySettings;
  }

  return {
    ...defaultPaymentGatewaySettings,
    ...((data?.value || {}) as Partial<PaymentGatewaySettings>),
  };
}

export async function updatePaymentGatewaySettings(value: PaymentGatewaySettings) {
  return upsertSetting('payment_gateway', {
    ...defaultPaymentGatewaySettings,
    ...value,
    updated_at: new Date().toISOString(),
  });
}

export async function getPaymentsByOrder(orderId: string) {
  if (!orderId) return [] as Payment[];
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Payment[];
}

export async function getLatestPaymentByOrder(orderId: string) {
  const payments = await getPaymentsByOrder(orderId);
  return payments[0] || null;
}

export async function createTestPayment(orderId: string) {
  if (!orderId) throw new Error('شناسه سفارش معتبر نیست.');

  const order = await getOrder(orderId);
  if (!order) throw new Error('سفارش پیدا نشد.');

  if (order.status === 'paid' || order.payment_status === 'paid') {
    return { order, payment: await getLatestPaymentByOrder(orderId) };
  }

  const referenceId = makeTestReference(orderId);
  const now = new Date().toISOString();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      amount: Number(order.total_amount || 0),
      status: 'paid',
      provider: 'test',
      reference_id: referenceId,
      paid_at: now,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  const { data: updatedOrder, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_provider: 'test',
      payment_reference: referenceId,
      paid_at: now,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) throw orderError;

  return { order: updatedOrder as Order, payment: payment as Payment };
}

export async function createPendingZarinpalPayment(order: Order, authority?: string | null) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      amount: Number(order.total_amount || 0),
      status: 'pending',
      provider: 'zarinpal',
      authority: authority || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
}

export async function startZarinpalPayment(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error('سفارش پیدا نشد.');

  if (order.status === 'paid' || order.payment_status === 'paid') {
    return { order, payment: await getLatestPaymentByOrder(orderId), redirectUrl: '' };
  }

  const settings = await getPaymentGatewaySettings();
  if (!settings.zarinpalEnabled || settings.activeProvider !== 'zarinpal') {
    throw new Error('درگاه زرین‌پال هنوز از پنل مدیریت فعال نشده است.');
  }

  const callbackUrl = makeCallbackUrl(orderId, settings);

  if (!settings.zarinpalEdgeRequestUrl) {
    const payment = await createPendingZarinpalPayment(order);
    await supabase
      .from('orders')
      .update({ status: 'pending_payment', payment_status: 'unpaid', payment_provider: 'zarinpal' })
      .eq('id', orderId);

    return {
      order,
      payment,
      redirectUrl: '',
      setupRequired: true,
      message: 'آدرس Edge Function درخواست زرین‌پال در تنظیمات پرداخت وارد نشده است.',
    };
  }

  const response = await fetch(settings.zarinpalEdgeRequestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      amount: Number(order.total_amount || 0),
      description: `${settings.descriptionPrefix} ${order.order_number || order.id}`,
      callbackUrl,
      merchantId: settings.zarinpalMerchantId,
      mode: settings.zarinpalMode,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.error) {
    throw new Error(result?.message || result?.error || 'درخواست پرداخت زرین‌پال ناموفق بود.');
  }

  const authority = result.authority || result.Authority || null;
  const redirectUrl = result.redirectUrl || result.paymentUrl || result.url || '';
  const payment = await createPendingZarinpalPayment(order, authority);

  await supabase
    .from('orders')
    .update({
      status: 'pending_payment',
      payment_status: 'unpaid',
      payment_provider: 'zarinpal',
      payment_authority: authority,
    })
    .eq('id', orderId);

  return { order, payment, redirectUrl, setupRequired: false };
}

export async function verifyZarinpalPayment(orderId: string, authority: string, status: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error('سفارش پیدا نشد.');

  if (status && status.toUpperCase() !== 'OK') {
    await supabase
      .from('payments')
      .update({ status: 'failed', error_message: 'پرداخت توسط کاربر لغو شد یا از سمت درگاه ناموفق برگشت.' })
      .eq('order_id', orderId)
      .eq('authority', authority);
    throw new Error('پرداخت ناموفق یا لغو شده است.');
  }

  const settings = await getPaymentGatewaySettings();

  if (!settings.zarinpalEdgeVerifyUrl) {
    throw new Error('آدرس Edge Function تایید پرداخت زرین‌پال در تنظیمات پرداخت وارد نشده است.');
  }

  const response = await fetch(settings.zarinpalEdgeVerifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      authority,
      amount: Number(order.total_amount || 0),
      merchantId: settings.zarinpalMerchantId,
      mode: settings.zarinpalMode,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.error) {
    throw new Error(result?.message || result?.error || 'تایید پرداخت زرین‌پال ناموفق بود.');
  }

  const referenceId = String(result.referenceId || result.refId || result.RefID || '');
  const now = new Date().toISOString();

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      reference_id: referenceId,
      paid_at: now,
      error_message: null,
    })
    .eq('order_id', orderId)
    .eq('authority', authority)
    .select()
    .maybeSingle();

  if (paymentError) throw paymentError;

  const { data: updatedOrder, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_provider: 'zarinpal',
      payment_reference: referenceId,
      payment_authority: authority,
      paid_at: now,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) throw orderError;
  return { order: updatedOrder as Order, payment: payment as Payment | null };
}

export function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'paid': return 'پرداخت شده';
    case 'pending': return 'در انتظار برگشت از درگاه';
    case 'failed': return 'ناموفق';
    case 'refunded': return 'برگشت خورده';
    case 'unpaid':
    default: return 'پرداخت نشده';
  }
}
