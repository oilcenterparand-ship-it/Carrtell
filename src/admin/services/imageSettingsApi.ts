import { supabase } from '../../lib/supabase';
import type { WatermarkPosition } from '../../lib/smartImage';

export type WatermarkTarget = 'products' | 'banners' | 'categories' | 'packages' | 'brands';

export type WatermarkProfile = {
  id: string;
  name: string;
  textEnabled: boolean;
  logoEnabled: boolean;
  text: string;
  logoUrl: string;
  position: WatermarkPosition;
  opacity: number;
  textColor: string;
  textSize: number;
  logoSize: number;
};

export type ImageSettings = {
  enabled: boolean;
  activeProfileId: string;
  applyTo: Record<WatermarkTarget, boolean>;
  keepOriginal: boolean;
  profiles: WatermarkProfile[];
};

export const defaultWatermarkProfile: WatermarkProfile = {
  id: 'default-carrtell',
  name: 'پیش‌فرض Carrtell',
  textEnabled: true,
  logoEnabled: false,
  text: 'Carrtell.ir',
  logoUrl: '',
  position: 'bottom-right',
  opacity: 0.2,
  textColor: '#111827',
  textSize: 4.5,
  logoSize: 18,
};

export const defaultImageSettings: ImageSettings = {
  enabled: true,
  activeProfileId: defaultWatermarkProfile.id,
  keepOriginal: false,
  applyTo: {
    products: true,
    banners: false,
    categories: false,
    packages: false,
    brands: false,
  },
  profiles: [defaultWatermarkProfile],
};

function normalizeSettings(value?: Partial<ImageSettings> | null): ImageSettings {
  const profiles = Array.isArray(value?.profiles) && value?.profiles.length
    ? value.profiles.map((profile) => ({ ...defaultWatermarkProfile, ...profile }))
    : defaultImageSettings.profiles;

  const activeProfileId = value?.activeProfileId && profiles.some((profile) => profile.id === value.activeProfileId)
    ? value.activeProfileId
    : profiles[0].id;

  return {
    ...defaultImageSettings,
    ...(value || {}),
    activeProfileId,
    applyTo: {
      ...defaultImageSettings.applyTo,
      ...(value?.applyTo || {}),
    },
    profiles,
  };
}

export async function getImageSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'image_settings')
    .maybeSingle();

  if (error) throw error;
  return normalizeSettings(data?.value as Partial<ImageSettings> | null);
}

export async function updateImageSettings(value: ImageSettings) {
  const normalized = normalizeSettings(value);
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'image_settings',
        value: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select();

  if (error) throw error;
  return data;
}

export function getActiveWatermarkProfile(settings: ImageSettings) {
  return settings.profiles.find((profile) => profile.id === settings.activeProfileId) || settings.profiles[0] || defaultWatermarkProfile;
}
