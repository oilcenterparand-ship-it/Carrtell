import { supabase } from '../../lib/supabase';

export type SettingGroup =
  | 'store'
  | 'service'
  | 'orders'
  | 'sms'
  | 'map'
  | 'appearance'
  | 'payment'
  | 'notifications';

export type SystemSetting = {
  id?: string;
  group_key: SettingGroup | string;
  setting_key: string;
  setting_value: any;
  label?: string | null;
  description?: string | null;
  updated_at?: string;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSetting[] = [
  { group_key: 'store', setting_key: 'brand_name', label: 'نام برند', setting_value: 'Carrtell / کارتل' },
  { group_key: 'store', setting_key: 'support_phone', label: 'شماره پشتیبانی', setting_value: '' },
  { group_key: 'store', setting_key: 'working_hours', label: 'ساعات کاری', setting_value: '۹ صبح تا ۹ شب' },
  { group_key: 'store', setting_key: 'is_open', label: 'وضعیت فعالیت', setting_value: true },
  { group_key: 'service', setting_key: 'base_dispatch_fee', label: 'هزینه پایه اعزام', setting_value: 0 },
  { group_key: 'service', setting_key: 'price_per_km', label: 'هزینه هر کیلومتر', setting_value: 0 },
  { group_key: 'service', setting_key: 'service_areas', label: 'محدوده سرویس', setting_value: 'پرند، تهران، اسلامشهر، چهاردانگه' },
  { group_key: 'orders', setting_key: 'minimum_order_amount', label: 'حداقل مبلغ سفارش', setting_value: 0 },
  { group_key: 'orders', setting_key: 'tax_percent', label: 'درصد مالیات', setting_value: 0 },
  { group_key: 'orders', setting_key: 'service_fee', label: 'هزینه خدمات', setting_value: 0 },
  { group_key: 'sms', setting_key: 'sms_enabled', label: 'فعال بودن پیامک', setting_value: false },
  { group_key: 'sms', setting_key: 'provider', label: 'سرویس‌دهنده پیامک', setting_value: 'disabled' },
  { group_key: 'map', setting_key: 'neshan_api_key', label: 'کلید API نشان', setting_value: '' },
  { group_key: 'map', setting_key: 'warehouse_lat', label: 'عرض جغرافیایی انبار', setting_value: '' },
  { group_key: 'map', setting_key: 'warehouse_lng', label: 'طول جغرافیایی انبار', setting_value: '' },
  { group_key: 'appearance', setting_key: 'primary_color', label: 'رنگ اصلی', setting_value: '#f5c542' },
  { group_key: 'appearance', setting_key: 'dark_mode', label: 'تم تیره', setting_value: true },
];

export async function getSystemSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('group_key', { ascending: true })
    .order('setting_key', { ascending: true });

  if (error) {
    console.warn('system_settings table is not ready yet:', error.message);
    return DEFAULT_SYSTEM_SETTINGS;
  }

  return data?.length ? data : DEFAULT_SYSTEM_SETTINGS;
}

export async function upsertSystemSetting(setting: SystemSetting) {
  const payload = {
    group_key: setting.group_key,
    setting_key: setting.setting_key,
    setting_value: setting.setting_value,
    label: setting.label ?? null,
    description: setting.description ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('system_settings')
    .upsert(payload, { onConflict: 'group_key,setting_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertManySystemSettings(settings: SystemSetting[]) {
  const payload = settings.map((setting) => ({
    group_key: setting.group_key,
    setting_key: setting.setting_key,
    setting_value: setting.setting_value,
    label: setting.label ?? null,
    description: setting.description ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('system_settings')
    .upsert(payload, { onConflict: 'group_key,setting_key' })
    .select();

  if (error) throw error;
  return data ?? [];
}
