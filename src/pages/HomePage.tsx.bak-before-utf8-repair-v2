import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  CarFront,
  Check,
  ChevronLeft,
  Package,
  Plus,
  Search,
  Sparkles,
  Tags,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { ProductCard } from './ShopPage';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCategoryDestination, getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { getActiveCarsForCustomer, getCarTitle, type Car } from '../admin/services/carsApi';
import { addProductToCart, readCart, type CartItem } from '../lib/cart';
import { defaultMegaMenuTiles, getMegaMenuTiles, type MegaMenuTile } from '../admin/services/homeContentApi';
import { onSelectedCustomerCarChange, readSelectedCustomerCar, saveSelectedCustomerCar, type SelectedCustomerCar } from '../customer/services/selectedCar';

const PAGE_SIZE = 25;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [promoTiles, setPromoTiles] = useState<MegaMenuTile[]>(defaultMegaMenuTiles);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [selectedCar, setSelectedCar] = useState<SelectedCustomerCar | null>(() => readSelectedCustomerCar());
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [carSearch, setCarSearch] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productRows, categoryRows, promoTileRows, carRows] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getMegaMenuTiles(),
          getActiveCarsForCustomer(),
        ]);
        if (!active) return;
        setProducts(productRows.filter((product) => product.is_active !== false));
        setCategories(categoryRows.filter((category) => category.is_active !== false));
        setPromoTiles(promoTileRows);
        setCars(carRows);
      } catch (error) {
        console.error('Homepage load error:', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const sync = () => setCart(readCart());
    window.addEventListener('carrtell-cart-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('carrtell-cart-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => onSelectedCustomerCarChange(() => setSelectedCar(readSelectedCustomerCar())), []);

  const activeProducts = useMemo(
    () => products.filter((product) => !product.is_out_of_stock && Number(product.stock || 0) > 0),
    [products],
  );
  const amazingProducts = useMemo(
    () => activeProducts.filter((product) => product.is_featured).slice(0, 6),
    [activeProducts],
  );
  const visibleProducts = activeProducts.slice(0, visibleCount);
  const activePromoTiles = useMemo(
    () => promoTiles.filter((tile) => tile.is_active !== false).sort((a, b) => a.sort_order - b.sort_order).slice(0, 4),
    [promoTiles],
  );
  const reserved = useMemo(
    () => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])),
    [cart],
  );
  const carBrands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fa')),
    [cars],
  );
  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLowerCase();
    return cars.filter((car) => {
      if (carBrand && car.brand !== carBrand) return false;
      return !query || getCarTitle(car).toLowerCase().includes(query);
    });
  }, [cars, carBrand, carSearch]);

  function handleAdd(product: Product) {
    addProductToCart(product, 1);
    setCart(readCart());
  }

  function chooseCar(car: Car) {
    saveSelectedCustomerCar(car);
    setSelectedCar(readSelectedCustomerCar());
    setShowCarPicker(false);
    setCarSearch('');
    setCarBrand('');
  }

  const quickActions = [
    {
      key: 'car',
      title: selectedCar ? selectedCar.title : 'Ø§Ù†ØªØ®Ø§Ø¨ Ø®ÙˆØ¯Ø±Ùˆ',
      subtitle: selectedCar ? 'Ø¨Ø±Ø§ÛŒ ØªØºÛŒÛŒØ± Ù„Ù…Ø³ Ú©Ù†' : 'Ø®Ø±ÛŒØ¯ Ø¯Ù‚ÛŒÙ‚â€ŒØªØ±',
      Icon: CarFront,
      onClick: () => setShowCarPicker(true),
    },
    {
      key: 'fit',
      title: 'Ù…Ù†Ø§Ø³Ø¨ Ø®ÙˆØ¯Ø±ÙˆÛŒ Ù…Ù†',
      subtitle: selectedCar ? 'ÙÙ‚Ø· Ø³Ø§Ø²Ú¯Ø§Ø±Ù‡Ø§' : 'Ø§ÙˆÙ„ Ø®ÙˆØ¯Ø±Ùˆ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†',
      Icon: Check,
      to: '/shop',
      requiresCar: true,
    },
    { key: 'brands', title: 'Ø¨Ø±Ù†Ø¯Ù‡Ø§', subtitle: 'Ø§Ù†ØªØ®Ø§Ø¨ Ø³Ø±ÛŒØ¹ Ø¨Ø±Ù†Ø¯', Icon: Tags, to: '/shop' },
    { key: 'discounts', title: 'ØªØ®ÙÛŒÙâ€ŒÙ‡Ø§', subtitle: 'Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ù‡Ø§ÛŒ ÙˆÛŒÚ˜Ù‡', Icon: BadgePercent, to: '/shop/special-offers' },
    { key: 'packages', title: 'Ù¾Ú©ÛŒØ¬â€ŒÙ‡Ø§', subtitle: 'Ø³Ø±ÙˆÛŒØ³ Ø¯ÙˆØ±Ù‡â€ŒØ§ÛŒ', Icon: Package, to: '/shop/packages' },
    { key: 'service', title: 'Ø±Ø²Ø±Ùˆ Ø³Ø±ÙˆÛŒØ³', subtitle: 'Ø³Ø±ÙˆÛŒØ³ Ø¯Ø± Ù…Ø­Ù„', Icon: Wrench, to: '/book' },
  ];

  return (
    <main dir="rtl" className="bg-[#f7f7f8] text-slate-900 pt-28">
      {showCarPicker && (
        <div className="fixed inset-0 z-[100200] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-4" onClick={() => setShowCarPicker(false)}>
          <section className="max-h-[82vh] w-full overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[24px]" onClick={(event) => event.stopPropagation()} data-testid="home-car-picker">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-base font-black">Ø§Ù†ØªØ®Ø§Ø¨ Ø®ÙˆØ¯Ø±ÙˆÛŒ Ù…Ù†</h2>
                <p className="mt-0.5 text-[10px] font-bold text-slate-400">Ø¨Ø¹Ø¯ Ø§Ø² Ø§Ù†ØªØ®Ø§Ø¨ØŒ Ù…Ø­ØµÙˆÙ„Ø§Øª Ø³Ø§Ø²Ú¯Ø§Ø± Ø¨Ø§ Ø®ÙˆØ¯Ø±ÙˆÛŒØª Ø±Ø§Ø­Øªâ€ŒØªØ± Ù¾ÛŒØ¯Ø§ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯.</p>
              </div>
              <button type="button" onClick={() => setShowCarPicker(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100" aria-label="Ø¨Ø³ØªÙ†"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-[150px_1fr]">
              <select value={carBrand} onChange={(event) => setCarBrand(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-red-400">
                <option value="">Ù‡Ù…Ù‡ Ø³Ø§Ø²Ù†Ø¯Ù‡â€ŒÙ‡Ø§</option>
                {carBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
              <label className="relative block">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={carSearch} onChange={(event) => setCarSearch(event.target.value)} placeholder="Ø¬Ø³ØªØ¬ÙˆÛŒ Ù…Ø¯Ù„ Ø®ÙˆØ¯Ø±Ùˆ..." className="h-10 w-full rounded-xl border border-slate-200 pr-9 pl-3 text-xs font-bold outline-none focus:border-red-400" />
              </label>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-3">
              {selectedCar && (
                <button type="button" onClick={() => { saveSelectedCustomerCar(null); setSelectedCar(null); setShowCarPicker(false); }} className="mb-2 flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-right">
                  <span><b className="block text-xs text-red-700">Ø­Ø°Ù Ø®ÙˆØ¯Ø±ÙˆÛŒ Ø§Ù†ØªØ®Ø§Ø¨ÛŒ</b><small className="text-[9px] text-red-500">{selectedCar.title}</small></span>
                  <X className="h-4 w-4 text-red-500" />
                </button>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredCars.map((car) => (
                  <button type="button" key={car.id || getCarTitle(car)} onClick={() => chooseCar(car)} className="flex min-h-[58px] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-right transition hover:border-red-200 hover:bg-red-50">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-red-500 shadow-sm"><CarFront className="h-4 w-4" /></span>
                    <span className="min-w-0"><b className="block truncate text-[11px]">{getCarTitle(car)}</b><small className="mt-0.5 block truncate text-[9px] text-slate-400">{car.transmission_type || 'Ú¯ÛŒØ±Ø¨Ú©Ø³ Ù†Ø§Ù…Ø´Ø®Øµ'}</small></span>
                  </button>
                ))}
              </div>
              {!filteredCars.length && <p className="py-8 text-center text-xs font-bold text-slate-400">Ø®ÙˆØ¯Ø±ÙˆÛŒÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ù…Ø´Ø®ØµØ§Øª Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.</p>}
            </div>
          </section>
        </div>
      )}

      <section className="mx-auto max-w-[1240px] px-4 pt-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative min-h-[245px] overflow-hidden rounded-[24px] bg-gradient-to-l from-[#a61017] via-[#d51d26] to-[#f0444d] p-7 text-white shadow-sm">
            <div className="relative z-10 max-w-xl">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
                <Sparkles className="h-4 w-4" /> Ø³Ø±ÙˆÛŒØ³ Ùˆ ÙØ±ÙˆØ´ ØªØ®ØµØµÛŒ Ø®ÙˆØ¯Ø±Ùˆ
              </span>
              <h1 className="text-3xl font-black leading-[1.7] md:text-4xl">ÙØ±ÙˆØ´Ú¯Ø§Ù‡ ØªØ®ØµØµÛŒ Carrtell</h1>
              <p className="mt-2 max-w-lg text-sm leading-7 text-white/85">Ù…Ø­ØµÙˆÙ„ Ù…Ù†Ø§Ø³Ø¨ Ø®ÙˆØ¯Ø±Ùˆ Ø±Ø§ Ù¾ÛŒØ¯Ø§ Ú©Ù†ØŒ Ø¢Ù†Ù„Ø§ÛŒÙ† Ø³ÙØ§Ø±Ø´ Ø¨Ø¯Ù‡ ÛŒØ§ Ø³Ø±ÙˆÛŒØ³ Ø¯Ø± Ù…Ø­Ù„ Ø±Ø²Ø±Ùˆ Ú©Ù†.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/shop" className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-red-600">Ù…Ø´Ø§Ù‡Ø¯Ù‡ ÙØ±ÙˆØ´Ú¯Ø§Ù‡</Link>
                <Link to="/book" className="rounded-xl border border-white/50 px-5 py-2.5 text-sm font-black text-white">Ø±Ø²Ø±Ùˆ Ø³Ø±ÙˆÛŒØ³</Link>
              </div>
            </div>
            <div className="absolute -left-10 -bottom-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute left-16 top-10 h-24 w-24 rounded-full bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-950 p-3 shadow-sm" data-testid="home-hero-promo-tiles" aria-label="Ø¨Ù†Ø±Ù‡Ø§ÛŒ ØªØ¨Ù„ÛŒØºØ§ØªÛŒ ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ">
            {activePromoTiles.map((tile) => (
              <Link key={tile.id || `${tile.title}-${tile.sort_order}`} to={tile.link_url || '/shop'} className="group relative min-h-[112px] overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-900 text-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:shadow-lg">
                {tile.image_url ? <img src={tile.image_url} alt={tile.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                  {tile.badge && <span className="mb-1 inline-flex rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-black text-slate-950">{tile.badge}</span>}
                  <h2 className="line-clamp-2 text-[11px] font-black leading-5">{tile.title}</h2>
                  <span className="mt-1 flex items-center gap-1 text-[8px] font-bold text-amber-300">Ù…Ø´Ø§Ù‡Ø¯Ù‡ <ArrowLeft className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pt-4 pb-5" data-testid="home-quick-actions">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
          {quickActions.map(({ key, title, subtitle, Icon, to, onClick, requiresCar }) => {
            const card = (
              <>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${key === 'car' && selectedCar ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><Icon className="h-[18px] w-[18px]" /></span>
                <span className="mt-2 min-w-0 text-center"><b className="block truncate text-[10px] font-black sm:text-[11px]">{title}</b><small className="mt-0.5 block truncate text-[8px] font-bold text-slate-400">{subtitle}</small></span>
              </>
            );
            const className = "flex min-h-[82px] min-w-0 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-2 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md";
            if (onClick) return <button type="button" key={key} onClick={onClick} className={className}>{card}</button>;
            return <Link key={key} to={to || '/shop'} onClick={(event) => { if (requiresCar && !selectedCar) { event.preventDefault(); setShowCarPicker(true); } }} className={className}>{card}</Link>;
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-7">
        <Link to="/industrial" className="flex min-h-[150px] items-center justify-between overflow-hidden rounded-[24px] bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-lg transition hover:-translate-y-0.5">
          <div><span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black text-amber-300">Ø¨Ø®Ø´ ØªØ®ØµØµÛŒ Ø¬Ø¯ÛŒØ¯</span><h2 className="mt-3 text-xl font-black">Ø±ÙˆØºÙ† Ùˆ ÙÛŒÙ„ØªØ± Ø¯ÛŒØ²Ù„ÛŒ Ùˆ ØµÙ†Ø¹ØªÛŒ</h2><p className="mt-1 text-xs leading-6 text-slate-300">Ø®ÙˆØ¯Ø±Ùˆ Ø³Ù†Ú¯ÛŒÙ†ØŒ Ù…Ø§Ø´ÛŒÙ†â€ŒØ¢Ù„Ø§ØªØŒ Ú©Ø§Ø±Ø®Ø§Ù†Ù‡ØŒ Ú¯Ø§Ù„Ù† Û²Û° Ù„ÛŒØªØ±ÛŒ Ùˆ Ø¨Ø´Ú©Ù‡</p></div>
          <Truck className="h-16 w-16 shrink-0 text-amber-400/80" />
        </Link>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Ø¯Ø³ØªÙ‡â€ŒØ¨Ù†Ø¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ù…Ø­Ø¨ÙˆØ¨</h2>
          <Link to="/shop" className="flex items-center gap-1 text-xs font-bold text-slate-500">Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù‡Ù…Ù‡ <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id || category.slug} to={getCategoryDestination(category, 'journey')} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mx-auto mb-2 flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-2xl">
                {category.image_url ? <img src={category.image_url} alt={category.title} loading="lazy" className="h-full w-full object-contain p-1.5" /> : <span aria-hidden="true">{category.icon_emoji || 'ðŸš˜'}</span>}
              </div>
              <div className="truncate text-[11px] font-black">{category.title}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-7">
        <div className="grid gap-3 md:grid-cols-3">
          {['Ø±ÙˆØºÙ† Ù…ÙˆØªÙˆØ±Ù‡Ø§ÛŒ Ù¾Ø±ÙØ±ÙˆØ´', 'Ù¾Ú©ÛŒØ¬ Ú©Ø§Ù…Ù„ Ø³Ø±ÙˆÛŒØ³ Ø¯ÙˆØ±Ù‡â€ŒØ§ÛŒ', 'Ø³Ø±ÙˆÛŒØ³ ØªØ®ØµØµÛŒ Ø¯Ø± Ù…Ø­Ù„'].map((title, index) => (
            <Link key={title} to={index === 2 ? '/book' : '/shop'} className="flex min-h-[125px] items-end rounded-[22px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white shadow-sm">
              <div><div className="font-black">{title}</div><div className="mt-1 text-xs text-white/60">Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ø¬Ø²Ø¦ÛŒØ§Øª</div></div>
            </Link>
          ))}
        </div>
      </section>

      {amazingProducts.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 pb-7">
          <div className="rounded-[24px] bg-red-600 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-white">
              <h2 className="text-lg font-black text-white">Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø´Ú¯ÙØªâ€ŒØ§Ù†Ú¯ÛŒØ²</h2>
              <Link to="/shop/special-offers" className="text-xs font-bold">Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù‡Ù…Ù‡</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {amazingProducts.map((product) => (
                <ProductCard key={product.id} product={product} reservedQuantity={reserved[product.id || ''] || 0} onAddToCart={handleAdd} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1240px] px-4 pb-10">
        <div className="rounded-[22px] border border-red-500 bg-white p-3 shadow-[0_12px_30px_rgba(220,38,38,0.12)] md:p-4">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-red-600">ÙØ±ÙˆØ´Ú¯Ø§Ù‡ Ø§ØµÙ„ÛŒ</h2>
              <p className="mt-1 text-xs text-slate-500">Ù‡Ù…Ù‡ Ù…Ø­ØµÙˆÙ„Ø§Øª Ù…ÙˆØ¬ÙˆØ¯ Carrtell</p>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600">ÙØ±ÙˆØ´Ú¯Ø§Ù‡ Ú©Ø§Ù…Ù„ <ArrowLeft className="h-4 w-4" /></Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => <div key={index} className="h-[232px] animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 justify-items-center gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} reservedQuantity={reserved[product.id || ''] || 0} onAddToCart={handleAdd} compact />
              ))}
            </div>
          )}

          {!loading && visibleCount < activeProducts.length && (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700">
                <Plus className="h-5 w-5" /> Ù†Ù…Ø§ÛŒØ´ Û²Ûµ Ù…Ø­ØµÙˆÙ„ Ø¨ÛŒØ´ØªØ±
              </button>
            </div>
          )}

          {!loading && activeProducts.length > 0 && visibleCount >= activeProducts.length && (
            <p className="mt-6 text-center text-xs font-bold text-slate-400">Ù‡Ù…Ù‡ Ù…Ø­ØµÙˆÙ„Ø§Øª Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ø´Ø¯Ù†Ø¯.</p>
          )}
        </div>
      </section>
    </main>
  );
}
