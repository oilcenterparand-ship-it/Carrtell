import { supabase } from '../../lib/supabase';

export type PaymentProvider = 'test' | 'zarinpal' | 'idpay' | 'card_to_card' | 'cash_on_delivery';

export type PaymentSettings = {
  id?: string;
  provider: PaymentProvider;
  online_enabled: boolean;
  card_to_card_enabled: boolean;
  cod_enabled: boolean;
  sandbox_mode: boolean;
  merchant_id?: string | null;
  terminal_id?: string | null;
  callback_url?: string | null;
  card_number?: string | null;
  card_owner?: string | null;
  min_order_amount?: number;
  payment_note?: string | null;
};

const fallbackSettings: PaymentSettings = {
  provider: 'test',
  online_enabled: true,
  card_to_card_enabled: true,
  cod_enabled: false,
  sandbox_mode: true,
  min_order_amount: 0,
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('getPaymentSettings fallback:', error.message);
    return fallbackSettings;
  }

  return data ? { ...fallbackSettings, ...data } : fallbackSettings;
}

export async function savePaymentSettings(input: PaymentSettings): Promise<PaymentSettings> {
  const payload = { ...input, updated_at: new Date().toISOString() };

  if (input.id) {
    const { data, error } = await supabase
      .from('payment_settings')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as PaymentSettings;
  }

  const { data, error } = await supabase
    .from('payment_settings')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as PaymentSettings;
}

export async function createTestPaymentTransaction(args: {
  order_id?: string | null;
  user_id?: string | null;
  amount: number;
  method?: string;
}) {
  const tracking = `CT-${Date.now()}`;
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      order_id: args.order_id ?? null,
      user_id: args.user_id ?? null,
      amount: args.amount,
      method: args.method ?? 'online',
      provider: 'test',
      status: 'paid',
      tracking_code: tracking,
      paid_at: new Date().toISOString(),
      raw_response: { test: true, tracking },
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
