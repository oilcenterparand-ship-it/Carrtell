import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  Plus,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ProductCard } from './ShopPage';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCategoryDestination, getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { addProductToCart, readCart, type CartItem } from '../lib/cart';
import { defaultMegaMenuTiles, getMegaMenuTiles, type MegaMenuTile } from '../admin/services/homeContentApi';

const PAGE_SIZE = 25;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [promoTiles, setPromoTiles] = useState<MegaMenuTile[]>(defaultMegaMenuTiles);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productRows, categoryRows, promoTileRows] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getMegaMenuTiles(),
        ]);
        if (!active) return;
        setProducts(productRows.filter((product) => product.is_active !== false));
        setCategories(categoryRows.filter((category) => category.is_active !== false));
        setPromoTiles(promoTileRows);
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

  function handleAdd(product: Product) {
    addProductToCart(product, 1);
    setCart(readCart());
  }

  return (
    <main dir="rtl" className="bg-[#f7f7f8] text-slate-900 pt-28">
      <section className="mx-auto max-w-[1240px] px-4 pt-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative min-h-[245px] overflow-hidden rounded-[24px] bg-gradient-to-l from-[#a61017] via-[#d51d26] to-[#f0444d] p-7 text-white shadow-sm">
            <div className="relative z-10 max-w-xl">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
                <Sparkles className="h-4 w-4" /> سرویس و فروش تخصصی خودرو
              </span>
              <h1 className="text-3xl font-black leading-[1.7] md:text-4xl">فروشگاه تخصصی Carrtell</h1>
              <p className="mt-2 max-w-lg text-sm leading-7 text-white/85">محصول مناسب خودرو را پیدا کن، آنلاین سفارش بده یا سرویس در محل رزرو کن.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/shop" className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-red-600">مشاهده فروشگاه</Link>
                <Link to="/book" className="rounded-xl border border-white/50 px-5 py-2.5 text-sm font-black text-white">رزرو سرویس</Link>
              </div>
            </div>
            <div className="absolute -left-10 -bottom-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute left-16 top-10 h-24 w-24 rounded-full bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-950 p-3 shadow-sm" data-testid="home-hero-promo-tiles" aria-label="بنرهای تبلیغاتی صفحه اصلی">
            {activePromoTiles.map((tile) => (
              <Link key={tile.id || `${tile.title}-${tile.sort_order}`} to={tile.link_url || '/shop'} className="group relative min-h-[112px] overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-900 text-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:shadow-lg">
                {tile.image_url ? <img src={tile.image_url} alt={tile.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                  {tile.badge && <span className="mb-1 inline-flex rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-black text-slate-950">{tile.badge}</span>}
                  <h2 className="line-clamp-2 text-[11px] font-black leading-5">{tile.title}</h2>
                  <span className="mt-1 flex items-center gap-1 text-[8px] font-bold text-amber-300">مشاهده <ArrowLeft className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-7">
        <Link to="/industrial" className="flex min-h-[150px] items-center justify-between overflow-hidden rounded-[24px] bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-lg transition hover:-translate-y-0.5">
          <div><span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black text-amber-300">بخش تخصصی جدید</span><h2 className="mt-3 text-xl font-black">روغن و فیلتر دیزلی و صنعتی</h2><p className="mt-1 text-xs leading-6 text-slate-300">خودرو سنگین، ماشین‌آلات، کارخانه، گالن ۲۰ لیتری و بشکه</p></div>
          <Truck className="h-16 w-16 shrink-0 text-amber-400/80" />
        </Link>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">دسته‌بندی‌های محبوب</h2>
          <Link to="/shop" className="flex items-center gap-1 text-xs font-bold text-slate-500">مشاهده همه <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id || category.slug} to={getCategoryDestination(category, 'journey')} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mx-auto mb-2 flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-2xl">
                {category.image_url ? <img src={category.image_url} alt={category.title} loading="lazy" className="h-full w-full object-contain p-1.5" /> : <span aria-hidden="true">{category.icon_emoji || '🚘'}</span>}
              </div>
              <div className="truncate text-[11px] font-black">{category.title}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-7">
        <div className="grid gap-3 md:grid-cols-3">
          {['روغن موتورهای پرفروش', 'پکیج کامل سرویس دوره‌ای', 'سرویس تخصصی در محل'].map((title, index) => (
            <Link key={title} to={index === 2 ? '/book' : '/shop'} className="flex min-h-[125px] items-end rounded-[22px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white shadow-sm">
              <div><div className="font-black">{title}</div><div className="mt-1 text-xs text-white/60">مشاهده جزئیات</div></div>
            </Link>
          ))}
        </div>
      </section>

      {amazingProducts.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 pb-7">
          <div className="rounded-[24px] bg-red-600 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-white">
              <h2 className="text-lg font-black text-red-600">پیشنهاد شگفت‌انگیز</h2>
              <Link to="/shop/special-offers" className="text-xs font-bold">مشاهده همه</Link>
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
              <h2 className="text-xl font-black text-red-600">فروشگاه اصلی</h2>
              <p className="mt-1 text-xs text-slate-500">همه محصولات موجود Carrtell</p>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600">فروشگاه کامل <ArrowLeft className="h-4 w-4" /></Link>
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
                <Plus className="h-5 w-5" /> نمایش ۲۵ محصول بیشتر
              </button>
            </div>
          )}

          {!loading && activeProducts.length > 0 && visibleCount >= activeProducts.length && (
            <p className="mt-6 text-center text-xs font-bold text-slate-400">همه محصولات نمایش داده شدند.</p>
          )}
        </div>
      </section>
    </main>
  );
}
