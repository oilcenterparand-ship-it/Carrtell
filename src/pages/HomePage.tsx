import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  Headphones,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { ProductCard } from './ShopPage';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { addProductToCart, readCart, type CartItem } from '../lib/cart';
import { getApprovedCustomerReviews, type CustomerReview } from '../admin/services/customerReviewsApi';

const PAGE_SIZE = 25;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productRows, categoryRows, reviewRows] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getApprovedCustomerReviews(6),
        ]);
        if (!active) return;
        setProducts(productRows.filter((product) => product.is_active !== false));
        setCategories(categoryRows.filter((category) => category.is_active !== false));
        setReviews(reviewRows);
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
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
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

          <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-white p-4 shadow-sm">
            {[
              { title: 'ضمانت اصالت', Icon: ShieldCheck },
              { title: 'ارسال سریع', Icon: Truck },
              { title: 'پشتیبانی', Icon: Headphones },
              { title: 'بسته‌بندی امن', Icon: PackageCheck },
            ].map(({ title, Icon }) => (
              <div key={title} className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-center">
                <Icon className="mb-2 h-6 w-6 text-red-500" />
                <span className="text-xs font-black">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">دسته‌بندی‌های محبوب</h2>
          <Link to="/shop" className="flex items-center gap-1 text-xs font-bold text-slate-500">مشاهده همه <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id || category.slug} to={`/shop?category=${encodeURIComponent(category.slug)}`} className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">{category.icon_emoji || '🚘'}</div>
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

      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 pb-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">نظر مشتریان</h2>
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex gap-1 text-amber-400">{Array.from({ length: Number(review.rating || 0) }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                <p className="line-clamp-3 text-xs leading-6 text-slate-600">{review.comment}</p>
                <div className="mt-3 text-xs font-black">{review.customer_name || 'مشتری Carrtell'}</div>
              </article>
            ))}
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
