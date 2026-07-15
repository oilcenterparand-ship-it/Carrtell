import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CarFront,
  CheckCircle2,
  PackageCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCarPackages, type CarPackage } from '../admin/services/packagesApi';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { CARRTELL_APPEARANCE_EVENT, loadCarrtellAppearance, type CarrtellThemePresetId } from '../lib/appearanceThemes';
import { applyHomepagePreset } from '../lib/homepageThemePresets';
import { addProductToCart } from '../lib/cart';
import { onSelectedCustomerCarChange, readSelectedCustomerCar } from '../customer/services/selectedCar';
import { ProductCard } from './ShopPage';

export type StoreCollectionKind = 'all' | 'special' | 'featured' | 'packages';

type CollectionMeta = {
  title: string;
  subtitle: string;
  eyebrow: string;
  icon: typeof Boxes;
  accent: keyof Pick<ThemeSettings, 'primaryColor' | 'amazingBadgeBackground' | 'tabActiveColor' | 'packageBadgeBackground'>;
};

const pageMeta: Record<StoreCollectionKind, CollectionMeta> = {
  all: {
    title: 'همه محصولات',
    subtitle: 'تمام محصولات فعال Carrtell را در یک نمای مرتب و فروشگاهی ببینید.',
    eyebrow: 'فروشگاه اصلی',
    icon: Boxes,
    accent: 'primaryColor',
  },
  special: {
    title: 'پیشنهادهای ویژه',
    subtitle: 'تخفیف‌های فعال و پیشنهادهای محدود فروشگاه را از دست ندهید.',
    eyebrow: 'فرصت محدود',
    icon: BadgePercent,
    accent: 'amazingBadgeBackground',
  },
  featured: {
    title: 'محصولات منتخب',
    subtitle: 'انتخاب‌های پیشنهادی Carrtell برای خرید سریع‌تر و مطمئن‌تر.',
    eyebrow: 'منتخب Carrtell',
    icon: Sparkles,
    accent: 'tabActiveColor',
  },
  packages: {
    title: 'پکیج‌های خودرویی',
    subtitle: 'پکیج‌های آماده و سازگار با خودروهای مختلف را یکجا مقایسه کنید.',
    eyebrow: 'خرید کامل‌تر',
    icon: PackageCheck,
    accent: 'packageBadgeBackground',
  },
};

function isAmazingActive(product: Product) {
  return !!product.is_featured && !!product.amazing_price && !!product.amazing_ends_at && new Date(product.amazing_ends_at).getTime() > Date.now();
}

function productMatchesCar(product: Product, carId?: string) {
  if (!carId) return true;
  return !!product.compatible_all_cars || (product.compatible_car_ids || []).includes(carId);
}

function isDarkColor(hex?: string) {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function readableText(background?: string, fallback = '#0f172a') {
  return isDarkColor(background) ? '#ffffff' : fallback;
}

export default function StoreCollectionPage({ kind }: { kind: StoreCollectionKind }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [selectedCar, setSelectedCar] = useState(() => readSelectedCustomerCar());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [loadedTheme, items] = await Promise.all([
        getThemeSettings().catch(() => defaultThemeSettings),
        kind === 'packages' ? getCarPackages().catch(() => []) : getProducts().catch(() => []),
      ]);
      if (!mounted) return;
      setTheme(applyHomepagePreset({ ...defaultThemeSettings, ...(loadedTheme || {}) }, loadCarrtellAppearance().presetId));
      if (kind === 'packages') setPackages((items as CarPackage[]).filter((item) => item.is_active !== false));
      else setProducts((items as Product[]).filter((item) => item.is_active !== false));
      setLoading(false);
    };
    void load();
    const refreshTheme = (event?: Event) => {
      const presetId = ((event as CustomEvent | undefined)?.detail?.presetId || loadCarrtellAppearance().presetId) as CarrtellThemePresetId;
      void getThemeSettings()
        .then((settings) => setTheme(applyHomepagePreset({ ...defaultThemeSettings, ...(settings || {}) }, presetId)))
        .catch(() => undefined);
    };
    window.addEventListener(CARRTELL_APPEARANCE_EVENT, refreshTheme as EventListener);
    window.addEventListener('storage', refreshTheme as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener(CARRTELL_APPEARANCE_EVENT, refreshTheme as EventListener);
      window.removeEventListener('storage', refreshTheme as EventListener);
    };
  }, [kind]);

  useEffect(() => onSelectedCustomerCarChange(() => setSelectedCar(readSelectedCustomerCar())), []);

  const visibleProducts = useMemo(() => {
    let items = products;
    if (kind === 'special') items = items.filter(isAmazingActive);
    if (kind === 'featured') items = items.filter((item) => item.is_featured || item.is_best_seller);
    if (selectedCar?.id) {
      const rank = (item: Product) => productMatchesCar(item, selectedCar.id) ? 0 : (item.compatible_car_ids || []).length > 0 ? 2 : 1;
      items = [...items].sort((a, b) => rank(a) - rank(b));
    }
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      items = items.filter((item) => `${item.name} ${item.brand || ''} ${item.category || ''} ${item.card_features || ''}`.toLowerCase().includes(normalized));
    }
    return items;
  }, [kind, products, query, selectedCar?.id]);

  const visiblePackages = useMemo(() => {
    let items = selectedCar?.id ? packages.filter((item) => !item.car_id || item.car_id === selectedCar.id) : packages;
    const normalized = query.trim().toLowerCase();
    if (normalized) items = items.filter((item) => `${item.title} ${item.description || ''} ${item.category_title || ''}`.toLowerCase().includes(normalized));
    return items;
  }, [packages, query, selectedCar?.id]);

  const meta = pageMeta[kind];
  const Icon = meta.icon;
  const accent = theme.primaryColor;
  const count = kind === 'packages' ? visiblePackages.length : visibleProducts.length;
  const pageSectionBackground = theme.productListBackground;
  const pageSectionText = readableText(theme.productListBackground) || theme.textColor;
  const pageCardBackground = theme.cardBackground;
  const pageBorder = theme.sectionBorderColor || theme.cardBorderColor;

  return (
    <main
      className="ct-shop-page min-h-screen py-5 md:py-7"
      style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}
      dir="rtl"
    >
      <div className="container-custom space-y-4">
        <section
          className="rounded-3xl border p-4 shadow-sm md:p-5"
          style={{ background: pageSectionBackground, borderColor: pageBorder, color: pageSectionText, borderRadius: theme.borderRadius }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: pageCardBackground, border: `1px solid ${pageBorder}`, color: accent }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-black md:text-2xl">{meta.title}</h1>
                <p className="mt-1 text-xs md:text-sm" style={{ color: theme.mutedTextColor }}>{meta.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCar && (
                <span
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                  style={{ background: pageCardBackground, borderColor: pageBorder, color: pageSectionText }}
                >
                  <CarFront className="h-4 w-4" style={{ color: accent }} />
                  {selectedCar.title}
                </span>
              )}
              <span
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                style={{ background: pageCardBackground, borderColor: pageBorder, color: pageSectionText }}
              >
                <CheckCircle2 className="h-4 w-4" style={{ color: accent }} />
                {count.toLocaleString('fa-IR')} مورد
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5"
                style={{ background: pageCardBackground, borderColor: pageBorder, color: pageSectionText }}
              >
                <ArrowRight className="h-4 w-4" /> بازگشت
              </Link>
            </div>
          </div>
        </section>

        <section
          className="rounded-3xl border p-3 shadow-sm"
          style={{ background: pageSectionBackground, borderColor: pageBorder, borderRadius: theme.borderRadius }}
        >
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={kind === 'packages' ? 'جستجو در پکیج‌ها...' : 'جستجو در محصولات...'}
              className="h-11 w-full rounded-2xl border pr-12 pl-4 text-sm outline-none transition focus:ring-2"
              style={{ background: theme.searchBackground, color: theme.textColor, borderColor: pageBorder }}
            />
          </div>
        </section>

        <section
          className="rounded-3xl border p-3 shadow-sm md:p-4"
          style={{ background: pageSectionBackground, borderColor: pageBorder, borderRadius: theme.borderRadius }}
        >
          {loading ? (
            <div className="py-24 text-center text-sm" style={{ color: theme.mutedTextColor }}>در حال بارگذاری...</div>
          ) : kind === 'packages' ? (
            visiblePackages.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visiblePackages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    to={`/shop/packages/${pkg.car_id || 'all'}`}
                    className="group overflow-hidden border p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ background: pageCardBackground, borderColor: pageBorder, borderRadius: theme.borderRadius, color: pageSectionText }}
                  >
                    <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-2xl" style={{ background: theme.packageIconBackground || theme.surfaceColor }}>
                      {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <PackageCheck className="h-12 w-12" style={{ color: accent }} />
                      )}
                    </div>
                    <b className="block truncate text-sm">{pkg.title}</b>
                    <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5" style={{ color: theme.mutedTextColor }}>
                      {pkg.description || pkg.category_title || 'پکیج آماده مخصوص خودرو'}
                    </p>
                    <span
                      className="mt-3 inline-flex rounded-xl px-3 py-2 text-xs font-black"
                      style={{ background: theme.primaryColor, color: readableText(theme.primaryColor) || '#fff' }}
                    >
                      مشاهده پکیج
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center" style={{ color: theme.mutedTextColor }}>پکیجی برای نمایش پیدا نشد.</div>
            )
          ) : visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  reservedQuantity={0}
                  onAddToCart={addProductToCart}
                  theme={theme}
                  selectedCarId={selectedCar?.id || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center" style={{ color: theme.mutedTextColor }}>محصولی برای نمایش پیدا نشد.</div>
          )}
        </section>
      </div>
    </main>
  );
}
