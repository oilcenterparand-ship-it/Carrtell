import type { ThemeSettings } from '../admin/services/settingsApi';
import type { CarrtellThemePresetId } from './appearanceThemes';

const HOMEPAGE_PRESETS: Record<CarrtellThemePresetId, Partial<ThemeSettings>> = {
  'carrtell-classic': {
    primaryColor: '#d91f36', secondaryColor: '#d99a00', backgroundColor: '#f4f7fb', surfaceColor: '#ffffff', textColor: '#101827', mutedTextColor: '#536174',
    cardBackground: '#ffffff', cardImageBackground: '#eef2f7', productInfoBackground: '#ffffff', productPriceColor: '#b9162a', addButtonBackground: '#d91f36',
    quickAccessBackground: '#ffffff', quickAccessButtonBackground: '#d91f36', quickAccessSecondaryButtonBackground: '#101827', quickAccessTextColor: '#101827',
    categorySectionBackground: '#e9eef5', categoryIconBackground: '#ffffff', categoryTextColor: '#101827', categoryCardBackground: '#ffffff', categoryCardHoverBackground: '#f8fafc', categoryCardActiveBackground: '#fde8eb', categoryCardActiveTextColor: '#b9162a',
    amazingBackground: '#d91f36', amazingCardBackground: '#ffffff', amazingTimerBackground: '#ffffff', amazingTimerTextColor: '#b9162a', amazingBadgeBackground: '#b9162a', amazingTextColor: '#ffffff',
    tabSectionBackground: '#ffffff', tabActiveColor: '#d91f36', tabInactiveBackground: '#eef2f7', tabInactiveTextColor: '#536174',
    packageBackground: '#fff7e6', packageCardBackground: '#ffffff', packageIconBackground: '#fde7b0', packageTextColor: '#101827', packageBadgeBackground: '#eef2f7',
    productListBackground: '#ffffff', searchBackground: '#eef2f7', productFilterBackground: '#eef2f7', productFilterTextColor: '#101827', carFilterButtonBackground: '#d99a00',
    sectionBorderColor: '#d7dee8', cardBorderColor: '#d7dee8', borderRadius: '22px'
  },
  'premium-dark': {
    primaryColor: '#e5b830', secondaryColor: '#f59e0b', backgroundColor: '#060a12', surfaceColor: '#0d1424', textColor: '#f8fafc', mutedTextColor: '#aebbd0',
    cardBackground: '#101827', cardImageBackground: '#151f33', productInfoBackground: '#0b1220', productPriceColor: '#f4d766', addButtonBackground: '#e5b830',
    quickAccessBackground: '#0d1424', quickAccessButtonBackground: '#e5b830', quickAccessSecondaryButtonBackground: '#263650', quickAccessTextColor: '#f8fafc',
    categorySectionBackground: '#0d1424', categoryIconBackground: '#1c2940', categoryTextColor: '#f8fafc', categoryCardBackground: '#111b2e', categoryCardHoverBackground: '#1c2940', categoryCardActiveBackground: '#3a3014', categoryCardActiveTextColor: '#f4d766',
    amazingBackground: '#7c2d12', amazingCardBackground: '#0d1424', amazingTimerBackground: '#060a12', amazingTimerTextColor: '#f4d766', amazingBadgeBackground: '#e11d48', amazingTextColor: '#ffffff',
    tabSectionBackground: '#0d1424', tabActiveColor: '#e5b830', tabInactiveBackground: '#1c2940', tabInactiveTextColor: '#aebbd0',
    packageBackground: '#0b1220', packageCardBackground: '#151f33', packageIconBackground: '#1c2940', packageTextColor: '#f8fafc', packageBadgeBackground: '#060a12',
    productListBackground: '#0d1424', searchBackground: '#0c1627', productFilterBackground: '#151f33', productFilterTextColor: '#f8fafc', carFilterButtonBackground: '#e5b830',
    sectionBorderColor: '#263650', cardBorderColor: '#334765', borderRadius: '24px'
  },
  'digikala-style': {
    primaryColor: '#ef4056', secondaryColor: '#00a8b5', backgroundColor: '#f3f4f6', surfaceColor: '#ffffff', textColor: '#20252d', mutedTextColor: '#626b78',
    cardBackground: '#ffffff', cardImageBackground: '#f7f7f8', productInfoBackground: '#ffffff', productPriceColor: '#ef4056', addButtonBackground: '#ef4056',
    quickAccessBackground: '#ffffff', quickAccessButtonBackground: '#ef4056', quickAccessSecondaryButtonBackground: '#00a8b5', quickAccessTextColor: '#20252d',
    categorySectionBackground: '#ffffff', categoryIconBackground: '#f1f2f4', categoryTextColor: '#20252d', categoryCardBackground: '#ffffff', categoryCardHoverBackground: '#f7f7f8', categoryCardActiveBackground: '#fff0f2', categoryCardActiveTextColor: '#ef4056',
    amazingBackground: '#ef4056', amazingCardBackground: '#ffffff', amazingTimerBackground: '#ffffff', amazingTimerTextColor: '#ef4056', amazingBadgeBackground: '#ef4056', amazingTextColor: '#ffffff',
    tabSectionBackground: '#ffffff', tabActiveColor: '#ef4056', tabInactiveBackground: '#f1f2f4', tabInactiveTextColor: '#626b78',
    packageBackground: '#eaf8fa', packageCardBackground: '#ffffff', packageIconBackground: '#d9f2f5', packageTextColor: '#20252d', packageBadgeBackground: '#f1f2f4',
    productListBackground: '#ffffff', searchBackground: '#f1f2f4', productFilterBackground: '#f1f2f4', productFilterTextColor: '#20252d', carFilterButtonBackground: '#00a8b5',
    sectionBorderColor: '#dde1e6', cardBorderColor: '#dde1e6', borderRadius: '18px'
  },
  'auto-sport': {
    primaryColor: '#38bdf8', secondaryColor: '#2563eb', backgroundColor: '#050d18', surfaceColor: '#0b1829', textColor: '#f0f7ff', mutedTextColor: '#a9bdd5',
    cardBackground: '#0b1829', cardImageBackground: '#12233a', productInfoBackground: '#07111f', productPriceColor: '#7dd3fc', addButtonBackground: '#38bdf8',
    quickAccessBackground: '#0b1829', quickAccessButtonBackground: '#38bdf8', quickAccessSecondaryButtonBackground: '#2563eb', quickAccessTextColor: '#f0f7ff',
    categorySectionBackground: '#071523', categoryIconBackground: '#19304e', categoryTextColor: '#f0f7ff', categoryCardBackground: '#0e2035', categoryCardHoverBackground: '#19304e', categoryCardActiveBackground: '#0c3550', categoryCardActiveTextColor: '#7dd3fc',
    amazingBackground: '#0b4f75', amazingCardBackground: '#0b1829', amazingTimerBackground: '#050d18', amazingTimerTextColor: '#7dd3fc', amazingBadgeBackground: '#2563eb', amazingTextColor: '#ffffff',
    tabSectionBackground: '#0b1829', tabActiveColor: '#38bdf8', tabInactiveBackground: '#19304e', tabInactiveTextColor: '#a9bdd5',
    packageBackground: '#071523', packageCardBackground: '#12233a', packageIconBackground: '#19304e', packageTextColor: '#f0f7ff', packageBadgeBackground: '#050d18',
    productListBackground: '#071523', searchBackground: '#0d1c30', productFilterBackground: '#12233a', productFilterTextColor: '#f0f7ff', carFilterButtonBackground: '#38bdf8',
    sectionBorderColor: '#274565', cardBorderColor: '#315878', borderRadius: '20px'
  },
  luxury: {
    primaryColor: '#27221c', secondaryColor: '#a65f16', backgroundColor: '#f3ede4', surfaceColor: '#fffaf3', textColor: '#211d18', mutedTextColor: '#675d52',
    cardBackground: '#fffaf3', cardImageBackground: '#eee3d4', productInfoBackground: '#fffaf3', productPriceColor: '#a65f16', addButtonBackground: '#a65f16',
    quickAccessBackground: '#e9dcc9', quickAccessButtonBackground: '#27221c', quickAccessSecondaryButtonBackground: '#a65f16', quickAccessTextColor: '#211d18',
    categorySectionBackground: '#e8ddce', categoryIconBackground: '#fffaf3', categoryTextColor: '#211d18', categoryCardBackground: '#fffaf3', categoryCardHoverBackground: '#f4eadc', categoryCardActiveBackground: '#e8d2b4', categoryCardActiveTextColor: '#7a4210',
    amazingBackground: '#7b4a20', amazingCardBackground: '#fffaf3', amazingTimerBackground: '#27221c', amazingTimerTextColor: '#fff8eb', amazingBadgeBackground: '#a65f16', amazingTextColor: '#fff8eb',
    tabSectionBackground: '#fffaf3', tabActiveColor: '#a65f16', tabInactiveBackground: '#eee3d4', tabInactiveTextColor: '#675d52',
    packageBackground: '#e8ddce', packageCardBackground: '#fffaf3', packageIconBackground: '#e5d6c1', packageTextColor: '#211d18', packageBadgeBackground: '#eee3d4',
    productListBackground: '#fffaf3', searchBackground: '#eee3d4', productFilterBackground: '#eee3d4', productFilterTextColor: '#211d18', carFilterButtonBackground: '#a65f16',
    sectionBorderColor: '#d7c7b0', cardBorderColor: '#cdbb9f', borderRadius: '26px'
  },
  'eco-green': {
    primaryColor: '#168648', secondaryColor: '#76910d', backgroundColor: '#eff8f1', surfaceColor: '#ffffff', textColor: '#12301d', mutedTextColor: '#42634d',
    cardBackground: '#ffffff', cardImageBackground: '#e0f2e5', productInfoBackground: '#ffffff', productPriceColor: '#168648', addButtonBackground: '#168648',
    quickAccessBackground: '#dff1e4', quickAccessButtonBackground: '#168648', quickAccessSecondaryButtonBackground: '#76910d', quickAccessTextColor: '#12301d',
    categorySectionBackground: '#dff1e4', categoryIconBackground: '#ffffff', categoryTextColor: '#12301d', categoryCardBackground: '#ffffff', categoryCardHoverBackground: '#eff8f1', categoryCardActiveBackground: '#ccebd6', categoryCardActiveTextColor: '#0f6f3a',
    amazingBackground: '#168648', amazingCardBackground: '#ffffff', amazingTimerBackground: '#ffffff', amazingTimerTextColor: '#168648', amazingBadgeBackground: '#76910d', amazingTextColor: '#ffffff',
    tabSectionBackground: '#ffffff', tabActiveColor: '#168648', tabInactiveBackground: '#e0f2e5', tabInactiveTextColor: '#42634d',
    packageBackground: '#dff1e4', packageCardBackground: '#ffffff', packageIconBackground: '#cfe8d6', packageTextColor: '#12301d', packageBadgeBackground: '#e0f2e5',
    productListBackground: '#ffffff', searchBackground: '#e0f2e5', productFilterBackground: '#e0f2e5', productFilterTextColor: '#12301d', carFilterButtonBackground: '#76910d',
    sectionBorderColor: '#bddbc6', cardBorderColor: '#a8cfb4', borderRadius: '22px'
  }
};

export function applyHomepagePreset(base: ThemeSettings, presetId: CarrtellThemePresetId): ThemeSettings {
  return { ...base, ...(HOMEPAGE_PRESETS[presetId] || HOMEPAGE_PRESETS['premium-dark']), themePreset: presetId };
}
