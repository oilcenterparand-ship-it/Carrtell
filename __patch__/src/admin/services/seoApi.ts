import { supabase } from '../../lib/supabase';

export type SeoMeta = {
  id?: string;
  path: string;
  title: string;
  description?: string | null;
  keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const defaultSeoMeta: SeoMeta = {
  path: '/',
  title: 'Carrtell | فروشگاه تخصصی محصولات خودرو و سرویس در محل',
  description: 'کارتل؛ خرید محصولات خودرو، انتخاب روغن و فیلتر مناسب خودرو، رزرو سرویس در محل و پیگیری سرویس کیلومتری.',
  keywords: 'کارتل,Carrtell,روغن موتور,فیلتر خودرو,سرویس در محل,تعویض روغن',
  is_active: true,
};

export async function getSeoMetas() {
  const { data, error } = await supabase
    .from('seo_meta')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as SeoMeta[];
}

export async function getSeoMetaByPath(path: string) {
  const { data, error } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('path', path)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as SeoMeta | null) ?? null;
}

export async function upsertSeoMeta(meta: SeoMeta) {
  const payload = {
    ...meta,
    path: meta.path || '/',
    title: meta.title || defaultSeoMeta.title,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('seo_meta')
    .upsert(payload, { onConflict: 'path' })
    .select('*')
    .single();
  if (error) throw error;
  return data as SeoMeta;
}

export async function deleteSeoMeta(id: string) {
  const { error } = await supabase.from('seo_meta').delete().eq('id', id);
  if (error) throw error;
}
