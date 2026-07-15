import { supabase } from '../../lib/supabase';
import type { SupportTicket } from '../../services/supportApi';

export async function getAllSupportTickets(status?: string) {
  let q = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SupportTicket[];
}
