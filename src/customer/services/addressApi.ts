import { supabase } from '../../lib/supabase';

export type CustomerAddress = {
  id?: string;
  customer_phone: string;
  title: string;
  province?: string | null;
  city: string;
  district?: string | null;
  street?: string | null;
  plaque?: string | null;
  unit?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
  created_at?: string;
};

const LOCAL_KEY = 'carrtell:customer-addresses';
function readLocal(): CustomerAddress[] { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } }
function writeLocal(items: CustomerAddress[]) { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); }

export function formatCustomerAddress(address?: CustomerAddress | null) {
  if (!address) return '';
  return [address.title, address.province, address.city, address.district, address.street, address.plaque ? `پلاک ${address.plaque}` : '', address.unit ? `واحد ${address.unit}` : '']
    .filter(Boolean)
    .join('، ');
}

export async function getCustomerAddresses(phone: string): Promise<CustomerAddress[]> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_phone', cleanPhone)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (!error) return data || [];
  return readLocal().filter((item) => item.customer_phone === cleanPhone);
}

export async function saveCustomerAddress(address: CustomerAddress): Promise<CustomerAddress> {
  const payload = { ...address, customer_phone: address.customer_phone.trim(), title: address.title || 'آدرس منتخب' };
  if (!payload.customer_phone) throw new Error('شماره موبایل مشتری الزامی است');
  if (payload.id) {
    const { data, error } = await supabase.from('customer_addresses').update(payload).eq('id', payload.id).select('*').single();
    if (!error && data) return data;
  } else {
    const { data, error } = await supabase.from('customer_addresses').insert(payload).select('*').single();
    if (!error && data) return data;
  }
  const local = readLocal();
  const saved = { ...payload, id: payload.id || crypto.randomUUID() };
  writeLocal(payload.id ? local.map((item) => item.id === payload.id ? saved : item) : [saved, ...local]);
  return saved;
}

export async function deleteCustomerAddress(id: string) {
  await supabase.from('customer_addresses').delete().eq('id', id);
  writeLocal(readLocal().filter((item) => item.id !== id));
}
