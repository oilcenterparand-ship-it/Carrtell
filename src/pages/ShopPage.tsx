import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CarFront,
  ChevronDown,
  Droplets,
  Grid3X3,
  Heart,
  PackageCheck,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  RotateCcw,
  Wrench,
  X,
} from 'lucide-react';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCars, getCarTitle, type Car } from '../admin/services/carsApi';
import { getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { getCarPackages, type CarPackage } from '../admin/services/packagesApi';
import { getHomeBanners, getHomeSections, getTodayShoppingSettings, type HomeBanner, type HomeSection, type TodayShoppingSettings, defaultTodayShoppingSettings } from '../admin/services/homeContentApi';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { CARRTELL_APPEARANCE_EVENT, loadCarrtellAppearance, type CarrtellThemePresetId } from '../lib/appearanceThemes';
import { applyHomepagePreset } from '../lib/homepageThemePresets';
import { addProductToCart, changeCartQuantity, readCart, type CartItem } from '../lib/cart';
import { onSelectedCustomerCarChange, readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import { getApprovedProductReviewSummaries, type ProductReviewSummary } from '../admin/services/customerReviewsApi';
import '../styles/carrtellFonts.css';
import { ShopPromoCards } from '../components/shop/ShopPromoCards';
import { ShopProductGrid } from '../components/shop/ShopProductGrid';


const FAVORITES_STORAGE_KEY = 'carrtell:favorites';
const FAVORITES_CHANGED_EVENT = 'carrtell:favorites-changed';

function readFavoriteProductIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavoriteProductIds(ids: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}


function CategoryQuickIcon({ category }: { category: ProductCategory }) {
  if (category.image_url) {
    return <img src={category.image_url} alt="" className="ct-shop-category-dynamic-image" loading="lazy" />;
  }

  if (category.icon_emoji) {
    return <span className="ct-shop-category-dynamic-emoji" aria-hidden="true">{category.icon_emoji}</span>;
  }

  return <Droplets className="ct-shop-category-dynamic-fallback" aria-hidden="true" />;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price || 0);
}

function isAmazingActive(product: Product) {
  if (!product.is_featured || !product.amazing_price || !product.amazing_ends_at) return false;
  return new Date(product.amazing_ends_at).getTime() > Date.now();
}

function getProductFinalPrice(product: Product) {
  return isAmazingActive(product) ? Number(product.amazing_price) : Number(product.price || 0);
}

function getProductShortDescription(product: Product) {
  const cleaned = (product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned) return cleaned;
  const parts = [product.brand, product.oil_grade, product.quality_level, product.category].filter(Boolean);
  return parts.length ? `محصول ${parts.join('، ')} مناسب استفاده و نگهداری خودرو` : 'محصول تخصصی خودرو با کیفیت مناسب و انتخاب مطمئن برای مصرف روزمره';
}

function isProductAvailable(product: Product, reservedQuantity = 0) {
  return !product.is_out_of_stock && (product.stock || 0) - reservedQuantity > 0;
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

function getReadableTextColor(background?: string, fallback = '#0f172a') {
  return isDarkColor(background) ? '#ffffff' : fallback;
}


function productMatchesCar(product: Product | null | undefined, carId: string) {
  if (!carId || carId === 'all') return true;
  if (!product) return false;
  return !!product.compatible_all_cars || (product.compatible_car_ids || []).includes(carId);
}

function getProductSearchText(product: Product, categories: ProductCategory[], cars: Car[]) {
  const categoryTitle = categories.find((category) => category.slug === product.category)?.title || product.category || '';
  const compatibleCarTitles = (product.compatible_car_ids || [])
    .map((carId) => cars.find((car) => car.id === carId))
    .filter(Boolean)
    .map((car) => getCarTitle(car as Car))
    .join(' ');
  return `${product.name} ${product.brand || ''} ${categoryTitle} ${product.oil_grade || ''} ${product.quality_level || ''} ${product.transmission_type || ''} ${(product.compatible_transmissions || []).join(' ')} ${compatibleCarTitles}`.toLowerCase();
}

function getCountdown(endsAt?: string) {
  if (!endsAt) return { h: '00', m: '00', s: '00' };
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

export function ProductCard({ product, reservedQuantity, onAddToCart, onChangeQuantity, compact = false, grid = false, theme = defaultThemeSettings, selectedCarId, ratingSummary }: { product: Product; reservedQuantity: number; onAddToCart: (product: Product, origin?: any) => unknown; onChangeQuantity?: (product: Product, delta: number) => void; compact?: boolean; grid?: boolean; theme?: ThemeSettings; selectedCarId?: string; ratingSummary?: ProductReviewSummary }) {
  const isAvailable = isProductAvailable(product, reservedQuantity);
  const amazingActive = isAmazingActive(product);
  const finalPrice = getProductFinalPrice(product);
  const referencePrice = Number(product.original_price || product.price || 0);
  const discountPercent = referencePrice > finalPrice ? Math.round(((referencePrice - finalPrice) / referencePrice) * 100) : 0;
  const itemCountdown = getCountdown(product.amazing_ends_at || undefined);
  const productId = String(product.id || '');
  const [isFavorite, setIsFavorite] = useState(() => productId ? readFavoriteProductIds().includes(productId) : false);

  useEffect(() => {
    const syncFavorite = () => setIsFavorite(productId ? readFavoriteProductIds().includes(productId) : false);
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorite);
    window.addEventListener('storage', syncFavorite);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorite);
      window.removeEventListener('storage', syncFavorite);
    };
  }, [productId]);

  function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!productId) return;
    const current = readFavoriteProductIds();
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    writeFavoriteProductIds(next);
    setIsFavorite(next.includes(productId));
  }

  const imageBg = theme.cardImageBackground || '#f8fafc';
  const infoBg = theme.productInfoBackground || theme.cardBackground || '#ffffff';
  const productTextColor = getReadableTextColor(infoBg, theme.textColor);
  const productMutedColor = isDarkColor(infoBg) ? '#cbd5e1' : theme.mutedTextColor;
  const priceColor = theme.productPriceColor || productTextColor;
  const shortDescription = getProductShortDescription(product);
  const detailBadges = [product.oil_grade, product.quality_level, product.transmission_type].filter(Boolean).slice(0, 3) as string[];
  const cardFeatures = (product.card_features || '').trim() || detailBadges.join(' • ') || shortDescription;
  const hoverDetails = [product.name, product.brand && `برند ${product.brand}`, cardFeatures, shortDescription].filter(Boolean).join(' | ');
  const cardWidth = grid ? 'w-full min-w-0 max-w-none justify-self-stretch' : compact ? 'min-w-[148px] max-w-[148px] md:min-w-[158px] md:max-w-[158px]' : 'min-w-[156px] max-w-[156px] md:min-w-[168px] md:max-w-[168px]';
  const cardBorderColor = theme.cardBorderColor || '#e5e7eb';
  const compatibilityStatus = !selectedCarId
    ? null
    : product.compatible_all_cars || (product.compatible_car_ids || []).includes(selectedCarId)
      ? 'compatible'
      : (product.compatible_car_ids || []).length > 0
        ? 'incompatible'
        : 'unknown';

  return (
    <article
      title={`${hoverDetails} | قیمت ${formatPrice(finalPrice)} تومان`}
      aria-label={`مشاهده اطلاعات ${product.name}`}
      className={`group relative flex ${grid ? 'h-[330px]' : 'h-[312px]'} ${cardWidth} flex-col overflow-hidden border bg-white shadow-[0_4px_16px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.16)]`}
      style={{ background: theme.cardBackground, borderColor: cardBorderColor, borderRadius: '20px', fontFamily: theme.productCardFontFamily || theme.fontFamily }}
    >
      <Link to={`/shop/product/${product.id}`} className={`relative flex ${grid ? 'h-[154px]' : 'h-[142px]'} shrink-0 items-center justify-center overflow-hidden border-b`} style={{ background: imageBg, borderColor: cardBorderColor }}>
        <div className="absolute inset-x-0 top-0 z-[1] h-12 bg-gradient-to-b from-black/[0.04] to-transparent" />
        {product.image_url ? (
          <img src={product.image_url} alt={`${product.name}${product.brand ? ` از برند ${product.brand}` : ''}`} loading="lazy" className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.09]" />
        ) : (
          <Droplets className="h-12 w-12 text-slate-300" />
        )}

        <div className="absolute right-2 top-2 z-10 flex max-w-[72%] flex-wrap gap-1">
          {!isAvailable && <span className="rounded-full bg-slate-900 px-2 py-1 text-[9px] font-black text-white shadow">ناموجود</span>}
          {isAvailable && amazingActive && <span className="rounded-full bg-gradient-to-l from-rose-600 to-pink-500 px-2 py-1 text-[9px] font-black text-white shadow">شگفت‌انگیز</span>}
          {isAvailable && !amazingActive && product.is_best_seller && <span className="rounded-full bg-gradient-to-l from-amber-500 to-yellow-300 px-2 py-1 text-[9px] font-black text-slate-950 shadow">پرفروش</span>}
          {isAvailable && !amazingActive && !product.is_best_seller && product.is_featured && <span className="rounded-full px-2 py-1 text-[9px] font-black shadow" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>ویژه</span>}
          {discountPercent > 0 && <span className="rounded-full bg-red-600 px-2 py-1 text-[9px] font-black text-white shadow">٪{new Intl.NumberFormat('fa-IR').format(discountPercent)}</span>}
        </div>

        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={toggleFavorite}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition hover:scale-110 active:scale-95 ${isFavorite ? 'border-rose-300 bg-rose-50/95 text-rose-500' : 'border-white/80 bg-white/90 text-slate-500 hover:text-rose-500'}`}
            aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {ratingSummary && ratingSummary.count > 0 && <span className="flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full border border-amber-200 bg-white/95 px-1 text-[9px] font-black text-amber-600 shadow-sm"><Star className="h-3 w-3 fill-current" />{ratingSummary.average.toFixed(1)}</span>}
        </div>

        {compatibilityStatus === 'compatible' && (
          <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[9px] font-black text-white shadow-lg">
            <PackageCheck className="h-3 w-3" /> مناسب خودروی شما
          </span>
        )}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-3" style={{ background: infoBg, color: productTextColor }}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-bold" style={{ color: productMutedColor }}>{product.brand || 'Carrtell'}</p>
          <span className={`flex items-center gap-1 text-[9px] font-black ${isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isAvailable ? 'موجود' : 'ناموجود'}
          </span>
        </div>

        <Link to={`/shop/product/${product.id}`} className="line-clamp-2 min-h-[42px] text-[12px] font-black leading-[1.3rem] transition-colors group-hover:text-red-600" style={{ color: productTextColor }}>
          {product.name}
        </Link>

        <div className="mt-1.5 flex min-h-[24px] flex-wrap content-start gap-1 overflow-hidden">
          {detailBadges.length > 0 ? detailBadges.map((badge) => (
            <span key={badge} className="rounded-md border px-1.5 py-0.5 text-[8px] font-bold" style={{ borderColor: cardBorderColor, color: productMutedColor, background: isDarkColor(infoBg) ? 'rgba(255,255,255,.05)' : '#f8fafc' }}>{badge}</span>
          )) : <p className="line-clamp-1 text-[9px] leading-5" style={{ color: productMutedColor }}>{cardFeatures}</p>}
        </div>

        {amazingActive ? (
          <div className="mt-1 flex h-5 items-center gap-1 text-[8px] font-black text-pink-600">
            <span className="ml-1">تا پایان:</span>
            <span className="rounded bg-pink-50 px-1.5 py-1">{itemCountdown.h}</span>
            <span>:</span><span className="rounded bg-pink-50 px-1.5 py-1">{itemCountdown.m}</span>
            <span>:</span><span className="rounded bg-pink-50 px-1.5 py-1">{itemCountdown.s}</span>
          </div>
        ) : <div className="mt-1 h-5" />}

        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2.5" style={{ borderColor: cardBorderColor }}>
          <div className="min-w-0 flex-1">
            <div className="flex h-4 items-center gap-1.5">
              {discountPercent > 0 && <span className="text-[9px] text-slate-400 line-through">{formatPrice(referencePrice)}</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <b className="truncate text-[14px] font-black" style={{ color: priceColor }}>{formatPrice(finalPrice)}</b>
              <span className="text-[9px]" style={{ color: productMutedColor }}>تومان</span>
            </div>
          </div>

          {reservedQuantity > 0 ? (
            <div className="ct-product-qty-control" aria-label="تعداد در سبد خرید">
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChangeQuantity?.(product, 1); }} disabled={reservedQuantity >= Number(product.stock || 0)} aria-label="افزایش تعداد"><Plus className="h-4 w-4" /></button>
              <span>{new Intl.NumberFormat('fa-IR').format(reservedQuantity)}</span>
              <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChangeQuantity?.(product, -1); }} aria-label="کاهش تعداد"><Minus className="h-4 w-4" /></button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product, event.currentTarget); }}
              className={`group/add flex h-9 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xl border px-2.5 text-[10px] font-black shadow-sm transition-all duration-300 active:scale-95 ${isAvailable ? 'hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'}`}
              style={isAvailable ? { background: `linear-gradient(135deg, ${theme.addButtonBackground || theme.primaryColor}, #facc15)`, borderColor: theme.addButtonBackground || theme.primaryColor, color: '#171717' } : undefined}
              aria-label="افزودن به سبد خرید"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden xl:inline">افزودن</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


function ViewAllCard({ to, label = 'مشاهده همه', theme = defaultThemeSettings, compact = false }: { to: string; label?: string; theme?: ThemeSettings; compact?: boolean }) {
  const width = compact ? 'min-w-[138px] md:min-w-[148px]' : 'min-w-[148px] md:min-w-[160px]';
  return (
    <Link
      to={to}
      className={`flex h-[232px] ${width} shrink-0 flex-col items-center justify-center gap-3 border text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
      style={{ background: theme.cardBackground, borderColor: theme.cardBorderColor, color: theme.primaryColor, borderRadius: theme.borderRadius }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${theme.primaryColor}18` }}>
        <ArrowLeft className="h-6 w-6" />
      </span>
      <b className="text-sm">{label}</b>
      <span className="text-[10px]" style={{ color: theme.mutedTextColor }}>نمایش کامل این بخش</span>
    </Link>
  );
}

function ViewAllPackageCard({ theme = defaultThemeSettings }: { theme?: ThemeSettings }) {
  return (
    <Link
      to="/shop/packages"
      className="flex min-w-[118px] shrink-0 flex-col items-center justify-center gap-3 border p-3 text-center shadow-sm transition hover:-translate-y-0.5"
      style={{ background: theme.packageCardBackground, color: theme.primaryColor, borderColor: theme.cardBorderColor, borderRadius: theme.borderRadius }}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: theme.packageIconBackground || theme.packageBackground }}>
        <ArrowLeft className="h-8 w-8" />
      </span>
      <b className="text-xs">مشاهده همه</b>
    </Link>
  );
}

export default function ShopPage() {
  useEffect(() => {
    document.documentElement.classList.add('ct-shop-route');
    return () => document.documentElement.classList.remove('ct-shop-route');
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeTabSlug, setActiveTabSlug] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCarId, setActiveCarId] = useState(() => readSelectedCustomerCar()?.id || 'all');
  const [sortBy, setSortBy] = useState('popular');
  const [activeBrand, setActiveBrand] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'low-stock' | 'amazing'>('all');
  const [showShopFilters, setShowShopFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCarFilter, setShowCarFilter] = useState(false);
  const [carFilterSearch, setCarFilterSearch] = useState('');
  const [carFilterBrand, setCarFilterBrand] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [nowTick, setNowTick] = useState(0);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [todayShoppingSettings, setTodayShoppingSettings] = useState<TodayShoppingSettings>(defaultTodayShoppingSettings);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ProductReviewSummary>>({});
  const [visibleProductCount, setVisibleProductCount] = useState(12);

  useEffect(() => {
    async function load() {
      try {
        const [productsData, carsData, packagesData, categoriesData, bannerData, sectionData, themeData, todayShoppingData, reviewSummaryData] = await Promise.all([
          getProducts(),
          getCars(),
          getCarPackages(),
          getProductCategories(),
          getHomeBanners(),
          getHomeSections(),
          getThemeSettings(),
          getTodayShoppingSettings(),
          getApprovedProductReviewSummaries().catch(() => ({})),
        ]);
        setProducts((productsData || []).filter((p) => Boolean(p && typeof p === 'object' && p.is_active)));
        setCars(carsData.filter((car) => car.is_active !== false));
        setPackages(packagesData.filter((pkg) => pkg.is_active !== false));
        setCategories(categoriesData.filter((category) => category.is_active !== false));
        setBanners(bannerData.filter((banner) => banner.is_active !== false));
        const activeSections = sectionData.filter((section) => section.is_active !== false);
        setSections(activeSections);
        setActiveTabSlug(activeSections.find((section) => !section.show_timer)?.slug || activeSections[0]?.slug || '');
        setTheme(applyHomepagePreset({ ...defaultThemeSettings, ...(themeData || {}) }, loadCarrtellAppearance().presetId));
        setTodayShoppingSettings({ ...defaultTodayShoppingSettings, ...(todayShoppingData || {}) });
        setReviewSummaries(reviewSummaryData || {});
      } catch (error) {
        console.error('Shop data load error:', error);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const handleAppearanceChange = (event: Event) => {
      const presetId = ((event as CustomEvent).detail?.presetId || loadCarrtellAppearance().presetId) as CarrtellThemePresetId;
      setTheme((current) => applyHomepagePreset(current, presetId));
    };
    window.addEventListener(CARRTELL_APPEARANCE_EVENT, handleAppearanceChange);
    window.addEventListener('storage', handleAppearanceChange);
    return () => {
      window.removeEventListener(CARRTELL_APPEARANCE_EVENT, handleAppearanceChange);
      window.removeEventListener('storage', handleAppearanceChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSelectedCustomerCarChange(() => {
      setActiveCarId(readSelectedCustomerCar()?.id || 'all');
     
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    const category = searchParams.get('category');
    if (category) setActiveCategory(category);
    if (searchParams.get('view') === 'categories') setShowCategoryMenu(true);
  }, [searchParams]);

  function closeCategoryMenu() {
    setShowCategoryMenu(false);
    if (searchParams.get('view') === 'categories') {
      const next = new URLSearchParams(searchParams);
      next.delete('view');
      setSearchParams(next, { replace: true });
    }
  }

  function chooseCategory(category: string) {
    setActiveCategory(category);
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    if (category === 'all') next.delete('category');
    else next.set('category', category);
    setSearchParams(next, { replace: true });
    setShowCategoryMenu(false);
    window.requestAnimationFrame(() => document.querySelector('.ct-shop-compact-categories')?.scrollIntoView({ block: 'start' }));
  }

  useEffect(() => {
    const syncCart = () => setCart(readCart());
    window.addEventListener('carrtell-cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('carrtell-cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (banners.length ? (current + 1) % banners.length : 0));
      setNowTick((current) => current + 1);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    setVisibleProductCount(12);
  }, [search, activeCategory, activeBrand, activeCarId, availabilityFilter, sortBy, minPrice, maxPrice]);

  const reservedQuantityByProductId = useMemo(() => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])), [cart]);
  const availableProducts = useMemo(() => {
    return products.filter((product) => isProductAvailable(product, reservedQuantityByProductId[product.id || ''] || 0));
  }, [products, reservedQuantityByProductId]);
  const categoryOptions = categories.length ? categories : [];

  const bestSellerProducts = useMemo(() => availableProducts.filter((product) => product.is_best_seller).slice(0, 12), [availableProducts]);
  const featuredProducts = useMemo(() => availableProducts.filter((product) => product.is_featured && (!product.amazing_ends_at || new Date(product.amazing_ends_at).getTime() > Date.now())).slice(0, 12), [availableProducts, nowTick]);
  const latestProducts = useMemo(() => availableProducts.slice(0, 12), [availableProducts]);
  const amazingSection = sections.find((section) => section.show_timer) || sections.find((section) => section.source_type === 'featured');
  const tabSections = sections.filter((section) => !section.show_timer);
  const activeTab = tabSections.find((section) => section.slug === activeTabSlug) || tabSections[0];

  function getProductsForSection(section?: HomeSection) {
    if (!section) return [];
    if (section.source_type === 'featured') return featuredProducts;
    if (section.source_type === 'best_seller') return bestSellerProducts;
    if (section.source_type === 'latest') return latestProducts;
    if (section.source_type === 'category') return availableProducts.filter((product) => product.category === section.category_slug).slice(0, 12);
    return [];
  }

  const amazingProducts = getProductsForSection(amazingSection).slice(0, 10);
  const tabProducts = getProductsForSection(activeTab).slice(0, 12);
  const countdown = getCountdown(amazingSection?.ends_at);
  void nowTick;

  const packageGroups = useMemo(() => {
    const groups = packages.reduce<Record<string, { key: string; title: string; imageUrl?: string; coverColor?: string | null; font?: string | null; car?: Car | null; count: number }>>((acc, pkg) => {
      const car = pkg.car_id ? cars.find((item) => item.id === pkg.car_id) : null;
      const key = pkg.car_id || 'all';
      const title = car?.model ? `پکیج ${car.model}` : pkg.car_id ? 'پکیج خودرو' : 'پکیج همه خودروها';
      if (!acc[key]) {
        acc[key] = {
          key,
          title,
          imageUrl: pkg.image_url,
          coverColor: pkg.cover_color || '#fff7ed',
          font: pkg.package_font || undefined,
          car,
          count: 0,
        };
      }
      acc[key].count += 1;
      if (!acc[key].imageUrl && pkg.image_url) acc[key].imageUrl = pkg.image_url;
      if (pkg.cover_color) acc[key].coverColor = pkg.cover_color;
      if (pkg.package_font) acc[key].font = pkg.package_font;
      return acc;
    }, {});
    return Object.values(groups);
  }, [packages, cars]);

  const groupedCars = useMemo(() => {
    const q = carFilterSearch.trim().toLowerCase();
    return cars.filter((car) => !q || `${getCarTitle(car)} ${car.brand} ${car.model} ${car.engine}`.toLowerCase().includes(q)).reduce<Record<string, Car[]>>((groups, car) => {
      const brand = car.brand || 'سایر خودروها';
      groups[brand] = [...(groups[brand] || []), car];
      return groups;
    }, {});
  }, [cars, carFilterSearch]);

  const brandOptions = useMemo(() => Array.from(new Set(products.map((product) => product.brand).filter((brand): brand is string => Boolean(brand)))).sort((a, b) => a.localeCompare(b, 'fa')), [products]);
  const highestProductPrice = useMemo(() => Math.max(0, ...products.map((product) => getProductFinalPrice(product))), [products, nowTick]);
  const effectiveMaxPrice = maxPrice ?? highestProductPrice;

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') result = result.filter((p) => p.category === activeCategory);
    if (activeBrand !== 'all') result = result.filter((p) => p.brand === activeBrand);
    if (activeCarId !== 'all') result = result.filter((p) => productMatchesCar(p, activeCarId));
    if (availabilityFilter === 'available') result = result.filter((p) => isProductAvailable(p, reservedQuantityByProductId[p.id || ''] || 0));
    if (availabilityFilter === 'low-stock') result = result.filter((p) => !p.is_out_of_stock && Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 2);
    if (availabilityFilter === 'amazing') result = result.filter(isAmazingActive);
    result = result.filter((p) => {
      const price = getProductFinalPrice(p);
      return price >= minPrice && price <= effectiveMaxPrice;
    });
    const query = search.trim().toLowerCase();
    if (query) result = result.filter((p) => getProductSearchText(p, categories, cars).includes(query));
    switch (sortBy) {
      case 'featured': return [...result].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
      case 'best-seller': return [...result].sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller));
      case 'rating': return [...result].sort((a, b) => (reviewSummaries[b.id || '']?.average || 0) - (reviewSummaries[a.id || '']?.average || 0));
      case 'price-asc': return [...result].sort((a, b) => getProductFinalPrice(a) - getProductFinalPrice(b));
      case 'price-desc': return [...result].sort((a, b) => getProductFinalPrice(b) - getProductFinalPrice(a));
      default: return result;
    }
  }, [products, search, activeCategory, activeBrand, activeCarId, availabilityFilter, sortBy, categories, cars, reservedQuantityByProductId, reviewSummaries, minPrice, effectiveMaxPrice]);

  const activeFilterCount = [activeCategory !== 'all', activeBrand !== 'all', activeCarId !== 'all', availabilityFilter !== 'all', Boolean(search.trim()), minPrice > 0, effectiveMaxPrice < highestProductPrice].filter(Boolean).length;
  const activeCar = activeCarId !== 'all' ? cars.find((car) => car.id === activeCarId) : null;

  function clearShopFilters() {
    setSearch('');
    setActiveCategory('all');
    setActiveBrand('all');
    setAvailabilityFilter('all');
    setActiveCarId('all');
    saveSelectedCustomerCar(null);
    setSortBy('popular');
    setMinPrice(0);
    setMaxPrice(null);
  }

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => { const q = Number(item?.quantity); return sum + (Number.isFinite(q) && q > 0 ? q : 0); }, 0);

  function animateToCart(origin?: HTMLElement | null, product?: Product) {
    if (!origin || typeof document === 'undefined') return;
    const target = document.querySelector('.ct-new-cart-button') as HTMLElement | null;
    if (!target) return;
    const from = origin.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const flyer = document.createElement('div');
    flyer.className = 'ct-cart-flyer';
    if (product?.image_url) { const img = document.createElement('img'); img.src = product.image_url; flyer.appendChild(img); } else { flyer.textContent = '🛒'; }
    flyer.style.left = `${from.left + from.width / 2 - 18}px`;
    flyer.style.top = `${from.top + from.height / 2 - 18}px`;
    document.body.appendChild(flyer);
    requestAnimationFrame(() => {
      flyer.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(.35)`;
      flyer.style.opacity = '0.25';
    });
    window.setTimeout(() => flyer.remove(), 650);
  }

  function addToCart(product: Product, origin?: HTMLElement | null) {
    const result = addProductToCart(product, 1);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    animateToCart(origin, product);
    setCart(result.cart || readCart());
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('carrtell-cart-open')), 420);
  }

  function changeQuantity(product: Product, delta: number) {
    changeCartQuantity(product, delta);
    setCart(readCart());
  }


  const activeHero = banners[activeBanner] || banners[0];
  const surfaceTextColor = getReadableTextColor(theme.surfaceColor, theme.textColor);
  const quickAccessTextColor = theme.quickAccessTextColor || getReadableTextColor(theme.quickAccessBackground, theme.textColor);
  const searchTextColor = getReadableTextColor(theme.searchBackground, theme.textColor);
  const productListTextColor = getReadableTextColor(theme.productListBackground, theme.textColor);
  const tabSectionTextColor = getReadableTextColor(theme.tabSectionBackground, theme.textColor);
  const packageSectionTextColor = getReadableTextColor(theme.packageBackground, theme.packageTextColor || theme.textColor);
  const categoryPanelTextColor = getReadableTextColor(theme.surfaceColor, theme.textColor);
  const categorySectionTextColor = getReadableTextColor(theme.categorySectionBackground, theme.categoryTextColor || theme.textColor);
  const amazingSectionTextColor = theme.amazingTextColor || getReadableTextColor(theme.amazingBackground, theme.textColor);
  const packageCardTextColor = getReadableTextColor(theme.packageCardBackground, theme.packageTextColor || theme.textColor);
  const cardBorderColor = theme.cardBorderColor;
  const sectionBorderColor = theme.sectionBorderColor;

  return (
    <main className="ct-shop-page min-h-screen pb-20 pt-0 md:pb-0" style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      {showCategoryMenu && (
        <div className="ct-shop-category-modal fixed inset-0 z-[100100] bg-black/70" onClick={closeCategoryMenu} data-testid="mobile-category-modal">
          <div className="ct-shop-category-sheet h-full w-[82%] max-w-sm overflow-y-auto p-5 shadow-2xl" style={{ background: theme.surfaceColor, color: categoryPanelTextColor }} onClick={(e) => e.stopPropagation()}>
            <div className="ct-shop-category-sheet-head mb-6 flex items-center justify-between"><div><b>دسته‌بندی محصولات</b><p>دسته موردنظرت را انتخاب کن</p></div><button type="button" onClick={closeCategoryMenu} aria-label="بستن دسته‌بندی‌ها"><X /></button></div>
            <div className="max-h-[calc(100vh-100px)] space-y-2 overflow-y-auto pl-1">
              <button onClick={() => chooseCategory('all')} className="ct-shop-category-choice w-full rounded-2xl px-4 py-3 text-right font-bold" style={{ background: theme.productFilterBackground, color: theme.productFilterTextColor, borderColor: theme.cardBorderColor }}><span className="ct-shop-category-choice-icon"><Grid3X3 /></span><span>همه محصولات</span><ArrowLeft /></button>
              {categoryOptions.map((category) => <button key={category.slug} onClick={() => chooseCategory(category.slug)} className="ct-shop-category-choice w-full rounded-2xl px-4 py-3 text-right font-bold" style={{ background: theme.searchBackground, color: searchTextColor }}><span className="ct-shop-category-choice-icon"><CategoryQuickIcon category={category} /></span><span>{category.title}</span><ArrowLeft /></button>)}
            </div>
          </div>
        </div>
      )}

      {showShopFilters && (
        <div className="fixed inset-0 z-[60] bg-black/60 lg:hidden" onClick={() => setShowShopFilters(false)}>
          <aside className="ml-auto h-full w-[88%] max-w-sm overflow-y-auto p-4 shadow-2xl" style={{ background: theme.surfaceColor, color: surfaceTextColor }} onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><b>فیلتر محصولات</b><button type="button" onClick={() => setShowShopFilters(false)}><X className="h-5 w-5" /></button></div>
            <div className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-black">دسته‌بندی</span><select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}><option value="all">همه دسته‌ها</option>{categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-black">برند</span><select value={activeBrand} onChange={(event) => setActiveBrand(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}><option value="all">همه برندها</option>{brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-black">وضعیت موجودی</span><select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)} className="h-10 w-full rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}><option value="all">همه وضعیت‌ها</option><option value="available">فقط موجود</option><option value="low-stock">موجودی محدود</option><option value="amazing">شگفت‌انگیز</option></select></label>
              <div><span className="mb-2 block text-xs font-black">بازه قیمت</span><div className="grid grid-cols-2 gap-2"><input type="number" min={0} value={minPrice} onChange={(event) => setMinPrice(Math.max(0, Number(event.target.value) || 0))} placeholder="حداقل" className="h-10 rounded-xl border px-2 text-xs outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }} /><input type="number" min={0} value={maxPrice ?? ''} onChange={(event) => setMaxPrice(event.target.value ? Math.max(0, Number(event.target.value)) : null)} placeholder={`حداکثر ${formatPrice(highestProductPrice)}`} className="h-10 rounded-xl border px-2 text-xs outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }} /></div></div>
              <button type="button" onClick={() => setShowCarFilter(true)} className="h-10 w-full rounded-xl border text-xs font-black" style={{ borderColor: theme.cardBorderColor }}>انتخاب خودرو</button>
              <button type="button" onClick={clearShopFilters} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-black" style={{ borderColor: theme.cardBorderColor }}><RotateCcw className="h-4 w-4" /> پاک کردن همه فیلترها</button>
              <button type="button" onClick={() => setShowShopFilters(false)} className="h-11 w-full rounded-xl text-sm font-black" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>نمایش {filtered.length.toLocaleString('fa-IR')} محصول</button>
            </div>
          </aside>
        </div>
      )}

      {showCarFilter && (
        <div className="ct-shop-car-picker-backdrop fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-3" onClick={() => setShowCarFilter(false)}>
          <section className="ct-shop-car-picker w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-400/70 shadow-2xl" style={{ background: theme.surfaceColor, color: surfaceTextColor }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4" style={{borderColor: theme.cardBorderColor}}><div><b className="text-lg">انتخاب خودرو</b><p className="mt-1 text-xs opacity-60">ابتدا سازنده، سپس مدل خودرو را انتخاب کنید.</p></div><button className="grid h-10 w-10 place-items-center rounded-xl border" style={{borderColor: theme.cardBorderColor}} onClick={() => setShowCarFilter(false)}><X className="h-5 w-5" /></button></div>
            <div className="grid gap-3 p-4">
              <label className="grid gap-1.5 text-xs font-black"><span>۱. شرکت سازنده</span><select value={carFilterBrand} onChange={(e) => { setCarFilterBrand(e.target.value); setCarFilterSearch(''); }} className="h-12 rounded-xl border px-3 text-sm outline-none" style={{background:theme.searchBackground,color:searchTextColor,borderColor:theme.cardBorderColor}}><option value="">همه سازنده‌ها</option>{Object.keys(groupedCars).sort((a,b)=>a.localeCompare(b,'fa')).map(brand=><option key={brand} value={brand}>{brand}</option>)}</select></label>
              <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" /><input value={carFilterSearch} onChange={(e) => setCarFilterSearch(e.target.value)} placeholder="۲. نام مدل؛ مثلاً پراید..." className="h-12 w-full rounded-xl border py-3 pl-4 pr-10 text-sm outline-none" style={{ background: theme.productFilterBackground, color: theme.productFilterTextColor, borderColor: theme.cardBorderColor }} /></div>
            </div>
            <div className="ct-shop-car-picker-list max-h-[42dvh] overflow-y-auto px-4 pb-4">
              <button onClick={() => { setActiveCarId('all'); saveSelectedCustomerCar(null); setShowCarFilter(false); }} className="mb-2 w-full rounded-xl px-4 py-3 text-right text-sm font-black" style={{ background: theme.carFilterButtonBackground, color: getReadableTextColor(theme.carFilterButtonBackground, '#0f172a') }}>همه خودروها</button>
              {Object.entries(groupedCars).filter(([brand]) => !carFilterBrand || brand === carFilterBrand).map(([brand, brandCars]) => { const q=carFilterSearch.trim().toLocaleLowerCase('fa'); const list=brandCars.filter(car=>!q || getCarTitle(car).toLocaleLowerCase('fa').includes(q) || String(car.model||'').toLocaleLowerCase('fa').includes(q)); if(!list.length)return null; return <div key={brand} className="mb-3"><h3 className="sticky top-0 mb-2 rounded-lg px-3 py-2 text-xs font-black" style={{ background: theme.searchBackground, color: theme.tabActiveColor }}>{brand}</h3>{list.map((car) => <button key={car.id} onClick={() => { setActiveCarId(car.id!); saveSelectedCustomerCar(car); setShowCarFilter(false); }} className="mb-2 w-full rounded-xl border px-4 py-3 text-right text-sm font-bold" style={{ background: theme.searchBackground, color: searchTextColor,borderColor:theme.cardBorderColor }}>{getCarTitle(car)}</button>)}</div>})}
            </div>
          </section>
        </div>
      )}

      <div className="container-custom">
        <section className="ct-shop-car-banner" aria-label="فیلتر محصولات بر اساس خودرو">
          <div className="ct-shop-car-banner-grid" aria-hidden="true" />
          <div className="ct-shop-car-banner-speed ct-shop-car-banner-speed-left" aria-hidden="true"><i /><i /><i /></div>
          <div className="ct-shop-car-banner-speed ct-shop-car-banner-speed-right" aria-hidden="true"><i /><i /><i /></div>
          <div className="ct-shop-car-banner-road" aria-hidden="true"><span /></div>

          <div className="ct-shop-car-banner-inner">
            <button
              type="button"
              onClick={() => setShowCarFilter(true)}
              className="ct-shop-car-banner-action"
            >
              <span className="ct-shop-car-banner-action-icon"><CarFront /></span>
              <span className="ct-shop-car-banner-action-copy">
                <small>{activeCar ? 'خودروی انتخاب‌شده' : 'فیلتر هوشمند خودرو'}</small>
                <b>{activeCar ? getCarTitle(activeCar) : 'انتخاب خودرو'}</b>
              </span>
              <ArrowLeft className="ct-shop-car-banner-action-arrow" />
            </button>

            <div className="ct-shop-car-banner-copy">
              <span className="ct-shop-car-banner-kicker">CARRTELL SMART MATCH</span>
              <h3>محصول دقیق برای خودروی شما</h3>
              <p>خودرو را انتخاب کنید تا فقط روغن، فیلتر و قطعات سازگار نمایش داده شوند.</p>
              {activeCar && <span className="ct-shop-car-banner-active">فعال: {getCarTitle(activeCar)}</span>}
            </div>

            <div className="ct-shop-car-banner-visual" aria-hidden="true">
              <span className="ct-shop-car-banner-halo" />
              <CarFront className="ct-shop-car-banner-car" />
              <span className="ct-shop-car-banner-scan" />
            </div>
          </div>
        </section>

        <nav className="ct-shop-compact-categories" aria-label="دسته‌بندی سریع محصولات">
          <Link to="/book" className="ct-shop-compact-service">
            <span className="ct-shop-category-icon-shell"><Wrench aria-hidden="true" /></span>
            <span>سرویس در محل</span>
          </Link>
          <div className="ct-shop-compact-category-scroll">
            <button type="button" onClick={() => setActiveCategory('all')} className={activeCategory === 'all' ? 'is-active' : ''}>
              <span className="ct-shop-category-icon-shell"><Grid3X3 aria-hidden="true" /></span>
              <span>همه دسته‌بندی‌ها</span>
            </button>
            {categoryOptions.slice(0, 9).map((category) => (
              <button key={category.slug} type="button" onClick={() => setActiveCategory(category.slug)} className={activeCategory === category.slug ? 'is-active' : ''}>
                <span className="ct-shop-category-icon-shell"><CategoryQuickIcon category={category} /></span>
                <span>{category.title}</span>
              </button>
            ))}
          </div>
        </nav>

        <section className="mb-4">
          <Link to={activeHero?.link_url || '/shop'} className="group relative min-h-[210px] overflow-hidden rounded-3xl border border-white/10 bg-navy-950 text-white shadow-xl md:min-h-[270px]">
            {activeHero?.image_url ? (
              <img src={activeHero.image_url} alt={activeHero.title || 'بنر فروشگاه Carrtell'} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-l from-gold-500 via-amber-500 to-orange-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/45 to-transparent" />
            <div className="relative z-10 flex min-h-[210px] max-w-xl flex-col justify-center p-6 md:min-h-[270px] md:p-8">
              {activeHero?.badge && <span className="mb-3 w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-black backdrop-blur-md">{activeHero.badge}</span>}
              <h1 className="text-2xl font-black leading-tight drop-shadow md:text-4xl">{activeHero?.title || 'Carrtell'}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/85 md:text-base">{activeHero?.subtitle || 'فروشگاه تخصصی محصولات و خدمات خودرو'}</p>
              <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-black text-navy-950 shadow-lg transition group-hover:bg-gold-400">مشاهده و خرید <ArrowLeft className="h-4 w-4" /></span>
            </div>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur">{banners.map((_, index) => <button aria-label={`نمایش بنر ${index + 1}`} key={index} onClick={(e) => { e.preventDefault(); setActiveBanner(index); }} className={`h-1.5 rounded-full transition-all ${index === activeBanner ? 'w-7 bg-gold-400' : 'w-2 bg-white/60 hover:bg-white'}`} />)}</div>
          </Link>
        </section>



        {packageGroups.length > 0 && (
          <section className="mb-4 rounded-3xl border p-4 shadow-sm" style={{ background: theme.packageBackground, color: packageSectionTextColor, borderColor: sectionBorderColor, borderRadius: theme.borderRadius, fontFamily: theme.packageFontFamily || theme.fontFamily }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black !text-red-600" style={{ color: '#dc2626' }}>پکیج‌های خودرویی</h2>
                <p className="text-xs" style={{ color: packageSectionTextColor, opacity: 0.68 }}>برای هر خودرو، پکیج‌های آماده را ببین و انتخاب کن</p>
              </div>
              <PackageCheck className="h-5 w-5 text-gold-500" />
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2">
              {packageGroups.map((group) => (
                <Link
                  key={group.key}
                  to={`/shop/packages/${group.key}`}
                  className="flex min-w-[118px] flex-col items-center gap-2 border p-3 text-center shadow-sm transition hover:-translate-y-0.5"
                  style={{ fontFamily: group.font || theme.packageFontFamily || theme.fontFamily, background: theme.packageCardBackground, color: packageCardTextColor, borderColor: cardBorderColor, borderRadius: theme.borderRadius }}
                >
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full shadow-sm" style={{ background: theme.packageIconBackground || theme.packageBackground }}>
                    {group.imageUrl ? <img src={group.imageUrl} alt={group.title} className="h-full w-full object-cover" /> : <PackageCheck className="h-9 w-9" style={{ color: theme.primaryColor }} />}
                  </div>
                  <span className="line-clamp-1 text-xs font-black" style={{ color: theme.packageTextColor }}>{group.title}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: theme.packageBadgeBackground, color: getReadableTextColor(theme.packageBadgeBackground, theme.packageTextColor) }}>{group.count} پکیج</span>
                </Link>
              ))}
              <ViewAllPackageCard theme={theme} />
            </div>
          </section>
        )}

        {amazingProducts.length > 0 && (
          <section className="mb-4 overflow-hidden rounded-3xl border p-3 shadow-sm" style={{ background: theme.amazingBackground, color: amazingSectionTextColor, borderColor: sectionBorderColor, borderRadius: theme.borderRadius, fontFamily: theme.amazingFontFamily || theme.fontFamily }}>
            <div className="mb-3 flex items-center justify-between px-2">
              <div><h2 className="text-xl font-black !text-red-600" style={{ color: '#dc2626' }}>{amazingSection?.title || 'پیشنهاد شگفت‌انگیز'}</h2><p className="text-xs" style={{ color: amazingSectionTextColor, opacity: 0.72 }}>{amazingSection?.subtitle || 'بزرگ‌ترین حراج امروز'}</p></div>
              <div className="flex items-center gap-1 text-slate-950"><span className="rounded px-2 py-1 text-xs font-black" style={{ background: theme.amazingTimerBackground, color: theme.amazingTimerTextColor }}>{countdown.h}</span><span className="rounded px-2 py-1 text-xs font-black" style={{ background: theme.amazingTimerBackground, color: theme.amazingTimerTextColor }}>{countdown.m}</span><span className="rounded px-2 py-1 text-xs font-black" style={{ background: theme.amazingTimerBackground, color: theme.amazingTimerTextColor }}>{countdown.s}</span></div>
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">{amazingProducts.map((product) => <ProductCard key={product.id} product={product} reservedQuantity={product.id ? reservedQuantityByProductId[product.id] || 0 : 0} onAddToCart={addToCart} compact theme={{ ...theme, cardBackground: theme.amazingCardBackground, productInfoBackground: theme.amazingCardBackground }} ratingSummary={product.id ? reviewSummaries[product.id] : undefined} />)}<ViewAllCard to="/shop/special-offers" label="همه پیشنهادها" compact theme={{ ...theme, cardBackground: theme.amazingCardBackground }} /></div>
          </section>
        )}

        {tabSections.length > 0 && (
          <section className="mb-4 rounded-3xl border p-4 shadow-sm" style={{ background: theme.tabSectionBackground, color: tabSectionTextColor, borderColor: sectionBorderColor, borderRadius: theme.borderRadius, fontFamily: theme.tabFontFamily || theme.fontFamily }}>
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-black !text-red-600" style={{ color: '#dc2626' }}>{todayShoppingSettings.title}</h2>{todayShoppingSettings.subtitle && <p className="mt-1 text-xs" style={{ color: theme.mutedTextColor }}>{todayShoppingSettings.subtitle}</p>}</div><Link to="/shop/featured" className="text-xs font-bold" style={{ color: theme.tabActiveColor }}>مشاهده همه</Link></div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {tabSections.map((section) => (
                <button
                  key={section.slug}
                  onClick={() => setActiveTabSlug(section.slug)}
                  className="min-w-max rounded-2xl border px-4 py-2 text-sm font-bold transition"
                  style={activeTab?.slug === section.slug
                    ? { borderColor: theme.tabActiveColor, color: theme.tabActiveColor, background: `${theme.tabActiveColor}12` }
                    : { borderColor: theme.cardBorderColor, color: theme.tabInactiveTextColor, background: theme.tabInactiveBackground }}
                >
                  {section.title}
                </button>
              ))}
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">{tabProducts.map((product) => <ProductCard key={product.id} product={product} reservedQuantity={product.id ? reservedQuantityByProductId[product.id] || 0 : 0} onAddToCart={addToCart} theme={theme} selectedCarId={activeCarId !== 'all' ? activeCarId : undefined} ratingSummary={product.id ? reviewSummaries[product.id] : undefined} />)}<ViewAllCard to="/shop/featured" label="همه محصولات منتخب" theme={theme} /></div>
          </section>
        )}


        <ShopPromoCards categories={categories} />

        <section
          id="main-store"
          className="mb-0 overflow-hidden rounded-2xl bg-white"
          style={{
            background: theme.productListBackground,
            color: productListTextColor,
            border: '2px solid #ff1744',
            borderRadius: '18px',
            boxShadow: '0 0 0 1px rgba(255,23,68,0.15), 0 10px 28px rgba(255,23,68,0.18)',
            fontFamily: theme.productCardFontFamily || theme.fontFamily,
          }}
        >
          <div className="border-b px-3 py-2" style={{ borderColor: sectionBorderColor }}>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black !text-red-600" style={{ color: '#dc2626' }}>فروشگاه اصلی</h2>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: `${theme.primaryColor}18`, color: theme.primaryColor }}>{filtered.length.toLocaleString('fa-IR')} محصول</span>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: theme.mutedTextColor }}>جستجو، فیلتر و مرتب‌سازی سریع محصولات</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setShowShopFilters(true)} className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-black lg:hidden" style={{ borderColor: theme.cardBorderColor, background: theme.productFilterBackground, color: theme.productFilterTextColor }}>
                  <SlidersHorizontal className="h-3.5 w-3.5" /> فیلترها
                  {activeFilterCount > 0 && <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>{activeFilterCount}</span>}
                  <ChevronDown className="h-3.5 w-3.5 lg:hidden" />
                </button>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-8 rounded-lg border px-2.5 text-[11px] font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  <option value="popular">پیشنهادی</option>
                  <option value="featured">ویژه‌ها</option>
                  <option value="best-seller">پرفروش‌ترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                  <option value="price-asc">ارزان‌ترین</option>
                  <option value="price-desc">گران‌ترین</option>
                </select>
                <Link to="/shop/all-products" className="flex h-8 items-center rounded-lg px-2.5 text-[11px] font-black" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>نمایش همه</Link>
              </div>
            </div>



            <div
              className="mt-3 hidden rounded-2xl border p-2.5 shadow-sm lg:block"
              style={{ borderColor: theme.cardBorderColor, background: theme.productFilterBackground, color: theme.productFilterTextColor }}
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  <b className="text-sm">فیلتر محصولات</b>
                  {activeFilterCount > 0 && <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>{activeFilterCount}</span>}
                </div>
                <button type="button" onClick={clearShopFilters} disabled={activeFilterCount === 0} className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-black disabled:opacity-40" style={{ borderColor: theme.cardBorderColor }}>
                  <RotateCcw className="h-3.5 w-3.5" /> پاک کردن فیلترها
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.35fr_auto]">
                <label className="min-w-0">
                  <span className="sr-only">دسته‌بندی</span>
                  <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-[11px] font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                    <option value="all">دسته‌بندی: همه دسته‌ها</option>
                    {categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
                  </select>
                </label>
                <label className="min-w-0">
                  <span className="sr-only">برند</span>
                  <select value={activeBrand} onChange={(event) => setActiveBrand(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-[11px] font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                    <option value="all">برند: همه برندها</option>
                    {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </label>
                <label className="min-w-0">
                  <span className="sr-only">وضعیت</span>
                  <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)} className="h-10 w-full rounded-xl border px-3 text-[11px] font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                    <option value="all">وضعیت: همه وضعیت‌ها</option>
                    <option value="available">فقط موجود</option>
                    <option value="low-stock">موجودی محدود</option>
                    <option value="amazing">شگفت‌انگیز</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min={0} value={minPrice} onChange={(event) => setMinPrice(Math.max(0, Number(event.target.value) || 0))} placeholder="حداقل قیمت" className="h-10 min-w-0 rounded-xl border px-2 text-[11px] outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }} />
                  <input type="number" min={0} value={maxPrice ?? ''} onChange={(event) => setMaxPrice(event.target.value ? Math.max(0, Number(event.target.value)) : null)} placeholder={`حداکثر ${formatPrice(highestProductPrice)}`} className="h-10 min-w-0 rounded-xl border px-2 text-[11px] outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }} />
                </div>
                <button type="button" onClick={() => setShowShopFilters(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-black lg:hidden" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  فیلترهای بیشتر <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowCarFilter(true)} className="hidden h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[11px] font-black text-amber-400 lg:flex">
                  <CarFront className="h-4 w-4" /> {activeCar ? getCarTitle(activeCar) : 'انتخاب خودرو'}
                </button>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {search.trim() && <button onClick={() => setSearch('')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>جستجو: {search} ×</button>}
                {activeCategory !== 'all' && <button onClick={() => setActiveCategory('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{categoryOptions.find((item) => item.slug === activeCategory)?.title || activeCategory} ×</button>}
                {activeBrand !== 'all' && <button onClick={() => setActiveBrand('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{activeBrand} ×</button>}
                {availabilityFilter !== 'all' && <button onClick={() => setAvailabilityFilter('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{availabilityFilter === 'available' ? 'موجود' : availabilityFilter === 'low-stock' ? 'موجودی محدود' : 'شگفت‌انگیز'} ×</button>}
                {activeCar && <button onClick={() => { setActiveCarId('all'); saveSelectedCustomerCar(null); }} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{getCarTitle(activeCar)} ×</button>}
              </div>
            )}
          </div>

          <div className="px-1.5 py-2 md:px-2">
            <div className="min-w-0">
            <ShopProductGrid
              products={filtered}
              visibleCount={visibleProductCount}
              mutedTextColor={theme.mutedTextColor}
              primaryColor={theme.primaryColor}
              onLoadMore={() => setVisibleProductCount((current) => Math.min(current + 12, filtered.length))}
              onClearFilters={clearShopFilters}
              renderProduct={(product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  reservedQuantity={product.id ? reservedQuantityByProductId[product.id] || 0 : 0}
                  onAddToCart={addToCart}
                  onChangeQuantity={changeQuantity}
                  grid
                  theme={theme}
                  selectedCarId={activeCarId !== 'all' ? activeCarId : undefined}
                  ratingSummary={product.id ? reviewSummaries[product.id] : undefined}
                />
              )}
            />
            </div>
          </div>
        </section>


      </div>

    </main>
  );
}
