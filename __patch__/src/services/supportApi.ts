import { supabase } from '../lib/supabase';

export type SupportTicket = {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  last_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_user_id?: string | null;
  sender_role: 'customer' | 'admin' | 'driver';
  body: string;
  created_at?: string;
};

export async function getMySupportTickets(userId?: string | null) {
  let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SupportTicket[];
}

export async function createSupportTicket(input: Partial<SupportTicket> & { message: string }) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id ?? input.user_id ?? null;
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      order_id: input.order_id ?? null,
      subject: input.subject,
      category: input.category ?? 'general',
      priority: input.priority ?? 'normal',
      status: 'open',
      customer_name: input.customer_name ?? null,
      customer_phone: input.customer_phone ?? null,
      last_message: input.message,
    })
    .select('*')
    .single();
  if (error) throw error;
  await addSupportMessage(data.id, input.message, 'customer');
  return data as SupportTicket;
}

export async function getSupportMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupportMessage[];
}

export async function addSupportMessage(ticketId: string, body: string, senderRole: 'customer' | 'admin' | 'driver' = 'customer') {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .insert({ ticket_id: ticketId, body, sender_role: senderRole, sender_user_id: userRes.user?.id ?? null })
    .select('*')
    .single();
  if (error) throw error;
  await supabase.from('support_tickets').update({ last_message: body, updated_at: new Date().toISOString(), status: senderRole === 'admin' ? 'answered' : 'open' }).eq('id', ticketId);
  return data as SupportMessage;
}

export async function updateSupportTicketStatus(ticketId: string, status: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select('*')
    .single();
  if (error) throw error;
  return data as SupportTicket;
}
