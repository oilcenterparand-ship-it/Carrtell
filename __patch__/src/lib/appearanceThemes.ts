export type CarrtellThemePresetId =
  | 'carrtell-classic'
  | 'premium-dark'
  | 'digikala-style'
  | 'auto-sport'
  | 'luxury'
  | 'eco-green';

export type CarrtellFontId =
  | 'vazirmatn'
  | 'iran-sans-style'
  | 'dana-style'
  | 'shabnam-style';

export type UserThemeMode = 'light' | 'dark' | 'system';

export interface CarrtellThemePreset {
  id: CarrtellThemePresetId;
  name: string;
  description: string;
  mode: 'light' | 'dark';
  cssVars: Record<string, string>;
}

export const carrtellThemePresets: CarrtellThemePreset[] = [
  {
    id: 'carrtell-classic',
    name: 'Carrtell Classic',
    description: 'روشن، فروشگاهی، خوانا؛ مناسب حالت اصلی کارتل',
    mode: 'light',
    cssVars: {
      '--ct-bg': '#f5f7fb',
      '--ct-surface': '#ffffff',
      '--ct-surface-2': '#f1f5f9',
      '--ct-text': '#111827',
      '--ct-muted': '#64748b',
      '--ct-border': '#e2e8f0',
      '--ct-primary': '#ef233c',
      '--ct-primary-text': '#ffffff',
      '--ct-accent': '#f59e0b',
      '--ct-header': 'rgba(255,255,255,.92)',
      '--ct-input-bg': '#ffffff',
      '--ct-input-text': '#111827'
    }
  },
  {
    id: 'premium-dark',
    name: 'Premium Dark',
    description: 'تیره، طلایی و پریمیوم؛ مناسب خدمات لوکس خودرو',
    mode: 'dark',
    cssVars: {
      '--ct-bg': '#09090b',
      '--ct-surface': '#15151a',
      '--ct-surface-2': '#202028',
      '--ct-text': '#f8fafc',
      '--ct-muted': '#cbd5e1',
      '--ct-border': '#2f2f38',
      '--ct-primary': '#f5b301',
      '--ct-primary-text': '#111827',
      '--ct-accent': '#f59e0b',
      '--ct-header': 'rgba(12,12,16,.92)',
      '--ct-input-bg': '#18181f',
      '--ct-input-text': '#f8fafc'
    }
  },
  {
    id: 'digikala-style',
    name: 'Digikala Style',
    description: 'سفید، قرمز و مینیمال؛ شبیه فروشگاه‌های بزرگ',
    mode: 'light',
    cssVars: {
      '--ct-bg': '#f6f6f8',
      '--ct-surface': '#ffffff',
      '--ct-surface-2': '#f2f4f7',
      '--ct-text': '#1f2937',
      '--ct-muted': '#6b7280',
      '--ct-border': '#e5e7eb',
      '--ct-primary': '#ef394e',
      '--ct-primary-text': '#ffffff',
      '--ct-accent': '#00bfd6',
      '--ct-header': 'rgba(255,255,255,.94)',
      '--ct-input-bg': '#ffffff',
      '--ct-input-text': '#111827'
    }
  },
  {
    id: 'auto-sport',
    name: 'Auto Sport',
    description: 'تیره، آبی و اسپرت؛ مناسب خودروهای جوان‌پسند',
    mode: 'dark',
    cssVars: {
      '--ct-bg': '#07111f',
      '--ct-surface': '#0f1b2d',
      '--ct-surface-2': '#16243a',
      '--ct-text': '#eef6ff',
      '--ct-muted': '#b8c7dc',
      '--ct-border': '#223452',
      '--ct-primary': '#38bdf8',
      '--ct-primary-text': '#06111f',
      '--ct-accent': '#60a5fa',
      '--ct-header': 'rgba(7,17,31,.92)',
      '--ct-input-bg': '#101d31',
      '--ct-input-text': '#eef6ff'
    }
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'کرم، مشکی و لوکس؛ مناسب برندینگ پریمیوم',
    mode: 'light',
    cssVars: {
      '--ct-bg': '#f7f1e8',
      '--ct-surface': '#fffaf3',
      '--ct-surface-2': '#eee2d0',
      '--ct-text': '#1c1917',
      '--ct-muted': '#75685b',
      '--ct-border': '#dfd0bd',
      '--ct-primary': '#1c1917',
      '--ct-primary-text': '#fff7ed',
      '--ct-accent': '#b45309',
      '--ct-header': 'rgba(255,250,243,.93)',
      '--ct-input-bg': '#fffaf3',
      '--ct-input-text': '#1c1917'
    }
  },
  {
    id: 'eco-green',
    name: 'Eco Green',
    description: 'سبز، روشن و قابل اعتماد؛ مناسب سرویس منظم و محیط‌زیست',
    mode: 'light',
    cssVars: {
      '--ct-bg': '#f0fdf4',
      '--ct-surface': '#ffffff',
      '--ct-surface-2': '#dcfce7',
      '--ct-text': '#052e16',
      '--ct-muted': '#166534',
      '--ct-border': '#bbf7d0',
      '--ct-primary': '#16a34a',
      '--ct-primary-text': '#ffffff',
      '--ct-accent': '#65a30d',
      '--ct-header': 'rgba(255,255,255,.92)',
      '--ct-input-bg': '#ffffff',
      '--ct-input-text': '#052e16'
    }
  }
];

export const carrtellFonts: { id: CarrtellFontId; name: string; cssFamily: string }[] = [
  { id: 'vazirmatn', name: 'Vazirmatn', cssFamily: "Vazirmatn, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: 'iran-sans-style', name: 'IRANSans Style', cssFamily: "Vazirmatn, Tahoma, Arial, sans-serif" },
  { id: 'dana-style', name: 'Dana Style', cssFamily: "Vazirmatn, 'Segoe UI', Tahoma, sans-serif" },
  { id: 'shabnam-style', name: 'Shabnam Style', cssFamily: "Vazirmatn, Arial, sans-serif" }
];

export const CARRTELL_APPEARANCE_STORAGE_KEY = 'carrtell:appearance';
export const CARRTELL_USER_THEME_MODE_KEY = 'carrtell:user-theme-mode';

export function getDefaultAppearance() {
  return {
    presetId: 'premium-dark' as CarrtellThemePresetId,
    fontId: 'vazirmatn' as CarrtellFontId,
    userMode: 'system' as UserThemeMode
  };
}

export function applyCarrtellAppearance(next = getDefaultAppearance()) {
  if (typeof document === 'undefined') return;
  const preset = carrtellThemePresets.find((item) => item.id === next.presetId) ?? carrtellThemePresets[1];
  const font = carrtellFonts.find((item) => item.id === next.fontId) ?? carrtellFonts[0];
  const root = document.documentElement;
  Object.entries(preset.cssVars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.style.setProperty('--ct-font-family', font.cssFamily);
  root.dataset.ctThemePreset = preset.id;
  root.dataset.ctThemeBase = preset.mode;
  root.dataset.ctUserMode = next.userMode;
  root.classList.add('ct-theme-ready');
}

export function loadCarrtellAppearance() {
  if (typeof localStorage === 'undefined') return getDefaultAppearance();
  try {
    const saved = localStorage.getItem(CARRTELL_APPEARANCE_STORAGE_KEY);
    return saved ? { ...getDefaultAppearance(), ...JSON.parse(saved) } : getDefaultAppearance();
  } catch {
    return getDefaultAppearance();
  }
}

export function saveCarrtellAppearance(next: ReturnType<typeof getDefaultAppearance>) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CARRTELL_APPEARANCE_STORAGE_KEY, JSON.stringify(next));
  }
  applyCarrtellAppearance(next);
}
