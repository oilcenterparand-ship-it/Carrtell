import { supabase } from '../../lib/supabase';

export type OilSpecType = 'grade' | 'quality' | 'base';

export type OilSpec = {
  id?: string;
  type: OilSpecType;
  title: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function getOilSpecs(type?: OilSpecType) {
  let query = supabase
    .from('oil_specs')
    .select('*')
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as OilSpec[];
}

export async function createOilSpec(spec: OilSpec) {
  const { data, error } = await supabase
    .from('oil_specs')
    .insert({ ...spec, is_active: spec.is_active ?? true })
    .select()
    .single();

  if (error) throw error;
  return data as OilSpec;
}

export async function updateOilSpec(id: string, spec: Partial<OilSpec>) {
  const { data, error } = await supabase
    .from('oil_specs')
    .update(spec)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OilSpec;
}

export async function deleteOilSpec(id: string) {
  const { error } = await supabase.from('oil_specs').delete().eq('id', id);
  if (error) throw error;
  return true;
}
