import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck, Plus, ShoppingCart } from 'lucide-react';
import { getCarPackages, type CarPackage } from '../admin/services/packagesApi';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { addProductToCart } from '../lib/cart';
import { formatPrice, getProductFinalPrice } from '../admin/services/ordersUtils';


function isDarkColor(hex?: string) {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function readable(background?: string, fallback = '#0f172a') {
  return isDarkColor(background) ? '#ffffff' : fallback;
}

function packageIsAvailable(pkg: CarPackage) {
  return (pkg.items || []).some((item) => item.product && item.product.is_active !== false && !item.product.is_out_of_stock && Number(item.product.stock || 0) > 0);
}

export default function PackageListPage() {
  const { categoryId, carId } = useParams();
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCarPackages(), getThemeSettings()])
      .then(([data, themeData]) => {
        if (!mounted) return;
        setPackages((data || []).filter((pkg) => pkg.is_active !== false));
        setTheme({ ...defaultThemeSettings, ...(themeData || {}) });
      })
      .catch((error) => {
        console.error('Package load error:', error);
        setPackages([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => !categoryId || pkg.category_title === categoryId || pkg.slug === categoryId)
      .filter((pkg) => !carId || !pkg.car_id || pkg.car_id === carId)
      .filter(packageIsAvailable);
  }, [packages, categoryId, carId]);

  function addPackageToCart(pkg: CarPackage) {
    let added = 0;
    (pkg.items || []).forEach((item) => {
      if (!item.product) return;
      const result = addProductToCart(item.product, Math.max(1, Number(item.quantity || 1)));
      if (result.ok) added += 1;
    });
    alert(added ? 'محصولات موجود این پکیج به سبد خرید اضافه شد.' : 'محصول قابل افزودن در این پکیج وجود ندارد.');
  }

  const sectionBackground = 'var(--ct-surface-2)';
  const cardBackground = 'var(--ct-surface)';
  const imageBackground = 'var(--ct-surface-2)';
  const sectionText = 'var(--ct-text)';
  const cardText = 'var(--ct-text)';
  const mutedText = 'var(--ct-muted)';

  return (
    <main dir="rtl" className="min-h-screen px-3 pb-16 pt-24 sm:px-4" style={{ background: 'var(--ct-bg)', color: 'var(--ct-text)', fontFamily: 'var(--ct-font-family)' }}>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border p-4 shadow-sm" style={{ background: sectionBackground, color: sectionText, borderColor: 'var(--ct-border)', borderRadius: theme.borderRadius }}>
          <div>
            <p className="mb-1 text-sm font-bold text-gold-500">پکیج‌های آماده مدیر</p>
            <h1 className="text-2xl font-black">پکیج‌های پیشنهادی Carrtell</h1>
            <p className="mt-1 text-xs" style={{ color: mutedText }}>پکیج هوشمند خودکار حذف شده و فقط پکیج‌های ساخته‌شده در پنل مدیریت نمایش داده می‌شوند.</p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-2xl bg-gold-500 px-5 py-3 text-sm font-black text-navy-950">
            بازگشت به فروشگاه <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/10 p-8 text-center font-bold shadow-sm">در حال دریافت پکیج‌ها...</div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-3xl border border-white/10 p-8 text-center shadow-sm">
            <PackageCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h2 className="text-xl font-black">پکیج فعالی پیدا نشد</h2>
            <p className="mt-1 text-xs" style={{ color: mutedText }}>از پنل مدیریت، پکیج فعال بسازید یا موجودی محصولات داخل پکیج را بررسی کنید.</p>
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredPackages.map((pkg) => {
              const total = (pkg.items || []).reduce((sum, item) => sum + (item.product ? getProductFinalPrice(item.product) * Number(item.quantity || 1) : 0), 0);
              return (
                <article key={pkg.id || pkg.slug || pkg.title} className="overflow-hidden border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: cardBackground, color: cardText, borderColor: 'var(--ct-border)', borderRadius: theme.borderRadius }}>
                  <div className="flex h-24 items-center justify-center overflow-hidden sm:h-28" style={{ background: imageBackground }}>
                    {pkg.image_url ? <img src={pkg.image_url} alt={pkg.title} className="h-full w-full object-contain p-2" /> : <PackageCheck className="h-10 w-10 text-slate-300" />}
                  </div>
                  <div className="space-y-2.5 p-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-black text-gold-500">{pkg.category_title || 'پکیج آماده'}</span>
                        {pkg.badge && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">{pkg.badge}</span>}
                      </div>
                      <h2 className="line-clamp-2 min-h-9 text-sm font-black leading-5">{pkg.title}</h2>
                      {pkg.description && <p className="mt-1 line-clamp-2 text-[11px] leading-5" style={{ color: mutedText }}>{pkg.description}</p>}
                    </div>
                    <div className="space-y-1.5 rounded-xl border p-2" style={{ background: imageBackground, borderColor: 'var(--ct-border)' }}>
                      {(pkg.items || []).slice(0, 4).map((item) => (
                        <div key={`${pkg.id}-${item.product_id}`} className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="line-clamp-1" style={{ color: cardText }}>{item.product?.name || 'محصول'}</span>
                          <b className="shrink-0" style={{ color: cardText }}>× {Number(item.quantity || 1).toLocaleString('fa-IR')}</b>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px]" style={{ color: mutedText }}>جمع حدودی</p>
                        <b className="text-sm" style={{ color: cardText }}>{formatPrice(total)} تومان</b>
                      </div>
                      <button onClick={() => addPackageToCart(pkg)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black" style={{ background: 'var(--ct-primary)', color: 'var(--ct-primary-text)' }}>
                        <Plus className="h-4 w-4" /> افزودن
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <Link to="/cart" className="fixed bottom-5 left-5 inline-flex items-center gap-2 rounded-2xl bg-gold-500 px-5 py-3 text-sm font-black text-navy-950 shadow-2xl">
          <ShoppingCart className="h-5 w-5" /> مشاهده سبد خرید
        </Link>
      </div>
    </main>
  );
}
