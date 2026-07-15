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
  const walletRes = await supabase.from('customer_wallets').select('*').eq('id', input.wallet_id).single();
  if (walletRes.error) throw walletRes.error;
  const wallet = walletRes.data;
  const newPoints = Math.max(0, Number(wallet.points || 0) + Number(input.points_delta || 0));
  const newCredit = Math.max(0, Number(wallet.credit_toman || 0) + Number(input.credit_delta || 0));

  const upd = await supabase.from('customer_wallets').update({
    points: newPoints,
    credit_toman: newCredit,
    updated_at: new Date().toISOString(),
  }).eq('id', input.wallet_id).select('*').single();
  if (upd.error) throw upd.error;

  await supabase.from('wallet_transactions').insert({
    wallet_id: input.wallet_id,
    user_id: input.user_id || wallet.user_id,
    type: 'manual_admin',
    title: input.title || 'تنظیم دستی مدیر',
    points_delta: input.points_delta || 0,
    credit_delta: input.credit_delta || 0,
  });

  return upd.data;
}
