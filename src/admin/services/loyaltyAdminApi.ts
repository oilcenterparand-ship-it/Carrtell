import { supabase } from '../../lib/supabase';
import { LoyaltySettings, upsertLoyaltySettings } from '../../services/loyaltyApi';

export async function getAdminLoyaltyOverview() {
  const [wallets, tx, settings] = await Promise.all([
    supabase.from('customer_wallets').select('*').order('created_at', { ascending: false }),
    supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('loyalty_settings').select('*').eq('id', 'default').maybeSingle(),
  ]);
  if (wallets.error) throw wallets.error;
  if (tx.error) throw tx.error;
  if (settings.error) throw settings.error;
  return { wallets: wallets.data || [], transactions: tx.data || [], settings: settings.data as LoyaltySettings | null };
}

export async function saveAdminLoyaltySettings(settings: Partial<LoyaltySettings>) {
  return upsertLoyaltySettings(settings);
}

export async function adjustWallet(input: { wallet_id: string; user_id?: string; points_delta?: number; credit_delta?: number; title?: string }) {
  const { data, error } = await supabase.rpc('carrtell_admin_adjust_wallet', {
    p_wallet_id: input.wallet_id,
    p_points_delta: Number(input.points_delta || 0),
    p_credit_delta: Number(input.credit_delta || 0),
    p_title: input.title || 'تنظیم دستی مدیر',
  });
  if (error) throw error;
  return data;
}
