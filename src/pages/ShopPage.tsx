import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CarFront,
  ChevronDown,
  Droplets,
  Grid3X3,
  Home,
  Heart,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  User,
  RotateCcw,
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
import { addProductToCart, readCart, type CartItem } from '../lib/cart';
import { onSelectedCustomerCarChange, readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import { getApprovedProductReviewSummaries, type ProductReviewSummary } from '../admin/services/customerReviewsApi';
import '../styles/carrtellFonts.css';


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


function productMatchesCar(product: Product, carId: string) {
  if (!carId || carId === 'all') return true;
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

export function ProductCard({ product, reservedQuantity, onAddToCart, compact = false, grid = false, theme = defaultThemeSettings, selectedCarId, ratingSummary }: { product: Product; reservedQuantity: number; onAddToCart: (product: Product) => void; compact?: boolean; grid?: boolean; theme?: ThemeSettings; selectedCarId?: string; ratingSummary?: ProductReviewSummary }) {
  const isAvailable = isProductAvailable(product, reservedQuantity);
  const amazingActive = isAmazingActive(product);
  const finalPrice = getProductFinalPrice(product);
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
  const infoBg = theme.productInfoBackground || theme.cardBackground || '#0f172a';
  const productTextColor = getReadableTextColor(infoBg, theme.textColor);
  const productMutedColor = isDarkColor(infoBg) ? '#cbd5e1' : theme.mutedTextColor;
  const priceColor = theme.productPriceColor || productTextColor;
  const shortDescription = getProductShortDescription(product);
  const cardFeatures = (product.card_features || '').trim() || [product.oil_grade, product.quality_level, product.transmission_type].filter(Boolean).join(' • ') || shortDescription;
  const hoverDetails = [product.name, product.brand && `برند ${product.brand}`, cardFeatures, shortDescription].filter(Boolean).join(' | ');
  const cardWidth = grid ? 'w-full min-w-0 max-w-[176px] justify-self-center' : compact ? 'min-w-[138px] max-w-[138px] md:min-w-[148px] md:max-w-[148px]' : 'min-w-[148px] max-w-[148px] md:min-w-[160px] md:max-w-[160px]';
  const cardBorderColor = theme.cardBorderColor;
  const compatibilityStatus = !selectedCarId
    ? null
    : product.compatible_all_cars || (product.compatible_car_ids || []).includes(selectedCarId)
      ? 'compatible'
      : (product.compatible_car_ids || []).length > 0
        ? 'incompatible'
        : 'unknown';
  const recommendationReason = (product.recommendation_reason || '').trim() || (compatibilityStatus === 'compatible' ? 'پیشنهاد Carrtell برای خودروی انتخابی شما' : '');

  return (
    <article
      title={`${hoverDetails} | قیمت ${formatPrice(finalPrice)} تومان`}
      aria-label={`مشاهده اطلاعات ${product.name}`}
      className={`group relative flex ${grid ? 'h-[238px]' : 'h-[232px]'} ${cardWidth} flex-col overflow-hidden border shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
      style={{ background: theme.cardBackground, borderColor: cardBorderColor, borderRadius: theme.borderRadius, fontFamily: theme.productCardFontFamily || theme.fontFamily }}
    >
      <Link to={`/shop/product/${product.id}`} className={`relative flex ${grid ? 'h-[96px]' : 'h-[92px]'} shrink-0 items-center justify-center overflow-hidden`} style={{ background: imageBg }}>
        {product.image_url ? (
          <img src={product.image_url} alt={`${product.name}${product.brand ? ` از برند ${product.brand}` : ''}؛ ${cardFeatures}`} loading="lazy" className="h-full w-full object-contain p-2.5 transition duration-300 group-hover:scale-105" />
        ) : (
          <Droplets className="h-11 w-11 text-slate-300" />
        )}
        {ratingSummary && ratingSummary.count > 0 && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-amber-200 bg-white/95 px-1.5 py-1 text-[10px] font-black text-amber-600 shadow-sm"><Star className="h-3 w-3 fill-current" />{ratingSummary.average.toFixed(1)}</span>}
        {!isAvailable && <span className="absolute left-2 top-2 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-bold text-white">ناموجود</span>}
        {isAvailable && amazingActive && <span className="absolute right-2 top-2 rounded-lg px-2 py-1 text-[10px] font-black" style={{ background: theme.amazingBadgeBackground, color: getReadableTextColor(theme.amazingBadgeBackground, '#ffffff') }}>شگفت‌انگیز</span>}
        {isAvailable && !amazingActive && product.is_featured && <span className="absolute right-2 top-2 rounded-lg px-2 py-1 text-[10px] font-black" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>ویژه</span>}
        <button
          type="button"
          onClick={toggleFavorite}
          className={`absolute left-2 bottom-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm backdrop-blur transition hover:scale-105 active:scale-95 ${isFavorite ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-white/70 bg-white/85 text-slate-500 hover:text-rose-500'}`}
          aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          title={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        {compatibilityStatus === 'compatible' && <span className="absolute bottom-2 right-2 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-black text-white shadow-lg">مناسب خودروی شما</span>}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-2.5" style={{ background: infoBg, color: productTextColor }}>
        <p className="mb-0.5 h-3.5 truncate text-[10px]" style={{ color: productMutedColor }}>{product.brand || 'Carrtell'}</p>
        <Link to={`/shop/product/${product.id}`} className="block h-9 line-clamp-2 text-[12px] font-black leading-[1.05rem] transition group-hover:text-gold-500" style={{ color: productTextColor }}>
          {product.name}
        </Link>
        <p
          className="mt-0.5 h-5 overflow-hidden text-[9px] leading-5 line-clamp-1"
          style={{ color: productMutedColor }}
          title={hoverDetails}
        >
          {cardFeatures}
        </p>
        {amazingActive ? (
          <div className="mt-0.5 flex h-4 justify-start gap-1 text-[8px] font-black text-pink-600">
            <span className="rounded bg-pink-50 px-1.5 leading-5">{itemCountdown.h}</span>
            <span className="rounded bg-pink-50 px-1.5 leading-5">{itemCountdown.m}</span>
            <span className="rounded bg-pink-50 px-1.5 leading-5">{itemCountdown.s}</span>
          </div>
        ) : recommendationReason && compatibilityStatus === 'compatible' ? (
          <p className="mt-0.5 h-4 truncate text-[8px] font-bold leading-4 text-emerald-500" title={recommendationReason}>✓ {recommendationReason}</p>
        ) : (
          <div className="mt-0.5 h-4" />
        )}
        <div className="mt-auto flex h-8 items-end justify-between gap-1.5">
          <div className="min-w-0">
            <p className="h-3 text-[10px] leading-3 text-slate-400 line-through">{amazingActive ? formatPrice(product.price) : ''}</p>
            <div className="flex items-baseline gap-1">
              <b className="truncate text-xs" style={{ color: priceColor }}>{formatPrice(finalPrice)}</b>
              <span className="text-[10px]" style={{ color: productMutedColor }}>تومان</span>
            </div>
          </div>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product); }}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${isAvailable ? 'text-navy-950 hover:brightness-95' : 'bg-slate-100 text-slate-300'}`}
            style={isAvailable ? { background: theme.addButtonBackground || theme.primaryColor } : undefined}
            aria-label="افزودن به سبد خرید"
          >
            <Plus className="h-4 w-4" />
          </button>
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
  const [searchParams] = useSearchParams();
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
  const [showShopFilters, setShowShopFilters] = useState(true);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCarFilter, setShowCarFilter] = useState(false);
  const [carFilterSearch, setCarFilterSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [nowTick, setNowTick] = useState(0);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [todayShoppingSettings, setTodayShoppingSettings] = useState<TodayShoppingSettings>(defaultTodayShoppingSettings);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ProductReviewSummary>>({});
  const [visibleProductCount, setVisibleProductCount] = useState(25);

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
        setProducts(productsData.filter((p) => p.is_active));
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
  }, [searchParams]);

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
    setVisibleProductCount(25);
  }, [search, activeCategory, activeBrand, activeCarId, availabilityFilter, sortBy]);

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

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') result = result.filter((p) => p.category === activeCategory);
    if (activeBrand !== 'all') result = result.filter((p) => p.brand === activeBrand);
    if (activeCarId !== 'all') result = result.filter((p) => productMatchesCar(p, activeCarId));
    if (availabilityFilter === 'available') result = result.filter((p) => isProductAvailable(p, reservedQuantityByProductId[p.id || ''] || 0));
    if (availabilityFilter === 'low-stock') result = result.filter((p) => !p.is_out_of_stock && Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 2);
    if (availabilityFilter === 'amazing') result = result.filter(isAmazingActive);
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
  }, [products, search, activeCategory, activeBrand, activeCarId, availabilityFilter, sortBy, categories, cars, reservedQuantityByProductId, reviewSummaries]);

  const activeFilterCount = [activeCategory !== 'all', activeBrand !== 'all', activeCarId !== 'all', availabilityFilter !== 'all', Boolean(search.trim())].filter(Boolean).length;
  const activeCar = activeCarId !== 'all' ? cars.find((car) => car.id === activeCarId) : null;

  function clearShopFilters() {
    setSearch('');
    setActiveCategory('all');
    setActiveBrand('all');
    setAvailabilityFilter('all');
    setActiveCarId('all');
    saveSelectedCustomerCar(null);
    setSortBy('popular');
  }

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    const result = addProductToCart(product, 1);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    setCart(result.cart || readCart());
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
    <main className="ct-shop-page min-h-screen pb-28 pt-24" style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      {showCategoryMenu && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowCategoryMenu(false)}>
          <div className="h-full w-[82%] max-w-sm overflow-y-auto p-5 shadow-2xl" style={{ background: theme.surfaceColor, color: categoryPanelTextColor }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between"><b>دسته‌بندی‌ها</b><button onClick={() => setShowCategoryMenu(false)}><X /></button></div>
            <div className="max-h-[calc(100vh-100px)] space-y-2 overflow-y-auto pl-1">
              <button onClick={() => { setActiveCategory('all'); setShowCategoryMenu(false); }} className="w-full rounded-2xl px-4 py-3 text-right font-bold" style={{ background: theme.productFilterBackground, color: theme.productFilterTextColor, borderColor: theme.cardBorderColor }}>همه محصولات</button>
              {categoryOptions.map((category) => <button key={category.slug} onClick={() => { setActiveCategory(category.slug); setShowCategoryMenu(false); }} className="w-full rounded-2xl px-4 py-3 text-right font-bold" style={{ background: theme.searchBackground, color: searchTextColor }}>{category.title}</button>)}
            </div>
          </div>
        </div>
      )}

      {showCarFilter && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowCarFilter(false)}>
          <div className="mr-auto h-full w-[88%] max-w-md overflow-auto p-5 shadow-2xl" style={{ background: theme.surfaceColor, color: surfaceTextColor }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><b>انتخاب خودرو</b><button onClick={() => setShowCarFilter(false)}><X /></button></div>
            <div className="relative mb-4"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={carFilterSearch} onChange={(e) => setCarFilterSearch(e.target.value)} placeholder="جستجوی خودرو..." className="w-full rounded-2xl border py-3 pl-4 pr-10 text-sm" style={{ background: theme.productFilterBackground, color: theme.productFilterTextColor, borderColor: theme.cardBorderColor }} /></div>
            <button onClick={() => { setActiveCarId('all'); saveSelectedCustomerCar(null); setShowCarFilter(false); }} className="mb-4 w-full rounded-2xl px-4 py-3 text-right text-sm font-black" style={{ background: theme.carFilterButtonBackground, color: getReadableTextColor(theme.carFilterButtonBackground, '#0f172a') }}>همه خودروها</button>
            {Object.entries(groupedCars).map(([brand, brandCars]) => <div key={brand} className="mb-4"><h3 className="mb-2 rounded-xl px-3 py-2 text-xs font-black" style={{ background: theme.searchBackground, color: theme.tabActiveColor }}>{brand}</h3>{brandCars.map((car) => <button key={car.id} onClick={() => { setActiveCarId(car.id!); saveSelectedCustomerCar(car); setShowCarFilter(false); }} className="mb-2 w-full rounded-2xl px-4 py-3 text-right text-sm font-bold" style={{ background: theme.searchBackground, color: searchTextColor }}>{getCarTitle(car)}</button>)}</div>)}
          </div>
        </div>
      )}

      <div className="container-custom">
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

        <section className="mb-4 rounded-3xl border p-4 shadow-sm" style={{ background: theme.categorySectionBackground, color: categorySectionTextColor, borderColor: sectionBorderColor, borderRadius: theme.borderRadius, fontFamily: theme.categoryFontFamily || theme.fontFamily }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black" style={{ color: categorySectionTextColor }}>دسته‌بندی محصولات</h2>
              <p className="mt-1 text-[11px] opacity-70" style={{ color: categorySectionTextColor }}>سریع‌تر به محصول موردنظرت برس</p>
            </div>
            {activeCategory !== 'all' && <button onClick={() => setActiveCategory('all')} className="rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold" style={{ color: categorySectionTextColor }}>نمایش همه</button>}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categoryOptions.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <button key={category.slug} onClick={() => setActiveCategory(category.slug)} className={`ct-category-card group flex min-w-[96px] flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center transition duration-300 ${isActive ? '-translate-y-0.5 shadow-md' : 'hover:-translate-y-0.5'}`} style={{ '--ct-category-card-bg': isActive ? theme.categoryCardActiveBackground : theme.categoryCardBackground, '--ct-category-card-hover': isActive ? theme.categoryCardActiveBackground : theme.categoryCardHoverBackground, background: isActive ? theme.categoryCardActiveBackground : theme.categoryCardBackground, borderColor: isActive ? theme.primaryColor : theme.cardBorderColor } as React.CSSProperties}>
                  <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-2xl shadow-sm transition duration-300 group-hover:scale-105 ${isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''}`} style={{ background: theme.categoryIconBackground, ...(isActive ? { boxShadow: `0 0 0 2px ${theme.primaryColor}` } : {}) }}>
                    {category.image_url ? <img src={category.image_url} alt={`دسته‌بندی ${category.title}`} className="h-full w-full object-cover" /> : category.icon_emoji || <Droplets className="h-7 w-7 text-pink-500" />}
                  </div>
                  <span className="line-clamp-2 min-h-[32px] text-xs font-black leading-4" style={{ color: isActive ? theme.categoryCardActiveTextColor : categorySectionTextColor }}>{category.title}</span>
                </button>
              );
            })}
          </div>
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


        <section
          id="main-store"
          className="mb-6 overflow-hidden rounded-2xl bg-white"
          style={{
            background: theme.productListBackground,
            color: productListTextColor,
            border: '2px solid #ef233c',
            borderRadius: '18px',
            boxShadow: '0 10px 30px rgba(239, 35, 60, 0.16)',
            fontFamily: theme.productCardFontFamily || theme.fontFamily,
          }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: sectionBorderColor }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black !text-red-600" style={{ color: '#dc2626' }}>فروشگاه اصلی</h2>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: `${theme.primaryColor}18`, color: theme.primaryColor }}>{filtered.length.toLocaleString('fa-IR')} محصول</span>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: theme.mutedTextColor }}>جستجو، فیلتر و مرتب‌سازی سریع محصولات</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowShopFilters((current) => !current)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black" style={{ borderColor: theme.cardBorderColor, background: theme.productFilterBackground, color: theme.productFilterTextColor }}>
                  <SlidersHorizontal className="h-4 w-4" /> فیلترها
                  {activeFilterCount > 0 && <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>{activeFilterCount}</span>}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${showShopFilters ? 'rotate-180' : ''}`} />
                </button>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border px-3 py-2 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  <option value="popular">پیشنهادی</option>
                  <option value="featured">ویژه‌ها</option>
                  <option value="best-seller">پرفروش‌ترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                  <option value="price-asc">ارزان‌ترین</option>
                  <option value="price-desc">گران‌ترین</option>
                </select>
                <Link to="/shop/all-products" className="rounded-xl px-3 py-2 text-xs font-black" style={{ background: theme.primaryColor, color: getReadableTextColor(theme.primaryColor, '#0f172a') }}>نمایش همه</Link>
              </div>
            </div>

            {activeCar && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: `${theme.primaryColor}55`, background: `${theme.primaryColor}0d` }}>
                <div className="flex items-center gap-2 text-xs font-bold"><CarFront className="h-4 w-4" style={{ color: theme.primaryColor }} /><span>خودروی فعال: <b>{getCarTitle(activeCar)}</b></span></div>
                <button type="button" onClick={() => setShowCarFilter(true)} className="text-[11px] font-black" style={{ color: theme.primaryColor }}>تغییر خودرو</button>
              </div>
            )}

            {showShopFilters && (
              <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(130px,1fr))_auto]">
                <label className="relative block">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="نام، برند، گرید یا خودرو..." className="h-10 w-full rounded-xl border pl-3 pr-9 text-xs outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }} />
                </label>
                <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="h-10 rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  <option value="all">همه دسته‌ها</option>
                  {categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
                </select>
                <select value={activeBrand} onChange={(event) => setActiveBrand(event.target.value)} className="h-10 rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  <option value="all">همه برندها</option>
                  {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
                <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)} className="h-10 rounded-xl border px-3 text-xs font-bold outline-none" style={{ borderColor: theme.cardBorderColor, background: theme.searchBackground, color: searchTextColor }}>
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="available">فقط موجود</option>
                  <option value="low-stock">موجودی محدود</option>
                  <option value="amazing">شگفت‌انگیز</option>
                </select>
                <button type="button" onClick={clearShopFilters} disabled={activeFilterCount === 0} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40" style={{ borderColor: theme.cardBorderColor, color: theme.mutedTextColor }}><RotateCcw className="h-3.5 w-3.5" /> پاک کردن</button>
              </div>
            )}

            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {search.trim() && <button onClick={() => setSearch('')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>جستجو: {search} ×</button>}
                {activeCategory !== 'all' && <button onClick={() => setActiveCategory('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{categoryOptions.find((item) => item.slug === activeCategory)?.title || activeCategory} ×</button>}
                {activeBrand !== 'all' && <button onClick={() => setActiveBrand('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{activeBrand} ×</button>}
                {availabilityFilter !== 'all' && <button onClick={() => setAvailabilityFilter('all')} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{availabilityFilter === 'available' ? 'موجود' : availabilityFilter === 'low-stock' ? 'موجودی محدود' : 'شگفت‌انگیز'} ×</button>}
                {activeCar && <button onClick={() => { setActiveCarId('all'); saveSelectedCustomerCar(null); }} className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: theme.cardBorderColor }}>{getCarTitle(activeCar)} ×</button>}
              </div>
            )}
          </div>

          <div className="px-3 py-3 md:px-4 md:py-4">
            {filtered.length > 0 && (
              <>
                <div className="grid grid-cols-2 justify-items-center gap-x-1.5 gap-y-2 sm:grid-cols-3 lg:grid-cols-5 xl:gap-x-2">
                  {filtered.slice(0, visibleProductCount).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      reservedQuantity={product.id ? reservedQuantityByProductId[product.id] || 0 : 0}
                      onAddToCart={addToCart}
                      grid
                      theme={theme}
                      selectedCarId={activeCarId !== 'all' ? activeCarId : undefined}
                      ratingSummary={product.id ? reviewSummaries[product.id] : undefined}
                    />
                  ))}
                </div>
                {visibleProductCount < filtered.length ? (
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleProductCount((current) => Math.min(current + 25, filtered.length))}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
                      aria-label="نمایش محصولات بیشتر"
                      title="نمایش ۲۵ محصول بیشتر"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                    <span className="text-xs font-black text-red-600">نمایش ۲۵ محصول بیشتر</span>
                  </div>
                ) : (
                  <p className="mt-4 text-center text-xs font-bold" style={{ color: theme.mutedTextColor }}>همه محصولات نمایش داده شد.</p>
                )}
              </>
            )}
            {filtered.length === 0 && <div className="py-12 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="font-black text-slate-500">محصولی با این فیلترها پیدا نشد</p><button type="button" onClick={clearShopFilters} className="mt-3 text-xs font-black" style={{ color: theme.primaryColor }}>حذف همه فیلترها</button></div>}
          </div>
        </section>


      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 px-4 py-2 backdrop-blur-xl md:hidden" style={{ background: theme.footerBackground, fontFamily: theme.footerFontFamily || theme.fontFamily }}>
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 text-slate-500">
          <Link to="/" className="flex flex-col items-center gap-1 rounded-2xl p-2 hover:text-pink-600"><Home className="h-6 w-6" /></Link>
          <button onClick={() => setShowCategoryMenu(true)} className="flex flex-col items-center gap-1 rounded-2xl p-2 hover:text-pink-600"><Grid3X3 className="h-6 w-6" /></button>
          <Link to="/cart" className="relative flex flex-col items-center gap-1 rounded-2xl p-2 hover:text-pink-600"><ShoppingCart className="h-6 w-6" />{cartCount > 0 && <span className="absolute right-6 top-1 rounded-full bg-pink-600 px-1.5 text-[10px] font-black text-white">{cartCount}</span>}</Link>
          <Link to="/dashboard" className="flex flex-col items-center gap-1 rounded-2xl p-2 hover:text-pink-600"><User className="h-6 w-6" /></Link>
        </div>
      </nav>
    </main>
  );
}
