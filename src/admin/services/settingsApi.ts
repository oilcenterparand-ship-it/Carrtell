import { supabase } from '../../lib/supabase';

export type BrandSettings = {
  name: string;
  persianName: string;
  slogan: string;
  phone: string;
  email: string;
  logo: string;
};

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headerBackground: string;
  footerBackground: string;
  cardBackground: string;
  cardImageBackground: string;
  productInfoBackground: string;
  productPriceColor: string;
  addButtonBackground: string;
  packageBackground: string;
  packageCardBackground: string;
  packageIconBackground: string;
  packageTextColor: string;
  quickAccessBackground: string;
  quickAccessButtonBackground: string;
  quickAccessSecondaryButtonBackground: string;
  categorySectionBackground: string;
  categoryIconBackground: string;
  categoryTextColor: string;
  amazingBackground: string;
  amazingCardBackground: string;
  amazingTimerBackground: string;
  amazingTimerTextColor: string;
  amazingBadgeBackground: string;
  tabSectionBackground: string;
  tabActiveColor: string;
  productListBackground: string;
  searchBackground: string;
  carFilterButtonBackground: string;
  sectionBorderColor: string;
  cardBorderColor: string;
  categoryCardBackground: string;
  categoryCardHoverBackground: string;
  categoryCardActiveBackground: string;
  categoryCardActiveTextColor: string;
  quickAccessTextColor: string;
  amazingTextColor: string;
  tabInactiveBackground: string;
  tabInactiveTextColor: string;
  packageBadgeBackground: string;
  productFilterBackground: string;
  productFilterTextColor: string;
  fontFamily: string;
  headerFontFamily: string;
  quickAccessFontFamily: string;
  categoryFontFamily: string;
  amazingFontFamily: string;
  productCardFontFamily: string;
  packageFontFamily: string;
  tabFontFamily: string;
  footerFontFamily: string;
  adminPanelFontFamily: string;
  borderRadius: string;
  themePreset: string;
};

export const defaultThemeSettings: ThemeSettings = {
  primaryColor: '#facc15',
  secondaryColor: '#db2777',
  backgroundColor: '#0f172a',
  surfaceColor: '#111827',
  textColor: '#f8fafc',
  mutedTextColor: '#94a3b8',
  headerBackground: '#020617',
  footerBackground: '#020617',
  cardBackground: '#111827',
  cardImageBackground: '#0f172a',
  productInfoBackground: '#111827',
  productPriceColor: '#f8fafc',
  addButtonBackground: '#facc15',
  packageBackground: '#0f172a',
  packageCardBackground: '#111827',
  packageIconBackground: '#1f2937',
  packageTextColor: '#f8fafc',
  quickAccessBackground: '#111827',
  quickAccessButtonBackground: '#facc15',
  quickAccessSecondaryButtonBackground: '#334155',
  categorySectionBackground: '#0f172a',
  categoryIconBackground: '#1f2937',
  categoryTextColor: '#f8fafc',
  amazingBackground: '#db2777',
  amazingCardBackground: '#111827',
  amazingTimerBackground: '#020617',
  amazingTimerTextColor: '#f8fafc',
  amazingBadgeBackground: '#db2777',
  tabSectionBackground: '#111827',
  tabActiveColor: '#facc15',
  productListBackground: '#0f172a',
  searchBackground: '#020617',
  carFilterButtonBackground: '#facc15',
  sectionBorderColor: '#334155',
  cardBorderColor: '#334155',
  categoryCardBackground: '#111827',
  categoryCardHoverBackground: '#1f2937',
  categoryCardActiveBackground: '#3b2f0a',
  categoryCardActiveTextColor: '#facc15',
  quickAccessTextColor: '#f8fafc',
  amazingTextColor: '#ffffff',
  tabInactiveBackground: '#1f2937',
  tabInactiveTextColor: '#cbd5e1',
  packageBadgeBackground: '#020617',
  productFilterBackground: '#020617',
  productFilterTextColor: '#f8fafc',
  fontFamily: 'Vazirmatn, system-ui, sans-serif',
  headerFontFamily: 'Vazirmatn, system-ui, sans-serif',
  quickAccessFontFamily: 'Vazirmatn, system-ui, sans-serif',
  categoryFontFamily: 'Vazirmatn, system-ui, sans-serif',
  amazingFontFamily: 'Vazirmatn, system-ui, sans-serif',
  productCardFontFamily: 'Vazirmatn, system-ui, sans-serif',
  packageFontFamily: 'Vazirmatn, system-ui, sans-serif',
  tabFontFamily: 'Vazirmatn, system-ui, sans-serif',
  footerFontFamily: 'Vazirmatn, system-ui, sans-serif',
  adminPanelFontFamily: 'Vazirmatn, system-ui, sans-serif',
  borderRadius: '24px',
  themePreset: 'carrtell-dark-gold',
};

export type AdminSettingsGroup =
  | 'site'
  | 'theme'
  | 'sms'
  | 'payment'
  | 'service'
  | 'map'
  | 'orders';

export type AdminSetting = {
  id?: string;
  group_key: AdminSettingsGroup | string;
  setting_key: string;
  setting_value: any;
  title?: string | null;
  description?: string | null;
  is_public?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminSettingsMap = Record<string, Record<string, any>>;

export const DEFAULT_ADMIN_SETTINGS: AdminSettingsMap = {
  site: {
    brand_name: 'Carrtell',
    brand_name_fa: 'کارتل',
    support_phone: '',
    support_whatsapp: '',
    home_notice: '',
  },
  theme: {
    primary_color: defaultThemeSettings.primaryColor,
    background_mode: 'dark',
    font_family: 'Vazirmatn',
    card_radius: '24',
  },
  sms: {
    enabled: false,
    provider: 'demo',
    sender_number: '',
    api_key: '',
    order_created_template: 'سفارش شما با کد {{orderId}} ثبت شد.',
    order_status_template: 'وضعیت سفارش شما: {{status}}',
    review_template: 'لطفاً نظر خود را درباره سفارش {{orderId}} ثبت کنید: {{link}}',
  },
  payment: {
    gateway: 'test',
    test_mode: true,
    zarinpal_merchant_id: '',
    callback_path: '/payment/callback',
  },
  service: {
    enabled: true,
    base_service_fee: '0',
    price_per_km: '0',
    default_oil_interval_km: '7000',
    service_areas: 'پرند، تهران، اسلامشهر، چهاردانگه',
  },
  map: {
    provider: 'neshan',
    neshan_api_key: '',
    default_lat: '35.4897',
    default_lng: '51.0829',
    enabled: false,
  },
  orders: {
    default_status_after_submit: 'pending_payment',
    default_status_after_payment: 'paid',
    default_status_after_admin_confirm: 'processing',
    allow_review_after_status: 'delivered',
  },
};

async function getSetting<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.warn(`site_settings.${key} is not ready`, error.message);
    return null;
  }

  return (data?.value as T) || null;
}

async function upsertSetting(key: string, value: unknown) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select();

  if (error) throw error;
  return data;
}

export async function getBrandSettings() {
  return getSetting<BrandSettings>('brand');
}

export async function updateBrandSettings(value: unknown) {
  return upsertSetting('brand', value);
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  const value = await getSetting<Partial<ThemeSettings>>('theme');
  return {
    ...defaultThemeSettings,
    ...(value || {}),
  };
}

export async function updateThemeSettings(value: ThemeSettings) {
  return upsertSetting('theme', value);
}

export async function getAdminSettings(): Promise<AdminSettingsMap> {
  const result: AdminSettingsMap = JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));

  const { data, error } = await supabase
    .from('app_settings')
    .select('group_key, setting_key, setting_value')
    .order('group_key', { ascending: true });

  if (error) {
    console.warn('app_settings table is not ready. Run docs/sql/2026_admin_settings_hub.sql', error.message);
    return result;
  }

  for (const item of data ?? []) {
    if (!result[item.group_key]) result[item.group_key] = {};
    result[item.group_key][item.setting_key] = item.setting_value;
  }

  return result;
}

export async function saveAdminSettings(settings: AdminSettingsMap) {
  const rows: AdminSetting[] = [];

  Object.entries(settings).forEach(([group_key, group]) => {
    Object.entries(group ?? {}).forEach(([setting_key, setting_value]) => {
      rows.push({
        group_key,
        setting_key,
        setting_value,
        is_public: ['site', 'theme', 'map'].includes(group_key),
      });
    });
  });

  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'group_key,setting_key' });

  if (error) throw error;
  return true;
}
