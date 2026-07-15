import { supabase } from '../../lib/supabase';

export type SmartSalesRule = {
  id?: string;
  title: string;
  rule_type?: 'manual' | 'category' | 'car' | string;
  source_product_id?: string | null;
  target_product_ids?: string[];
  category?: string | null;
  car_id?: string | null;
  is_active?: boolean;
  priority?: number;
};

export type SmartSalesSettings = {
  id?: string;
  enabled: boolean;
  show_in_cart: boolean;
  show_in_product: boolean;
  show_packages: boolean;
  only_in_stock: boolean;
  only_compatible_car: boolean;
  max_items: number;
};

export const defaultSmartSalesSettings: SmartSalesSettings = {
  id: 'default',
  enabled: true,
  show_in_cart: true,
  show_in_product: true,
  show_packages: true,
  only_in_stock: true,
  only_compatible_car: true,
  max_items: 6,
};

export async function getSmartSalesSettings(): Promise<SmartSalesSettings> {
  const { data, error } = await supabase.from('smart_sales_settings').select('*').eq('id', 'default').maybeSingle();
  if (error || !data) return defaultSmartSalesSettings;
  return { ...defaultSmartSalesSettings, ...data };
}

export async function saveSmartSalesSettings(settings: SmartSalesSettings) {
  const payload = { ...defaultSmartSalesSettings, ...settings, id: 'default', updated_at: new Date().toISOString() };
  const { error } = await supabase.from('smart_sales_settings').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  return payload;
}

export async function listSmartSalesRules(): Promise<SmartSalesRule[]> {
  const { data, error } = await supabase.from('smart_sales_rules').select('*').order('priority', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveSmartSalesRule(rule: SmartSalesRule) {
  const payload = { ...rule, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('smart_sales_rules').upsert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteSmartSalesRule(id: string) {
  const { error } = await supabase.from('smart_sales_rules').delete().eq('id', id);
  if (error) throw error;
}
