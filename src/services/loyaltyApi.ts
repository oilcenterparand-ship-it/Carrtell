import { supabase } from '../lib/supabase';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type LoyaltySettings = {
  id: string;
  purchase_point_rate: number;
  point_to_toman: number;
  review_points: number;
  review_photo_points: number;
  health_record_points: number;
  referral_points: number;
  package_purchase_points: number;
  first_onsite_service_points: number;
  referral_reward_toman: number;
  referred_discount_toman: number;
  bronze_min: number;
  silver_min: number;
  gold_min: number;
  diamond_min: number;
  is_enabled: boolean;
};

export type CustomerWallet = {
  id: string;
  user_id?: string | null;
  phone?: string | null;
  points: number;
  credit_toman: number;
  referral_code?: string | null;
  tier: LoyaltyTier;
  created_at?: string;
  updated_at?: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id?: string | null;
  user_id?: string | null;
  type: string;
  title?: string | null;
  description?: string | null;
  points_delta: number;
  credit_delta: number;
  order_id?: string | null;
  created_at?: string;
};

export function formatToman(value?: number | null) {
  return `${Number(value || 0).toLocaleString('fa-IR')} تومان`;
}

export function makeReferralCode(phone?: string | null) {
  const tail = (phone || '').replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 8999).toString();
  return `CARRTELL-${tail}`;
}

export function calculateTier(points: number, settings?: Partial<LoyaltySettings> | null): LoyaltyTier {
  const diamond = settings?.diamond_min ?? 7000;
  const gold = settings?.gold_min ?? 3000;
  const silver = settings?.silver_min ?? 1000;
  if (points >= diamond) return 'diamond';
  if (points >= gold) return 'gold';
  if (points >= silver) return 'silver';
  return 'bronze';
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const { data, error } = await supabase
    .from('loyalty_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();
  if (error) throw error;
  return (data || {
    id: 'default', purchase_point_rate: 0.01, point_to_toman: 100, review_points: 50, review_photo_points: 80, health_record_points: 100, referral_points: 250, package_purchase_points: 150, first_onsite_service_points: 300,
    referral_reward_toman: 100000, referred_discount_toman: 50000,
    bronze_min: 0, silver_min: 1000, gold_min: 3000, diamond_min: 7000, is_enabled: true,
  }) as LoyaltySettings;
}

export async function upsertLoyaltySettings(settings: Partial<LoyaltySettings>) {
  const { data, error } = await supabase
    .from('loyalty_settings')
    .upsert({ id: 'default', ...settings, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data as LoyaltySettings;
}

export async function getOrCreateMyWallet(phone?: string | null): Promise<CustomerWallet> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    const local: CustomerWallet = {
      id: 'local-wallet', user_id: null, phone: phone || null, points: 0, credit_toman: 0,
      referral_code: makeReferralCode(phone), tier: 'bronze'
    };
    return local;
  }

  const { data, error } = await supabase.rpc('carrtell_get_or_create_my_wallet', { p_phone: phone || null });
  if (error) throw error;
  return data as CustomerWallet;
}

export async function getMyWalletTransactions(userId?: string | null): Promise<WalletTransaction[]> {
  let uid = userId;
  if (!uid) {
    const { data: auth } = await supabase.auth.getUser();
    uid = auth.user?.id || null;
  }
  if (!uid) return [];
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

export async function createWalletTopupOrder(amount: number) {
  const { data, error } = await supabase.rpc('carrtell_create_wallet_topup_order', { p_amount: amount });
  if (error) throw error;
  return data as { id: string; order_number: string; total_amount: number };
}

export async function applyWalletToOrder(orderId: string, amount?: number) {
  const { data, error } = await supabase.rpc('carrtell_apply_wallet_to_order', { p_order_id: orderId, p_requested: amount || null });
  if (error) throw error;
  return data as { order: { id: string; total_amount: number; payment_status?: string; status?: string }; wallet_balance: number; applied: number; remaining: number };
}

export async function addWalletTransaction(input: {
  user_id: string;
  wallet_id?: string;
  type: string;
  title: string;
  description?: string;
  points_delta?: number;
  credit_delta?: number;
  order_id?: string;
  reward_key?: string;
}) {
  const { data, error } = await supabase.from('wallet_transactions').insert(input).select('*').single();
  if (error) throw error;

  const settings = await getLoyaltySettings();
  const walletRes = await supabase.from('customer_wallets').select('*').eq('user_id', input.user_id).maybeSingle();
  if (walletRes.data) {
    const newPoints = Math.max(0, Number(walletRes.data.points || 0) + Number(input.points_delta || 0));
    const newCredit = Math.max(0, Number(walletRes.data.credit_toman || 0) + Number(input.credit_delta || 0));
    await supabase.from('customer_wallets').update({
      points: newPoints,
      credit_toman: newCredit,
      tier: calculateTier(newPoints, settings),
      updated_at: new Date().toISOString(),
    }).eq('id', walletRes.data.id);
  }
  return data as WalletTransaction;
}

export async function rewardPaidOrder(userId: string, orderId: string, totalToman: number) {
  const settings = await getLoyaltySettings();
  if (!settings.is_enabled) return null;
  const wallet = await getOrCreateMyWallet();
  const points = Math.floor(Number(totalToman || 0) * Number(settings.purchase_point_rate || 0));
  if (points <= 0) return null;
  return addWalletTransaction({
    user_id: userId,
    wallet_id: wallet.id,
    type: 'purchase_reward',
    title: 'امتیاز خرید',
    description: `امتیاز بابت سفارش ${orderId}`,
    points_delta: points,
    credit_delta: 0,
    order_id: orderId,
  });
}

export async function rewardActivity(input: { userId: string; type: 'review'|'review_photo'|'health_record'|'referral'|'package_purchase'|'first_onsite_service'; rewardKey: string; title?: string; description?: string }) {
  const settings = await getLoyaltySettings();
  if (!settings.is_enabled) return null;
  const map = { review: settings.review_points, review_photo: settings.review_photo_points, health_record: settings.health_record_points, referral: settings.referral_points, package_purchase: settings.package_purchase_points, first_onsite_service: settings.first_onsite_service_points };
  const points = Number(map[input.type] || 0);
  if (points <= 0) return null;
  const wallet = await getOrCreateMyWallet();
  const exists = await supabase.from('wallet_transactions').select('id').eq('user_id', input.userId).eq('reward_key', input.rewardKey).maybeSingle();
  if (exists.data) return exists.data;
  return addWalletTransaction({ user_id: input.userId, wallet_id: wallet.id, type: input.type, title: input.title || 'امتیاز فعالیت', description: input.description, points_delta: points, credit_delta: 0, reward_key: input.rewardKey } as any);
}
