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

const makeTheme = (
  id: CarrtellThemePresetId,
  name: string,
  description: string,
  mode: 'light' | 'dark',
  cssVars: Record<string, string>
): CarrtellThemePreset => ({ id, name, description, mode, cssVars });

export const carrtellThemePresets: CarrtellThemePreset[] = [
  makeTheme('carrtell-classic', 'Carrtell Classic', 'روشن، فروشگاهی و خوانا با قرمز کنترل‌شده', 'light', {
    '--ct-bg': '#f4f7fb', '--ct-surface': '#ffffff', '--ct-surface-2': '#eef2f7', '--ct-surface-3': '#e3e9f1',
    '--ct-text': '#101827', '--ct-heading': '#0b1220', '--ct-muted': '#536174', '--ct-border': '#d7dee8',
    '--ct-primary': '#d91f36', '--ct-primary-hover': '#b9162a', '--ct-primary-text': '#ffffff', '--ct-accent': '#d99a00',
    '--ct-header': '#8f1427', '--ct-header-2': '#c51f38', '--ct-header-text': '#ffffff', '--ct-input-bg': '#ffffff', '--ct-input-text': '#101827',
    '--ct-success': '#138a4b', '--ct-danger': '#c52c3e', '--ct-warning': '#c47a00', '--ct-shadow': '0 14px 35px rgba(15,23,42,.10)'
  }),
  makeTheme('premium-dark', 'Premium Dark', 'تیره، طلایی و پریمیوم؛ تم اصلی پیشنهادی کارتل', 'dark', {
    '--ct-bg': '#060a12', '--ct-surface': '#0d1424', '--ct-surface-2': '#151f33', '--ct-surface-3': '#1c2940',
    '--ct-text': '#f8fafc', '--ct-heading': '#ffffff', '--ct-muted': '#aebbd0', '--ct-border': '#263650',
    '--ct-primary': '#e5b830', '--ct-primary-hover': '#f4d766', '--ct-primary-text': '#111827', '--ct-accent': '#f59e0b',
    '--ct-header': '#0a0f1a', '--ct-header-2': '#1a2435', '--ct-header-text': '#fff8dc', '--ct-input-bg': '#0c1627', '--ct-input-text': '#f8fafc',
    '--ct-success': '#22c55e', '--ct-danger': '#fb7185', '--ct-warning': '#fbbf24', '--ct-shadow': '0 18px 45px rgba(0,0,0,.32)'
  }),
  makeTheme('digikala-style', 'Digikala Style', 'سفید، قرمز و مینیمال با کنتراست فروشگاهی', 'light', {
    '--ct-bg': '#f3f4f6', '--ct-surface': '#ffffff', '--ct-surface-2': '#f7f7f8', '--ct-surface-3': '#eceff2',
    '--ct-text': '#20252d', '--ct-heading': '#111827', '--ct-muted': '#626b78', '--ct-border': '#dde1e6',
    '--ct-primary': '#ef4056', '--ct-primary-hover': '#d92f45', '--ct-primary-text': '#ffffff', '--ct-accent': '#00a8b5',
    '--ct-header': '#ffffff', '--ct-header-2': '#f7f7f8', '--ct-header-text': '#111827', '--ct-input-bg': '#f1f2f4', '--ct-input-text': '#20252d',
    '--ct-success': '#129447', '--ct-danger': '#dc263d', '--ct-warning': '#b96f00', '--ct-shadow': '0 12px 32px rgba(31,41,55,.10)'
  }),
  makeTheme('auto-sport', 'Auto Sport', 'سرمه‌ای، آبی و اسپرت با خوانایی بالا', 'dark', {
    '--ct-bg': '#050d18', '--ct-surface': '#0b1829', '--ct-surface-2': '#12233a', '--ct-surface-3': '#19304e',
    '--ct-text': '#f0f7ff', '--ct-heading': '#ffffff', '--ct-muted': '#a9bdd5', '--ct-border': '#274565',
    '--ct-primary': '#38bdf8', '--ct-primary-hover': '#7dd3fc', '--ct-primary-text': '#04101d', '--ct-accent': '#2563eb',
    '--ct-header': '#06213a', '--ct-header-2': '#0b4d78', '--ct-header-text': '#ffffff', '--ct-input-bg': '#0d1c30', '--ct-input-text': '#f0f7ff',
    '--ct-success': '#34d399', '--ct-danger': '#fb7185', '--ct-warning': '#fbbf24', '--ct-shadow': '0 18px 45px rgba(1,8,18,.38)'
  }),
  makeTheme('luxury', 'Luxury', 'کرم، زغالی و برنزی؛ لوکس اما خوانا', 'light', {
    '--ct-bg': '#f3ede4', '--ct-surface': '#fffaf3', '--ct-surface-2': '#eee3d4', '--ct-surface-3': '#e5d6c1',
    '--ct-text': '#211d18', '--ct-heading': '#12100d', '--ct-muted': '#675d52', '--ct-border': '#d7c7b0',
    '--ct-primary': '#27221c', '--ct-primary-hover': '#3a3127', '--ct-primary-text': '#fff8eb', '--ct-accent': '#a65f16',
    '--ct-header': '#2b2118', '--ct-header-2': '#5a4128', '--ct-header-text': '#fff3d6', '--ct-input-bg': '#fffaf3', '--ct-input-text': '#211d18',
    '--ct-success': '#2f7d4a', '--ct-danger': '#a63b43', '--ct-warning': '#9a5b12', '--ct-shadow': '0 16px 40px rgba(55,45,34,.16)'
  }),
  makeTheme('eco-green', 'Eco Green', 'سبز، روشن و آرام با رنگ متن استاندارد', 'light', {
    '--ct-bg': '#eff8f1', '--ct-surface': '#ffffff', '--ct-surface-2': '#e0f2e5', '--ct-surface-3': '#cfe8d6',
    '--ct-text': '#12301d', '--ct-heading': '#082313', '--ct-muted': '#42634d', '--ct-border': '#bddbc6',
    '--ct-primary': '#168648', '--ct-primary-hover': '#0f6f3a', '--ct-primary-text': '#ffffff', '--ct-accent': '#76910d',
    '--ct-header': '#0c4a2c', '--ct-header-2': '#168648', '--ct-header-text': '#ffffff', '--ct-input-bg': '#ffffff', '--ct-input-text': '#12301d',
    '--ct-success': '#168648', '--ct-danger': '#b83245', '--ct-warning': '#a66900', '--ct-shadow': '0 14px 34px rgba(22,101,52,.12)'
  })
];

export const carrtellFonts: { id: CarrtellFontId; name: string; cssFamily: string }[] = [
  { id: 'vazirmatn', name: 'Vazirmatn', cssFamily: "Vazirmatn, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: 'iran-sans-style', name: 'IRANSans Style', cssFamily: "Vazirmatn, Tahoma, Arial, sans-serif" },
  { id: 'dana-style', name: 'Dana Style', cssFamily: "Vazirmatn, 'Segoe UI', Tahoma, sans-serif" },
  { id: 'shabnam-style', name: 'Shabnam Style', cssFamily: "Vazirmatn, Arial, sans-serif" }
];

export const CARRTELL_APPEARANCE_STORAGE_KEY = 'carrtell:appearance';
export const CARRTELL_USER_THEME_MODE_KEY = 'carrtell:user-theme-mode';
export const CARRTELL_APPEARANCE_EVENT = 'carrtell:appearance-changed';

export function getDefaultAppearance() {
  return {
    presetId: 'premium-dark' as CarrtellThemePresetId,
    fontId: 'vazirmatn' as CarrtellFontId,
    userMode: 'system' as UserThemeMode,
    headerBackground: '',
    headerTextColor: '',
    headerButtonBackground: '',
    headerSearchBackground: '',
    headerBorderColor: ''
  };
}

function resolveMode(base: 'light' | 'dark', requested: UserThemeMode): 'light' | 'dark' {
  if (requested === 'light' || requested === 'dark') return requested;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return base;
}

export function applyCarrtellAppearance(next = getDefaultAppearance()) {
  if (typeof document === 'undefined') return;
  const preset = carrtellThemePresets.find((item) => item.id === next.presetId) ?? carrtellThemePresets[1];
  const font = carrtellFonts.find((item) => item.id === next.fontId) ?? carrtellFonts[0];
  const root = document.documentElement;
  Object.entries(preset.cssVars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.style.setProperty('--ct-font-family', font.cssFamily);
  root.style.setProperty('--ct-header-custom', next.headerBackground || preset.cssVars['--ct-header']);
  root.style.setProperty('--ct-header-text-custom', next.headerTextColor || preset.cssVars['--ct-header-text']);
  root.style.setProperty('--ct-header-button-custom', next.headerButtonBackground || preset.cssVars['--ct-header-2']);
  root.style.setProperty('--ct-header-search-custom', next.headerSearchBackground || preset.cssVars['--ct-input-bg']);
  root.style.setProperty('--ct-header-border-custom', next.headerBorderColor || preset.cssVars['--ct-border']);
  // Legacy pages and older components now resolve through the same central contract.
  const aliases: Record<string, string> = {
    '--site-bg': 'var(--ct-bg)', '--page-bg': 'var(--ct-bg)',
    '--card-bg': 'var(--ct-surface)', '--panel-bg': 'var(--ct-surface)',
    '--surface-color': 'var(--ct-surface)', '--surface-secondary': 'var(--ct-surface-2)',
    '--text-primary': 'var(--ct-text)', '--text-secondary': 'var(--ct-muted)', '--text-muted': 'var(--ct-muted)',
    '--primary': 'var(--ct-primary)', '--accent': 'var(--ct-accent)', '--border-color': 'var(--ct-border)',
    '--input-bg': 'var(--ct-input-bg)', '--input-text': 'var(--ct-input-text)'
  };
  Object.entries(aliases).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.ctThemePreset = preset.id;
  root.dataset.ctThemeBase = preset.mode;
  root.dataset.ctUserMode = next.userMode;
  root.dataset.ctResolvedMode = resolveMode(preset.mode, next.userMode);
  root.style.colorScheme = root.dataset.ctResolvedMode;
  root.classList.add('ct-theme-ready');
}

export function loadCarrtellAppearance() {
  if (typeof localStorage === 'undefined') return getDefaultAppearance();
  try {
    const saved = localStorage.getItem(CARRTELL_APPEARANCE_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const next = { ...getDefaultAppearance(), ...parsed };
    if (!carrtellThemePresets.some((item) => item.id === next.presetId)) next.presetId = getDefaultAppearance().presetId;
    if (!carrtellFonts.some((item) => item.id === next.fontId)) next.fontId = getDefaultAppearance().fontId;
    return next;
  } catch {
    return getDefaultAppearance();
  }
}

export function saveCarrtellAppearance(next: ReturnType<typeof getDefaultAppearance>) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(CARRTELL_APPEARANCE_STORAGE_KEY, JSON.stringify(next));
  applyCarrtellAppearance(next);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CARRTELL_APPEARANCE_EVENT, { detail: next }));
}

export function initializeCarrtellAppearance() {
  const next = loadCarrtellAppearance();
  applyCarrtellAppearance(next);
  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const current = loadCarrtellAppearance();
      if (current.userMode === 'system') applyCarrtellAppearance(current);
    };
    media.addEventListener?.('change', listener);
  }
  return next;
}
