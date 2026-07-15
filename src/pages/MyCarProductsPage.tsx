import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, CheckCircle2, PackageCheck, RefreshCw, ShoppingCart, Sparkles, Wrench } from 'lucide-react';
import { addProductToCart } from '../lib/cart';
import { readSelectedCustomerCar, onSelectedCustomerCarChange } from '../customer/services/selectedCar';
import { getMyCarRecommendations, type MyCarRecommendations, type RecommendedProduct } from '../customer/services/recommendationsApi';
import { getCategoryLabel } from '../config/productCategories';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(price) || 0);
}

function ProductCard({ product }: { product: RecommendedProduct }) {
  const finalPrice = product.amazing_price && product.amazing_ends_at && new Date(product.amazing_ends_at).getTime() > Date.now()
    ? Number(product.amazing_price)
    : Number(product.price || 0);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-navy-900/80 shadow-2xl shadow-black/20">
      <Link to={`/shop/product/${product.id}`} className="relative flex aspect-square items-center justify-center bg-navy-950/70">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-4" /> : <Sparkles className="h-16 w-16 text-gold-500/30" />}
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-300">مناسب خودروی شما</span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-white/45">
          <span className="rounded-full bg-white/5 px-2 py-1">{product.brand || 'Carrtell'}</span>
          <span className="rounded-full bg-white/5 px-2 py-1">{getCategoryLabel(product.category)}</span>
        </div>
        <Link to={`/shop/product/${product.id}`} className="mb-2 line-clamp-2 min-h-[52px] text-sm font-black leading-7 text-white hover:text-gold-300">{product.name}</Link>
        <p className="mb-4 line-clamp-2 min-h-[48px] text-xs leading-6 text-white/45">{product.recommendation_reason}</p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-white/35">قیمت</p>
            <b className="text-lg text-gold-300">{formatPrice(finalPrice)}</b>
            <span className="mr-1 text-[11px] text-white/40">تومان</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const result = addProductToCart(product, 1);
              alert(result.message);
            }}
            className="rounded-2xl bg-gold-500 px-3 py-2 text-xs font-black text-navy-950 transition hover:bg-gold-400"
          >
            افزودن
          </button>
        </div>
      </div>
    </article>
  );
}

function Section({ title, icon, items, emptyText }: { title: string; icon: ReactNode; items: RecommendedProduct[]; emptyText: string }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-black text-white">{icon}{title}</h2>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/45">{items.length} محصول</span>
      </div>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/45">{emptyText}</div>
      )}
    </section>
  );
}

export default function MyCarProductsPage() {
  const [data, setData] = useState<MyCarRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  async function load() {
    setLoading(true);
    setErrorText('');
    try {
      const selectedCar = readSelectedCustomerCar();
      const result = await getMyCarRecommendations(selectedCar);
      setData(result);
    } catch (error) {
      console.error('recommendation page load error:', error);
      setErrorText('پیشنهادهای خودروی شما لود نشد. اگر تازه پچ را کپی کرده‌ای، SQL پیشنهادها را اجرا کن.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return onSelectedCustomerCarChange(load);
  }, []);

  const selectedCarTitle = data?.selectedCar?.title || 'خودروی من';
  const allProducts = useMemo(() => data?.products || [], [data]);

  return (
    <main className="min-h-screen bg-navy-950 pb-24 pt-28" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-gold-400/25 bg-gradient-to-l from-gold-500/20 via-navy-900 to-navy-950 p-5 shadow-2xl shadow-gold-500/10 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-4 py-2 text-xs font-black text-gold-200"><CarFront className="h-4 w-4" /> پیشنهاد هوشمند Carrtell</p>
              <h1 className="text-2xl font-black leading-10 text-white md:text-4xl">محصولات مناسب {selectedCarTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">این بخش فقط محصولات فعال، موجود و سازگار با خودروی انتخابی شما را نمایش می‌دهد. پکیج‌ها فقط از پکیج‌های آماده‌شده توسط مدیر پیشنهاد می‌شوند.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/profile" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10">تغییر خودرو</Link>
              <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-gold-500 px-5 py-3 text-sm font-black text-navy-950 hover:bg-gold-400"><RefreshCw className="h-4 w-4" /> بروزرسانی</button>
            </div>
          </div>
        </section>

        {loading && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">در حال ساخت پیشنهادهای مناسب خودرو...</div>}
        {!!errorText && <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">{errorText}</div>}
        {(data?.warnings || []).map((warning) => (
          <div key={warning} className="mb-4 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">{warning}</div>
        ))}

        {!loading && data && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs text-white/40">محصول سازگار</p><b className="text-3xl text-white">{allProducts.length}</b></div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs text-white/40">پکیج آماده</p><b className="text-3xl text-white">{data.packages.length}</b></div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs text-white/40">ملاک یادآوری سرویس</p><b className="text-lg text-gold-300">کیلومتر خودرو</b></div>
            </div>

            <Section title="اقلام ضروری سرویس" icon={<CheckCircle2 className="h-6 w-6 text-emerald-300" />} items={data.essential} emptyText="برای اقلام ضروری این خودرو محصول موجود و سازگار پیدا نشد." />
            <Section title="پیشنهاد کارتل" icon={<Sparkles className="h-6 w-6 text-gold-300" />} items={data.carrtellPicks} emptyText="فعلاً پیشنهاد ویژه‌ای برای این خودرو ثبت نشده است." />
            <Section title="مناسب سرویس بعدی" icon={<Wrench className="h-6 w-6 text-cyan-300" />} items={data.nextService} emptyText="برای سرویس بعدی این خودرو محصول موجود پیدا نشد." />

            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white"><PackageCheck className="h-6 w-6 text-gold-300" /> پکیج‌های آماده مدیر</h2>
              {data.packages.length ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {data.packages.map((pkg) => (
                    <Link key={pkg.id} to={`/package-categories/${pkg.id}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-gold-400/40 hover:bg-white/[0.07]">
                      <span className="mb-3 inline-block rounded-full bg-gold-500/15 px-3 py-1 text-xs font-black text-gold-300">{pkg.badge || pkg.category_title}</span>
                      <h3 className="mb-2 text-lg font-black text-white">{pkg.title}</h3>
                      <p className="mb-4 line-clamp-2 text-sm leading-7 text-white/50">{pkg.description || pkg.recommendation_reason}</p>
                      <p className="text-xs text-white/35">{pkg.available_items_count} از {pkg.total_items_count || pkg.available_items_count} آیتم موجود</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/45">برای این خودرو هنوز پکیج آماده‌ای توسط مدیر ساخته نشده است.</div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
