import { supabase } from '../../lib/supabase';

export type CustomerTag = { id: string; title: string; color?: string };
export type CustomerNote = { id: string; user_id: string; note: string; created_at?: string };

export async function getCrmCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getCustomerTags(): Promise<CustomerTag[]> {
  const { data, error } = await supabase.from('customer_tags').select('*').order('title');
  if (error) return [];
  return data ?? [];
}

export async function createCustomerTag(title: string, color = '#f59e0b') {
  const { data, error } = await supabase.from('customer_tags').insert({ title, color }).select().single();
  if (error) throw error;
  return data;
}

export async function getCustomerNotes(userId: string): Promise<CustomerNote[]> {
  const { data, error } = await supabase
    .from('customer_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function addCustomerNote(userId: string, note: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('customer_notes')
    .insert({ user_id: userId, note, created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function exportCustomersCsv(customers: any[]) {
  const header = ['name','phone','role','created_at'];
  const rows = customers.map((c) => [c.full_name ?? '', c.phone ?? '', c.role ?? '', c.created_at ?? '']);
  const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'carrtell-customers.csv';
  a.click();
  URL.revokeObjectURL(url);
}
