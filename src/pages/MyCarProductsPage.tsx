import { useEffect, useMemo, useState } from 'react';
import { CarFront, CheckCircle2, Search, X } from 'lucide-react';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCars, getCarTitle, type Car } from '../admin/services/carsApi';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { getApprovedProductReviewSummaries, type ProductReviewSummary } from '../admin/services/customerReviewsApi';
import { addProductToCart, changeCartQuantity, readCart, type CartItem } from '../lib/cart';
import { onSelectedCustomerCarChange, readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import { ProductCard } from './ShopPage';

export default function MyCarProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ProductReviewSummary>>({});
  const [selectedCarId, setSelectedCarId] = useState(() => readSelectedCustomerCar()?.id || '');
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [carSearch, setCarSearch] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      getProducts(),
      getCars(),
      getThemeSettings(),
      getApprovedProductReviewSummaries().catch(() => ({})),
    ]).then(([productRows, carRows, themeRow, summaries]) => {
      if (!active) return;
      setProducts(productRows.filter((product) => product.is_active !== false));
      setCars(carRows.filter((car) => car.is_active !== false));
      setTheme({ ...defaultThemeSettings, ...(themeRow || {}) });
      setReviewSummaries(summaries || {});
    }).catch((error) => console.error('My-car storefront load error:', error)).finally(() => active && setLoading(false));

    const syncCart = () => setCart(readCart());
    const syncCar = () => setSelectedCarId(readSelectedCustomerCar()?.id || '');
    window.addEventListener('carrtell-cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    const unsubscribeCar = onSelectedCustomerCarChange(syncCar);
    return () => {
      active = false;
      window.removeEventListener('carrtell-cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
      unsubscribeCar();
    };
  }, []);

  const selectedCar = cars.find((car) => car.id === selectedCarId) || null;
  const reserved = useMemo(() => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])), [cart]);
  const visibleCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    return cars.filter((car) => !query || getCarTitle(car).toLocaleLowerCase('fa').includes(query) || `${car.brand || ''} ${car.model || ''}`.toLocaleLowerCase('fa').includes(query));
  }, [cars, carSearch]);

  function addToCart(product: Product) {
    const result = addProductToCart(product, 1);
    if (!result.ok) return alert(result.message);
    setCart(result.cart || readCart());
  }

  function changeQuantity(product: Product, delta: number) {
    changeCartQuantity(product, delta);
    setCart(readCart());
  }

  function chooseCar(car: Car) {
    saveSelectedCustomerCar(car);
    setSelectedCarId(car.id || '');
    setPickerOpen(false);
    setCarSearch('');
  }

  return (
    <main className="ct-my-car-store min-h-screen bg-[#030910] pb-24 pt-28 text-white" dir="rtl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <section className="ct-my-car-selector">
          <div className="min-w-0">
            <span><CheckCircle2 /> محصولات مرتبط با خودرو</span>
            <b>{selectedCar ? getCarTitle(selectedCar) : 'خودروی خود را انتخاب کنید'}</b>
          </div>
          <button type="button" onClick={() => setPickerOpen(true)}><CarFront /> {selectedCar ? 'تغییر خودرو' : 'انتخاب خودرو'}</button>
        </section>

        <div className="mb-3 mt-5 flex items-end justify-between gap-3">
          <div><h1 className="text-lg font-black sm:text-xl">همه محصولات فروشگاه</h1><p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">محصولات سازگار با خودروی شما با نشان سبز مشخص شده‌اند.</p></div>
          <span className="shrink-0 text-[10px] text-slate-500">{products.length.toLocaleString('fa-IR')} محصول</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="h-[242px] animate-pulse rounded-2xl bg-white/5" />)}</div>
        ) : (
          <div className="ct-my-car-product-grid grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => <ProductCard key={product.id} product={product} reservedQuantity={product.id ? reserved[product.id] || 0 : 0} onAddToCart={addToCart} onChangeQuantity={changeQuantity} grid theme={theme} selectedCarId={selectedCarId || undefined} ratingSummary={product.id ? reviewSummaries[product.id] : undefined} />)}
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/75 p-3 sm:items-center" onClick={() => setPickerOpen(false)}>
          <section className="w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-amber-400/40 bg-[#0d182a] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="font-black">انتخاب خودرو</h2><p className="mt-1 text-xs text-slate-400">پس از انتخاب، محصولات سازگار نشان سبز می‌گیرند.</p></div><button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10" onClick={() => setPickerOpen(false)}><X /></button></header>
            <div className="relative m-4"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" /><input value={carSearch} onChange={(event) => setCarSearch(event.target.value)} placeholder="جست‌وجوی نام خودرو..." className="h-12 w-full rounded-xl border border-white/10 bg-[#08111f] py-3 pl-4 pr-10 text-sm outline-none focus:border-amber-400" /></div>
            <div className="max-h-[52dvh] overflow-y-auto px-4 pb-4">
              {visibleCars.map((car) => <button type="button" key={car.id} onClick={() => chooseCar(car)} className={`mb-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right text-sm font-bold ${car.id === selectedCarId ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-white'}`}><span>{getCarTitle(car)}</span>{car.id === selectedCarId && <CheckCircle2 className="h-4 w-4" />}</button>)}
              {!visibleCars.length && <p className="p-6 text-center text-sm text-slate-400">خودرویی پیدا نشد.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
