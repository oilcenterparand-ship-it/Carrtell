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

export type MegaMenuPromotion = {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  button_text: string;
  image_url?: string;
  link_url: string;
  is_active: boolean;
  updated_at?: string;
};

export type MegaMenuTile = {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image_url?: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const defaultMegaMenuTiles: MegaMenuTile[] = [
  { title: 'محصولات نظافت خودرویی', subtitle: 'درخشش و مراقبت حرفه‌ای', badge: 'تمیزی', image_url: '/images/mega-menu/car-cleaning.webp', link_url: '/shop?q=نظافت', sort_order: 1, is_active: true },
  { title: 'فروش ویژه مکمل‌های سوخت', subtitle: 'توان بیشتر، مصرف بهتر', badge: 'فروش ویژه', image_url: '/images/mega-menu/fuel-additives.webp', link_url: '/shop?q=مکمل%20سوخت', sort_order: 2, is_active: true },
  { title: 'پکیج‌های تعویض روغن اقتصادی و به‌صرفه', subtitle: 'انتخاب کامل برای سرویس دوره‌ای', badge: 'اقتصادی', image_url: '/images/mega-menu/economy-oil-change.webp', link_url: '/?quick=packages', sort_order: 3, is_active: true },
  { title: 'محصولات تزئینی خودرو', subtitle: 'جزئیات متفاوت برای خودرو', badge: 'خاص', image_url: '/images/mega-menu/car-accessories.webp', link_url: '/shop?q=تزئینی', sort_order: 4, is_active: true },
];

export const defaultMegaMenuPromotion: MegaMenuPromotion = {
  title: 'ویژه صنایع و ناوگان سنگین',
  subtitle: 'روغن و فیلتر صنعتی با بسته‌بندی عمده',
  badge: 'فروش عمده',
  button_text: 'مشاهده محصولات',
  image_url: '',
  link_url: '/industrial',
  is_active: true,
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

export async function getMegaMenuPromotion() {
  const { data, error } = await supabase.from('mega_menu_promotions').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.warn('mega_menu_promotions not ready, using fallback', error);
    return defaultMegaMenuPromotion;
  }
  return { ...defaultMegaMenuPromotion, ...(data || {}) } as MegaMenuPromotion;
}

export async function saveMegaMenuPromotion(promotion: MegaMenuPromotion) {
  const payload = {
    title: promotion.title.trim(),
    subtitle: promotion.subtitle?.trim() || '',
    badge: promotion.badge?.trim() || '',
    button_text: promotion.button_text.trim() || 'مشاهده محصولات',
    image_url: promotion.image_url?.trim() || '',
    link_url: promotion.link_url.trim() || '/shop',
    is_active: promotion.is_active !== false,
    updated_at: new Date().toISOString(),
  };
  const query = promotion.id
    ? supabase.from('mega_menu_promotions').update(payload).eq('id', promotion.id)
    : supabase.from('mega_menu_promotions').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as MegaMenuPromotion;
}

export async function getMegaMenuTiles() {
  const { data, error } = await supabase
    .from('mega_menu_tiles')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('mega_menu_tiles not ready, using fallback', error);
    return defaultMegaMenuTiles;
  }
  const tiles = (data || []) as MegaMenuTile[];
  return tiles.length ? tiles : defaultMegaMenuTiles;
}

function cleanMegaMenuTile(tile: MegaMenuTile) {
  return {
    title: tile.title.trim(),
    subtitle: tile.subtitle?.trim() || '',
    badge: tile.badge?.trim() || '',
    image_url: tile.image_url?.trim() || '',
    link_url: tile.link_url.trim() || '/shop',
    sort_order: Number(tile.sort_order || 0),
    is_active: tile.is_active !== false,
    updated_at: new Date().toISOString(),
  };
}

export async function createMegaMenuTile(tile: MegaMenuTile) {
  const { data, error } = await supabase.from('mega_menu_tiles').insert(cleanMegaMenuTile(tile)).select().single();
  if (error) throw error;
  return data as MegaMenuTile;
}

export async function updateMegaMenuTile(id: string, tile: MegaMenuTile) {
  const { data, error } = await supabase.from('mega_menu_tiles').update(cleanMegaMenuTile(tile)).eq('id', id).select().single();
  if (error) throw error;
  return data as MegaMenuTile;
}

export async function deleteMegaMenuTile(id: string) {
  const { error } = await supabase.from('mega_menu_tiles').delete().eq('id', id);
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
