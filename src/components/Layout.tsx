import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  CircleUserRound,
  Package,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { brandConfig } from '../config/brand';
import { buildCategoryTree, getCategoryDescendantIds, getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { getProducts, getStorefrontSearchProducts, type Product } from '../admin/services/productsApi';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import {
  onSelectedCustomerCarChange,
  readSelectedCustomerCar,
  saveSelectedCustomerCar,
} from '../customer/services/selectedCar';
import { useAuth } from '../auth/AuthProvider';
import MiniCart from './MiniCart';


function normalizeLiveSearch(value: unknown) {
  return String(value || '')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/‌/g, ' ')
    .replace(/[^0-9a-zآ-ی]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const fallbackAccessLinks = [
  { label: 'پیشنهاد شگفت‌انگیز', to: '/#amazing-offers', emoji: '⚡' },
  { label: 'پرفروش‌ها', to: '/?sort=best-seller', emoji: '🔥' },
  { label: 'پکیج‌های خودرویی', to: '/#packages', emoji: '📦' },
  { label: 'مکمل‌های خودرو', to: '/?category=additive', emoji: '🧪' },
  { label: 'روغن گیربکس اتومات', to: '/?category=automatic-transmission-oil', emoji: '⚙️' },
  { label: 'ضدیخ / ضدجوش', to: '/?category=antifreeze', emoji: '❄️' },
];

function CarrtellLogo() {
  return (
    <Link to="/" className="ct-new-header-logo shrink-0" aria-label="صفحه اصلی Carrtell">
      <img src={brandConfig.logo} alt={brandConfig.name} className="h-10 w-auto object-contain sm:h-11" />
    </Link>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
  const [drawerCategoryPath, setDrawerCategoryPath] = useState<string[]>([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCustomerCar, setSelectedCustomerCar] = useState(() => readSelectedCustomerCar());
  const [allCars, setAllCars] = useState<AdminCar[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const [vehicleNotice, setVehicleNotice] = useState('');
  const [vehicleNoticeCorner, setVehicleNoticeCorner] = useState(false);
  const [vehicleNoticeDismissed, setVehicleNoticeDismissed] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const vehiclePickerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const [searchPanelStyle, setSearchPanelStyle] = useState<CSSProperties & Record<string, string | number>>({});
  const drawerMegaCloseTimer = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, user, loading: authLoading, signOut } = useAuth();
  const showGlobalSearch = location.pathname === '/' || location.pathname === '/shop';
  const loginReturnTo = `${location.pathname}${location.search}${location.hash}`;
  const loginTo = `/login-otp?returnTo=${encodeURIComponent(loginReturnTo)}`;
  // The homepage keeps its compact category rail. Shop owns the richer cascade,
  // while checkout, account and product-detail routes stay uncluttered.
  const showStorefrontBars = location.pathname === '/';

  const keepDrawerMegaOpen = () => {
    if (drawerMegaCloseTimer.current !== null) {
      window.clearTimeout(drawerMegaCloseTimer.current);
      drawerMegaCloseTimer.current = null;
    }
    setDrawerCategoriesOpen(true);
    if (!drawerCategoryPath.length && categoryRoots[0]?.id) setDrawerCategoryPath([categoryRoots[0].id]);
  };

  const scheduleDrawerMegaClose = () => {
    if (drawerMegaCloseTimer.current !== null) window.clearTimeout(drawerMegaCloseTimer.current);
    drawerMegaCloseTimer.current = window.setTimeout(() => {
      setDrawerCategoriesOpen(false);
      drawerMegaCloseTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDrawerCategoriesOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const unsubscribe = onSelectedCustomerCarChange(() => setSelectedCustomerCar(readSelectedCustomerCar()));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const syncFavorites = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem('carrtell:favorites') || '[]');
        setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setFavoritesCount(0);
      }
    };
    syncFavorites();
    window.addEventListener('carrtell:favorites-changed', syncFavorites);
    window.addEventListener('storage', syncFavorites);
    return () => {
      window.removeEventListener('carrtell:favorites-changed', syncFavorites);
      window.removeEventListener('storage', syncFavorites);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getActiveCarsForCustomer()
      .then((items) => {
        if (mounted) setAllCars(items || []);
      })
      .catch(() => {
        if (mounted) setAllCars([]);
      });
    return () => { mounted = false; };
  }, []);

  async function loadSearchCatalog() {
    setSearchLoading(true);
    setSearchError('');
    try {
      const [categoryItems, productItems] = await Promise.all([
        getProductCategories().catch(() => []),
        getStorefrontSearchProducts(600),
      ]);
      setCategories((categoryItems || []).filter((item) => item?.is_active !== false));
      setProducts((productItems || []).filter((item) => Boolean(item && item.is_active !== false && item.name)));
    } catch (error) {
      console.error('Carrtell live search catalog failed', error);
      try {
        const fallbackProducts = await getProducts();
        setProducts((fallbackProducts || []).filter((item) => Boolean(item && item.is_active !== false && item.name)));
      } catch (fallbackError) {
        console.error('Carrtell live search fallback failed', fallbackError);
        setProducts([]);
        setSearchError('دریافت محصولات جستجو ناموفق بود. دوباره تلاش کن.');
      }
    } finally {
      setSearchLoading(false);
    }
  }

  function updateSearchPanelPosition() {
    const anchor = searchRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const horizontalGap = viewportWidth < 768 ? 10 : 0;
    setSearchPanelStyle({
      '--ct-search-top': `${Math.max(8, rect.bottom + 7)}px`,
      '--ct-search-left': `${viewportWidth < 768 ? horizontalGap : rect.left}px`,
      '--ct-search-width': `${viewportWidth < 768 ? Math.max(0, viewportWidth - horizontalGap * 2) : rect.width}px`,
      '--ct-search-max-height': viewportWidth < 768 ? 'min(56dvh, 520px)' : 'min(70vh, 600px)',
    });
  }

  useEffect(() => {
    void loadSearchCatalog();
  }, []);

  useEffect(() => {
    if (!searchOpen || !normalizeLiveSearch(searchText)) return;
    updateSearchPanelPosition();
    const onViewportChange = () => updateSearchPanelPosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
    };
  }, [searchOpen, searchText]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const node = event.target as Node;
      if (mobileOpen && menuRef.current && !menuRef.current.contains(node)) setMobileOpen(false);
      if (accountOpen && accountRef.current && !accountRef.current.contains(node)) setAccountOpen(false);
      if (vehiclePickerOpen && vehiclePickerRef.current && !vehiclePickerRef.current.contains(node)) setVehiclePickerOpen(false);
      if (searchOpen && searchRef.current && !searchRef.current.contains(node) && !searchPanelRef.current?.contains(node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [mobileOpen, accountOpen, vehiclePickerOpen, searchOpen]);

  useEffect(() => {
    if (!mobileOpen && !vehiclePickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen, vehiclePickerOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = searchText.trim();
    setSearchOpen(false);
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
  }

  async function handleSignOut() {
    await signOut();
    saveSelectedCustomerCar(null);
    localStorage.removeItem('carrtell_selected_car');
    localStorage.removeItem('carrtell:shop-filters');
    localStorage.removeItem('carrtell_shop_filters');
    sessionStorage.removeItem('carrtell:shop-filters');
    sessionStorage.removeItem('carrtell_shop_filters');
    setSelectedCustomerCar(null);
    setSearchText('');
    setAccountOpen(false);
    setMobileOpen(false);
    navigate('/', { replace: true });
  }

  function closeDrawer() {
    setMobileOpen(false);
    setDrawerCategoriesOpen(false);
  }

  function handleDrawerCategories() {
    closeDrawer();
    navigate('/shop?view=categories');
  }

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryRoots = categoryTree;
  const categoryById = useMemo(() => new Map(categories.filter((item) => item.id).map((item) => [item.id as string, item])), [categories]);
  const drawerCategoryColumns = useMemo(() => {
    const columns = [categoryRoots];
    for (const id of drawerCategoryPath) {
      const selected = columns[columns.length - 1]?.find((item) => item.id === id);
      if (!selected?.children.length) break;
      columns.push(selected.children);
    }
    return columns;
  }, [categoryRoots, drawerCategoryPath]);

  function selectDrawerCategory(id: string, depth: number) {
    setDrawerCategoryPath((current) => [...current.slice(0, depth), id]);
  }

  const accessLinks = categoryRoots.length > 0
    ? categoryRoots.slice(0, 10).map((item) => ({ label: item.title, to: `/shop?category=${item.slug}`, emoji: item.icon_emoji || '🔧' }))
    : fallbackAccessLinks;
  const normalizedSearch = normalizeLiveSearch(searchText);
  const searchedProducts = useMemo(() => {
    if (!normalizedSearch) return [];
    const tokens = normalizedSearch.split(' ').filter(Boolean);
    const scoreProduct = (product: Product) => {
      const fields = [product.name, product.brand, product.category, product.oil_grade, product.quality_level, product.transmission_type, product.description, product.card_features].map(normalizeLiveSearch);
      const name = fields[0]; const brand = fields[1]; const haystack = fields.join(' ');
      const words = haystack.split(' ').filter(Boolean);
      const allTokensMatch = tokens.every((token) => words.some((word) => word.startsWith(token) || word.includes(token)) || haystack.includes(token));
      if (!allTokensMatch) return 0;
      let score = tokens.length * 120;
      if (name === normalizedSearch) score += 1000;
      else if (name.startsWith(normalizedSearch)) score += 850;
      else if (name.includes(normalizedSearch)) score += 650;
      if (brand === normalizedSearch) score += 500;
      else if (brand.startsWith(normalizedSearch)) score += 350;
      tokens.forEach((token) => { if (name.split(' ').some((word) => word.startsWith(token))) score += 140; if (brand.startsWith(token)) score += 80; });
      return score;
    };
    return products.map((product) => ({ product, score: scoreProduct(product) })).filter((entry) => entry.score > 0).sort((a,b) => b.score-a.score || String(a.product.name||'').localeCompare(String(b.product.name||''),'fa')).map((entry)=>entry.product);
  }, [normalizedSearch, products]);
  const drawerSearchResults = useMemo(() => searchedProducts.slice(0, 8), [searchedProducts]);

  const liveCategorySuggestions = useMemo(() => normalizedSearch ? categories.filter((item) => normalizeLiveSearch(item.title).includes(normalizedSearch) || normalizeLiveSearch(item.title).split(' ').some((w) => w.startsWith(normalizedSearch))).slice(0, 5) : [], [categories, normalizedSearch]);
  const liveBrandSuggestions = useMemo(() => normalizedSearch ? Array.from(new Set(products.map((item) => String(item.brand || '').trim()).filter(Boolean))).filter((brand) => normalizeLiveSearch(brand).includes(normalizedSearch) || normalizeLiveSearch(brand).startsWith(normalizedSearch)).slice(0, 5) : [], [products, normalizedSearch]);

  const groupedSearchResults = useMemo(() => {
    const categoryMap = new Map(categories.map((item) => [item.slug, item.title]));
    const groups = new Map<string, Product[]>();
    searchedProducts.forEach((product) => {
      const title = categoryMap.get(product.category || '') || product.category || 'سایر محصولات';
      const current = groups.get(title) || [];
      current.push(product);
      groups.set(title, current);
    });
    return Array.from(groups.entries());
  }, [categories, searchedProducts]);

  const drawerActiveCategory = categoryById.get(drawerCategoryPath[drawerCategoryPath.length - 1] || '') || categoryRoots[0] || null;
  const drawerActiveProducts = drawerActiveCategory?.id
    ? (() => {
        const ids = new Set(getCategoryDescendantIds(categories, drawerActiveCategory.id as string));
        return products.filter((product) => product.category === drawerActiveCategory.slug || product.category_ids?.some((id) => ids.has(id))).slice(0, 24);
      })()
    : [];

  const roleShortcut = role === 'admin'
    ? { to: '/admin', label: 'پنل مدیریت', Icon: ShieldCheck }
    : role === 'technician'
      ? { to: '/driver', label: 'پنل سرویس‌کار', Icon: Wrench }
      : null;
  const RoleIcon = roleShortcut?.Icon;

  function selectStoreCar(car: AdminCar) {
    saveSelectedCustomerCar(car);
    const selected = readSelectedCustomerCar();
    setSelectedCustomerCar(selected);
    setVehiclePickerOpen(false);
    setVehicleSearch('');
    setVehicleNoticeCorner(false);
    setVehicleNoticeDismissed(false);
    setVehicleNotice(`تمام محصولات متناسب با ${selected?.title || getCarTitle(car)} نمایش داده می‌شوند.`);
    window.setTimeout(() => setVehicleNoticeCorner(true), 1400);
  }

  const vehicleBrands = useMemo(
    () => Array.from(new Set(allCars.map((car) => String(car.brand || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'fa')),
    [allCars],
  );

  const filteredCars = useMemo(() => {
    const query = vehicleSearch.trim().toLocaleLowerCase('fa');
    const brandQuery = vehicleBrand.trim().toLocaleLowerCase('fa');

    return allCars
      .filter((car) => !brandQuery || String(car.brand || '').trim().toLocaleLowerCase('fa') === brandQuery)
      .map((car) => {
        const title = getCarTitle(car).toLocaleLowerCase('fa');
        const brand = String(car.brand || '').toLocaleLowerCase('fa');
        const model = String(car.model || '').toLocaleLowerCase('fa');
        const trim = String(car.trim || '').toLocaleLowerCase('fa');
        const engine = String(car.engine || '').toLocaleLowerCase('fa');

        let score = 1;
        if (query) {
          if (title === query) score = 1000;
          else if (model === query) score = 950;
          else if (model.startsWith(query)) score = 900;
          else if (title.startsWith(query)) score = 850;
          else if (brand.startsWith(query)) score = 800;
          else if (title.includes(query)) score = 700;
          else if (trim.includes(query) || engine.includes(query)) score = 500;
          else score = 0;
        }

        return { car, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((entry) => entry.car);
  }, [allCars, vehicleBrand, vehicleSearch]);

  function clearVehicleFilter() {
    saveSelectedCustomerCar(null);
    setSelectedCustomerCar(null);
    setVehiclePickerOpen(false);
    setVehicleNotice('');
    setVehicleNoticeCorner(false);
    setVehicleNoticeDismissed(false);
  }

  return (
    <header className={`ct-new-site-header fixed inset-x-0 top-0 z-50 ${scrolled ? 'is-scrolled' : ''}`} dir="rtl">
      {vehicleNotice && !vehicleNoticeDismissed && (
        <div className={`ct-new-vehicle-notice ${vehicleNoticeCorner ? 'is-corner' : ''}`} role="status" aria-live="polite">
          <Car className="h-5 w-5 shrink-0" />
          <span>{vehicleNotice}</span>
          {vehicleNoticeCorner && (
            <button type="button" className="ct-new-vehicle-notice-close" onClick={() => setVehicleNoticeDismissed(true)} aria-label="بستن اعلان">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div className="ct-new-promo-row">
        <Link to="/#amazing-offers" className="ct-new-promo-link">
          جشنواره ویژه Carrtell؛ تخفیف پکیج‌های سرویس و ارسال سریع
        </Link>
      </div>

      <div className="ct-new-main-row">
        <div className="ct-new-main-inner">
          <CarrtellLogo />

          {showGlobalSearch && <div className="ct-new-search-wrap" ref={searchRef}>
            <form onSubmit={submitSearch} className="ct-new-search-form">
              <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
              <input
                value={searchText}
                onFocus={() => { setSearchOpen(true); window.requestAnimationFrame(updateSearchPanelPosition); if (!products.length && !searchLoading) void loadSearchCatalog(); }}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setSearchOpen(true);
                  window.requestAnimationFrame(updateSearchPanelPosition);
                }}
                placeholder="جستجوی محصول، برند یا خودرو..."
                aria-label="جستجوی محصولات"
                autoComplete="off"
                className="ct-new-search-input"
              />
              {searchText && (
                <button type="button" className="ct-new-search-clear" onClick={() => setSearchText('')} aria-label="پاک کردن جستجو">
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {searchOpen && normalizedSearch && typeof document !== 'undefined' && createPortal(
              <div ref={searchPanelRef} className="ct-new-search-results ct-new-search-results-portal" style={searchPanelStyle} role="listbox" aria-label="پیشنهادهای جستجو">
                {searchLoading ? (
                  <div className="ct-new-search-empty">در حال جستجو بین محصولات...</div>
                ) : searchError ? (
                  <button type="button" className="ct-new-search-retry" onClick={() => void loadSearchCatalog()}>{searchError}</button>
                ) : groupedSearchResults.length > 0 ? (
                  <>
                    <div className="ct-new-search-results-head">
                      <b>نتایج جستجو</b>
                      <span>{new Intl.NumberFormat('fa-IR').format(searchedProducts.length)} کالا</span>
                    </div>
                    <div className="ct-new-search-results-body">
                      {(liveCategorySuggestions.length > 0 || liveBrandSuggestions.length > 0) && <div className="ct-live-search-shortcuts">
                        {liveCategorySuggestions.map((item) => <Link key={`cat-${item.slug}`} to={`/shop?category=${encodeURIComponent(item.slug)}`} onClick={()=>{setSearchOpen(false);setSearchText('');}}><span>دسته‌بندی</span><b>{item.title}</b></Link>)}
                        {liveBrandSuggestions.map((brand) => <Link key={`brand-${brand}`} to={`/shop?q=${encodeURIComponent(brand)}`} onClick={()=>{setSearchOpen(false);setSearchText('');}}><span>برند</span><b>{brand}</b></Link>)}
                      </div>}
                      {groupedSearchResults.map(([categoryTitle, items]) => (
                        <section key={categoryTitle} className="ct-new-search-group">
                          <h3>{categoryTitle}</h3>
                          <div>
                            {items.slice(0, 8).map((product) => (
                              <Link
                                key={product.id || product.name}
                                to={`/shop/product/${product.id}`}
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchText('');
                                }}
                                className="ct-new-search-item"
                              >
                                <span className="ct-new-search-thumb">
                                  {product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package className="h-5 w-5" />}
                                </span>
                                <span className="ct-new-search-copy">
                                  <b>{product.name}</b>
                                  <small>{[product.brand, product.oil_grade || product.quality_level].filter(Boolean).join(' • ')}</small>
                                </span>
                                <span className="ct-new-search-price">{new Intl.NumberFormat('fa-IR').format(Number(product.price || 0))} تومان</span>
                              </Link>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                    <button type="button" className="ct-new-search-all" onClick={() => submitSearch({ preventDefault() {} } as React.FormEvent)}>
                      مشاهده همه نتایج
                    </button>
                  </>
                ) : (
                  <div className="ct-new-search-empty">کالایی با این عبارت پیدا نشد.</div>
                )}
              </div>,
              document.body,
            )}
          </div>}

          <div className="ct-new-actions">
            {!authLoading && !user && (
              <Link to={loginTo} className="ct-new-action-button ct-new-login-button" title="ورود یا ثبت‌نام" data-testid="header-login-button">
                <CircleUserRound className="h-5 w-5" />
                <span>ورود</span>
              </Link>
            )}

            {user && (
              <div className="ct-new-header-user-actions" ref={accountRef}>
                <Link to="/dashboard" className="ct-new-action-button ct-new-account-button" data-testid="header-user-name">
                  <CircleUserRound className="h-5 w-5" />
                  <span>{user.fullName?.trim() || user.username?.trim() || 'حساب من'}</span>
                </Link>
                <button type="button" onClick={() => void handleSignOut()} className="ct-new-header-signout" data-testid="header-signout-button" aria-label="خروج از حساب" title="خروج از حساب">
                  <LogOut className="h-4 w-4" /><span>خروج</span>
                </button>
              </div>
            )}

            <Link to="/dashboard#favorites" className="ct-new-icon-button ct-new-favorites-button" aria-label="علاقه‌مندی‌ها" title="علاقه‌مندی‌ها">
              <Heart className="h-5 w-5" />
              {favoritesCount > 0 && <span className="ct-new-favorites-count">{favoritesCount > 99 ? '۹۹+' : new Intl.NumberFormat('fa-IR').format(favoritesCount)}</span>}
            </Link>

            <MiniCart />

            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setVehiclePickerOpen(false);
                setAccountOpen(false);
                setMobileOpen(true);
              }}
              className="ct-new-icon-button ct-new-menu-button"
              data-testid="main-hamburger-menu"
              aria-label="باز کردن منو"
              title="منو"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showStorefrontBars && <nav className="ct-new-access-row" aria-label="دسته‌بندی محصولات">
        <div className="ct-new-access-inner">
          <div className="ct-new-access-vehicle" ref={vehiclePickerRef}>
              <button
                type="button"
                onClick={() => { setVehiclePickerOpen((value) => !value); setVehicleSearch(''); setVehicleBrand(''); }}
                className={`ct-new-access-vehicle-button ${selectedCustomerCar ? 'is-active' : ''}`}
                aria-expanded={vehiclePickerOpen}
              >
                <Car className="h-4 w-4" />
                <span>{selectedCustomerCar?.title || 'انتخاب خودرو'}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition ${vehiclePickerOpen ? 'rotate-180' : ''}`} />
              </button>

          </div>

          <div className="ct-new-access-scroll">
            {accessLinks.map((item) => (
              <Link key={`${item.label}-${item.to}`} to={item.to}>
                <span aria-hidden="true">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/book" className="ct-new-access-service-button">
            <Wrench className="h-4 w-4" />
            <span>سرویس در محل</span>
          </Link>
        </div>
      </nav>}

      {mobileOpen && typeof document !== 'undefined' && createPortal((
        <div className="ct-new-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside ref={menuRef} className="ct-new-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ct-new-drawer-close-row">
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="بستن منو">
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              className={`ct-new-drawer-vehicle ${selectedCustomerCar ? 'is-active' : ''}`}
              data-testid="drawer-vehicle-picker-button"
              onClick={() => {
                setMobileOpen(false);
                setVehicleSearch('');
                setVehicleBrand(selectedCustomerCar?.brand || '');
                setVehiclePickerOpen(true);
              }}
            >
              <span className="ct-new-drawer-vehicle-icon"><Car className="h-6 w-6" /></span>
              <span className="ct-new-drawer-vehicle-copy">
                <b>{selectedCustomerCar ? 'خودروی انتخابی' : 'انتخاب خودرو'}</b>
                <small>{selectedCustomerCar?.title || 'برای نمایش محصولات سازگار با خودروی شما'}</small>
              </span>
              <span className="ct-new-drawer-vehicle-action">{selectedCustomerCar ? 'تغییر' : 'انتخاب'}</span>
            </button>

            <form onSubmit={submitSearch} className="ct-new-drawer-search">
              <Search className="h-5 w-5" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="جستجوی محصول، برند یا خودرو..."
                autoComplete="off"
                aria-label="جستجوی زنده محصولات در منو"
              />
            </form>

            {normalizedSearch && (
              <div className="ct-new-drawer-live-results" role="listbox" aria-label="محصولات مرتبط">
                {searchLoading ? (
                  <p>در حال جستجو بین محصولات...</p>
                ) : drawerSearchResults.length ? (
                  <>
                    {drawerSearchResults.map((product) => (
                      <Link
                        key={product.id || product.name}
                        to={`/shop/product/${product.id}`}
                        onClick={() => { setSearchText(''); setMobileOpen(false); }}
                        className="ct-new-drawer-live-item"
                      >
                        <span className="ct-new-drawer-live-thumb">
                          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <Package className="h-5 w-5" />}
                        </span>
                        <span className="ct-new-drawer-live-copy">
                          <b>{product.name}</b>
                          <small>{[product.brand, product.oil_grade || product.quality_level].filter(Boolean).join(' • ')}</small>
                        </span>
                        <strong>{new Intl.NumberFormat('fa-IR').format(Number(product.amazing_price || product.price || 0))}<small> تومان</small></strong>
                      </Link>
                    ))}
                    <button type="button" onClick={submitSearch} className="ct-new-drawer-live-all">مشاهده همه نتایج</button>
                  </>
                ) : (
                  <p>محصول مرتبطی پیدا نشد.</p>
                )}
              </div>
            )}

            <div className="ct-new-drawer-scroll">
              <nav className="ct-new-drawer-nav">
                <div
                  className="ct-new-drawer-category-root"
                  onMouseEnter={keepDrawerMegaOpen}
                  onMouseLeave={scheduleDrawerMegaClose}
                >
                  <button
                    type="button"
                    className="ct-new-drawer-category-trigger"
                    data-testid="drawer-category-trigger"
                    onClick={handleDrawerCategories}
                    aria-expanded={drawerCategoriesOpen}
                  >
                    <span className="ct-new-drawer-link-copy"><span aria-hidden="true">🗂️</span><span>دسته‌بندی محصولات</span></span>
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>

                <Link to="/book" onClick={closeDrawer}><span aria-hidden="true">🛠️</span><span>سرویس در محل</span></Link>
                <Link to="/blog" onClick={closeDrawer}><span aria-hidden="true">📰</span><span>وبلاگ</span></Link>
                <Link to="/dashboard#orders" onClick={closeDrawer}><span aria-hidden="true">📦</span><span>پیگیری خرید</span></Link>
                <Link to="/profile/support" onClick={closeDrawer}><span aria-hidden="true">🎧</span><span>پشتیبانی</span></Link>
                <Link to="/profile/support#contact" onClick={closeDrawer}><span aria-hidden="true">☎️</span><span>ارتباط با ما</span></Link>
                {roleShortcut && RoleIcon && (
                  <Link to={roleShortcut.to} className="ct-new-drawer-role-link" onClick={closeDrawer}>
                    <RoleIcon className="h-5 w-5" />
                    {roleShortcut.label}
                  </Link>
                )}
              </nav>
            </div>

            {drawerCategoriesOpen && (
              <div
                className="ct-new-drawer-mega"
                onMouseEnter={keepDrawerMegaOpen}
                onMouseLeave={scheduleDrawerMegaClose}
              >
                <div className="ct-new-drawer-mega-products">
                  <div className="ct-new-drawer-mega-products-head">
                    <b>{drawerActiveCategory?.title || 'محصولات'}</b>
                    {drawerActiveCategory && <Link to={`/shop?category=${drawerActiveCategory.slug}`}>مشاهده همه</Link>}
                  </div>
                  <div className="ct-new-drawer-mega-products-grid">
                    {drawerActiveProducts.map((product) => (
                      <Link key={product.id || product.name} to={`/shop/product/${product.id}`} className="ct-new-drawer-product-row">
                        <div className="ct-new-drawer-product-thumb">
                          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>📦</span>}
                        </div>
                        <div className="ct-new-drawer-product-info">
                          <strong>{product.name}</strong>
                          <small>{[product.brand, product.oil_grade, product.quality_level].filter(Boolean).join(' • ')}</small>
                        </div>
                        <div className="ct-new-drawer-product-price">
                          {new Intl.NumberFormat('fa-IR').format(Number(product.amazing_price || product.price || 0))}
                          <span>تومان</span>
                        </div>
                      </Link>
                    ))}
                    {drawerActiveProducts.length === 0 && <p>محصولی در این دسته ثبت نشده است.</p>}
                  </div>
                </div>

                <div className="ct-new-drawer-mega-cascade" data-testid="dynamic-category-mega-menu">
                  {drawerCategoryColumns.map((column, depth) => (
                    <div className="ct-new-drawer-mega-categories" key={`category-column-${depth}`} data-testid={`category-column-${depth}`}>
                      <div className="ct-new-drawer-mega-heading">{depth === 0 ? 'دسته‌بندی محصولات' : categoryById.get(drawerCategoryPath[depth - 1] || '')?.title}</div>
                      {column.map((category) => {
                        const hasChildren = category.children.length > 0;
                        const selected = drawerCategoryPath[depth] === category.id;
                        return (
                          <Link
                            key={category.id || category.slug}
                            data-has-children={hasChildren ? 'true' : 'false'}
                            to={hasChildren ? '#' : `/shop?category=${category.slug}`}
                            className={selected ? 'is-active' : ''}
                            onClick={(event) => {
                              if (hasChildren && category.id) { event.preventDefault(); selectDrawerCategory(category.id, depth); }
                              else closeDrawer();
                            }}
                            onMouseEnter={() => category.id && selectDrawerCategory(category.id, depth)}
                            onFocus={() => category.id && selectDrawerCategory(category.id, depth)}
                          >
                            <span>{category.icon_emoji || '🔧'}</span>
                            <span>{category.title}</span>
                            {hasChildren && <ChevronDown className="mr-auto h-3.5 w-3.5 -rotate-90" />}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>

              </div>
            )}

          </aside>
        </div>
      ), document.body)}

      {vehiclePickerOpen && typeof document !== 'undefined' && createPortal((
        <div className="ct-drawer-vehicle-modal-backdrop" onClick={() => setVehiclePickerOpen(false)}>
          <section
            ref={vehiclePickerRef}
            className="ct-drawer-vehicle-modal"
            data-testid="drawer-vehicle-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ct-drawer-vehicle-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ct-drawer-vehicle-modal-head">
              <div>
                <h2 id="ct-drawer-vehicle-title">انتخاب خودرو</h2>
                <span>خودرو را انتخاب کن تا فقط محصولات سازگار نمایش داده شوند.</span>
              </div>
              <button type="button" onClick={() => setVehiclePickerOpen(false)} aria-label="بستن انتخاب خودرو">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="ct-drawer-vehicle-field" htmlFor="ct-drawer-vehicle-brand">
              <span>شرکت سازنده</span>
              <select
                id="ct-drawer-vehicle-brand"
                value={vehicleBrand}
                onChange={(event) => {
                  setVehicleBrand(event.target.value);
                  setVehicleSearch('');
                }}
              >
                <option value="">همه سازنده‌ها</option>
                {vehicleBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>

            <label className="ct-drawer-vehicle-search">
              <Search className="h-4 w-4" />
              <input
                value={vehicleSearch}
                onChange={(event) => setVehicleSearch(event.target.value)}
                placeholder={vehicleBrand ? `جستجو بین خودروهای ${vehicleBrand}...` : 'جستجوی نام یا مدل خودرو...'}
              />
            </label>

            <div className="ct-drawer-vehicle-list">
              <button type="button" onClick={clearVehicleFilter} className={!selectedCustomerCar ? 'is-selected' : ''}>
                <span className="ct-drawer-vehicle-list-icon">🚘</span>
                <span><b>همه خودروها</b><small>نمایش محصولات بدون فیلتر خودرو</small></span>
              </button>
              {filteredCars.map((car) => (
                <button key={car.id} type="button" onClick={() => selectStoreCar(car)} className={selectedCustomerCar?.id === car.id ? 'is-selected' : ''}>
                  <span className="ct-drawer-vehicle-list-icon">🚗</span>
                  <span><b>{getCarTitle(car)}</b><small>{[car.start_year, car.transmission_type].filter(Boolean).join(' • ') || 'خودروی قابل انتخاب'}</small></span>
                </button>
              ))}
              {filteredCars.length === 0 && <p>خودرویی با این مشخصات پیدا نشد.</p>}
            </div>
          </section>
        </div>
      ), document.body)}
    </header>
  );
}
