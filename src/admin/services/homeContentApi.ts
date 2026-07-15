import { supabase } from '../../lib/supabase';

export type HomeBanner = {
  id?: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  badge?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type HomeSectionSource = 'featured' | 'best_seller' | 'latest' | 'category';

export type HomeSection = {
  id?: string;
  title: string;
  subtitle?: string;
  slug: string;
  source_type: HomeSectionSource;
  category_slug?: string;
  badge?: string;
  show_timer?: boolean;
  ends_at?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

const fallbackBanners: HomeBanner[] = [
  {
    title: 'سرویس خودرو با بهترین قیمت',
    subtitle: 'روغن، فیلتر و پکیج‌های آماده Carrtell',
    badge: 'پیشنهاد امروز',
    link_url: '/shop',
    image_url: '',
    sort_order: 1,
    is_active: true,
  },
];

const fallbackSections: HomeSection[] = [
  { title: 'پیشنهاد شگفت‌انگیز', subtitle: 'منتخب‌های ویژه امروز', slug: 'amazing', source_type: 'featured', show_timer: true, sort_order: 1, is_active: true },
  { title: 'پرفروش‌ها', subtitle: 'محصولات پرفروش فروشگاه', slug: 'best-sellers', source_type: 'best_seller', sort_order: 2, is_active: true },
  { title: 'جدیدترین‌ها', subtitle: 'آخرین محصولات اضافه‌شده', slug: 'latest', source_type: 'latest', sort_order: 3, is_active: true },
];

function cleanHomeSectionPayload(section: Partial<HomeSection>) {
  const { id, created_at, ...payload } = section;
  const cleaned: Record<string, unknown> = {
    ...payload,
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active !== false,
    show_timer: payload.show_timer === true,
    category_slug: payload.source_type === 'category' ? (payload.category_slug || '') : '',
    ends_at: payload.show_timer === true && payload.ends_at ? payload.ends_at : null,
  };

  return cleaned;
}


export async function getHomeBanners() {
  const { data, error } = await supabase
    .from('homepage_banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('homepage_banners not ready, using fallback', error);
    return fallbackBanners;
  }

  const banners = (data || []) as HomeBanner[];
  return banners.length ? banners : fallbackBanners;
}

export async function createHomeBanner(banner: HomeBanner) {
  const { id, created_at, ...payload } = banner;
  const { data, error } = await supabase.from('homepage_banners').insert({
    ...payload,
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active !== false,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateHomeBanner(id: string, banner: Partial<HomeBanner>) {
  const { id: _id, created_at, ...payload } = banner;
  const { data, error } = await supabase.from('homepage_banners').update({
    ...payload,
    ...(payload.sort_order !== undefined ? { sort_order: Number(payload.sort_order || 0) } : {}),
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHomeBanner(id: string) {
  const { error } = await supabase.from('homepage_banners').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getHomeSections() {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('homepage_sections not ready, using fallback', error);
    return fallbackSections;
  }

  const sections = (data || []) as HomeSection[];
  return sections.length ? sections : fallbackSections;
}

export async function createHomeSection(section: HomeSection) {
  const payload = cleanHomeSectionPayload(section);
  const { data, error } = await supabase
    .from('homepage_sections')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHomeSection(id: string, section: Partial<HomeSection>) {
  const payload = cleanHomeSectionPayload(section);
  const { data, error } = await supabase
    .from('homepage_sections')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHomeSection(id: string) {
  const { error } = await supabase.from('homepage_sections').delete().eq('id', id);
  if (error) throw error;
  return true;
}


export type TodayShoppingSettings = {
  title: string;
  subtitle?: string;
};

export const defaultTodayShoppingSettings: TodayShoppingSettings = {
  title: 'امروز چی بخریم؟',
  subtitle: 'دسته‌های پیشنهادی برای خرید سریع‌تر',
};

export async function getTodayShoppingSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'today_shopping')
    .maybeSingle();

  if (error) {
    console.warn('today_shopping settings not ready, using fallback', error);
    return defaultTodayShoppingSettings;
  }

  return {
    ...defaultTodayShoppingSettings,
    ...((data?.value as Partial<TodayShoppingSettings>) || {}),
  };
}

export async function updateTodayShoppingSettings(value: TodayShoppingSettings) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'today_shopping',
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
