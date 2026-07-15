import { supabase } from '../lib/supabase';

export type ReturnStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'refunded' | 'replaced' | 'closed';

export type ReturnRequest = {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  order_item_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  reason: string;
  description?: string | null;
  status: ReturnStatus;
  admin_note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AuthenticityCode = {
  id: string;
  code: string;
  product_id?: string | null;
  product_name?: string | null;
  order_id?: string | null;
  status: 'valid' | 'used' | 'blocked' | 'needs_review';
  checked_count?: number;
  last_checked_at?: string | null;
  created_at?: string;
};

export async function createReturnRequest(input: Partial<ReturnRequest>) {
  const { data, error } = await supabase
    .from('return_requests')
    .insert({ ...input, status: input.status ?? 'pending' })
    .select('*')
    .single();
  if (error) throw error;
  return data as ReturnRequest;
}

export async function getMyReturnRequests(userId?: string) {
  let query = supabase.from('return_requests').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ReturnRequest[];
}

export async function getAllReturnRequests() {
  const { data, error } = await supabase
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReturnRequest[];
}

export async function updateReturnRequestStatus(id: string, status: ReturnStatus, admin_note?: string) {
  const { data, error } = await supabase
    .from('return_requests')
    .update({ status, admin_note, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ReturnRequest;
}

export async function checkAuthenticityCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('product_authenticity_codes')
    .select('*')
    .eq('code', normalized)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  await supabase
    .from('product_authenticity_codes')
    .update({
      checked_count: (data.checked_count ?? 0) + 1,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return data as AuthenticityCode;
}

export async function getAuthenticityCodes() {
  const { data, error } = await supabase
    .from('product_authenticity_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AuthenticityCode[];
}

export async function createAuthenticityCode(input: Partial<AuthenticityCode>) {
  const code = (input.code || `CART-${Math.random().toString(36).slice(2, 10)}`).toUpperCase();
  const { data, error } = await supabase
    .from('product_authenticity_codes')
    .insert({ ...input, code, status: input.status ?? 'valid' })
    .select('*')
    .single();
  if (error) throw error;
  return data as AuthenticityCode;
}

export async function updateAuthenticityCodeStatus(id: string, status: AuthenticityCode['status']) {
  const { data, error } = await supabase
    .from('product_authenticity_codes')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as AuthenticityCode;
}
