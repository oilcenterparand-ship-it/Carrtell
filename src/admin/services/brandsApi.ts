import { supabase } from '../../lib/supabase';

export type Brand = {
  id?: string;
  name: string;
  slug?: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};

function makeSlug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-آ-ی]/gi, '') || `brand-${Date.now()}`;
}

function cleanBrand(brand: Brand) {
  return {
    name: brand.name,
    slug: brand.slug?.trim() || makeSlug(brand.name),
    logo_url: brand.logo_url || '',
    banner_url: brand.banner_url || '',
    description: brand.description || '',
    sort_order: Number(brand.sort_order || 0),
    is_active: brand.is_active !== false,
  };
}

export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Brand[];
}

export async function createBrand(brand: Brand) {
  const { data, error } = await supabase
    .from('brands')
    .insert(cleanBrand(brand))
    .select()
    .single();

  if (error) throw error;
  return data as Brand;
}

export async function updateBrand(id: string, brand: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .update(cleanBrand({ name: brand.name || '', ...brand } as Brand))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Brand;
}

export async function deleteBrand(id: string) {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
  return true;
}
