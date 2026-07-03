import { supabase } from '../../lib/supabase';

export async function getBrandSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'brand')
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data?.value;
}


export async function updateBrandSettings(value: unknown) {
  const { data, error } = await supabase
    .from('site_settings')
    .update({
      value: value,
      updated_at: new Date().toISOString(),
    })
    .eq('key', 'brand')
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}