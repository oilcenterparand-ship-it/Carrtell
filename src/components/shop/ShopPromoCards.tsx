import { CarFront, Droplets, PackageCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductCategory } from '../../admin/services/categoriesApi';

interface ShopPromoCardsProps {
  categories: ProductCategory[];
}

export function ShopPromoCards({ categories }: ShopPromoCardsProps) {
  const tireCategory = categories.find((item) => /لاستیک|تایر/.test(`${item.title} ${item.slug}`))?.slug || 'tire';
  const antifreezeCategory = categories.find((item) => /ضد.?یخ|antifreeze/i.test(`${item.title} ${item.slug}`))?.slug || 'antifreeze';

  return (
    <section className="ct-shop-promo-cards mb-4 flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-3" aria-label="پیشنهادهای ویژه Carrtell">
      <Link
        to={`/shop?category=${encodeURIComponent(tireCategory)}`}
        className="ct-shop-promo-card group relative min-h-[138px] overflow-hidden rounded-[22px] border border-rose-200 bg-gradient-to-l from-rose-600 via-red-500 to-orange-400 p-5 text-white shadow-[0_10px_24px_rgba(225,29,72,0.18)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(225,29,72,0.25)]"
      >
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/15 transition group-hover:scale-110" />
        <div className="relative flex h-full items-center justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black">جشنواره محدود</span>
            <h3 className="text-lg font-black leading-7">جشنواره فروش ویژه لاستیک</h3>
            <p className="mt-1 text-[11px] font-bold text-white/85">مشاهده مدل‌ها و برندهای منتخب</p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <CarFront className="h-8 w-8" />
          </span>
        </div>
      </Link>

      <Link
        to={`/shop?category=${encodeURIComponent(antifreezeCategory)}`}
        className="ct-shop-promo-card group relative min-h-[138px] overflow-hidden rounded-[22px] border border-sky-200 bg-gradient-to-l from-sky-600 via-cyan-500 to-teal-400 p-5 text-white shadow-[0_10px_24px_rgba(8,145,178,0.18)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(8,145,178,0.25)]"
      >
        <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-white/15 transition group-hover:scale-110" />
        <div className="relative flex h-full items-center justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black">تخفیف فصل</span>
            <h3 className="text-lg font-black leading-7">تخفیف ویژه محصولات ضدیخ</h3>
            <p className="mt-1 text-[11px] font-bold text-white/85">محافظت مطمئن از سیستم خنک‌کننده</p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Droplets className="h-8 w-8" />
          </span>
        </div>
      </Link>

      <Link
        to="/shop/packages"
        className="ct-shop-promo-card group relative min-h-[138px] overflow-hidden rounded-[22px] border border-amber-200 bg-gradient-to-l from-amber-500 via-yellow-400 to-lime-400 p-5 text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.18)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(245,158,11,0.25)]"
      >
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/25 transition group-hover:scale-110" />
        <div className="relative flex h-full items-center justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-white/35 px-2.5 py-1 text-[10px] font-black">انتخاب هوشمند</span>
            <h3 className="text-lg font-black leading-7">پک‌های اقتصادی ویژه خودروی شما</h3>
            <p className="mt-1 text-[11px] font-bold text-slate-800/75">خرید کامل‌تر با قیمت به‌صرفه‌تر</p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/35 backdrop-blur">
            <PackageCheck className="h-8 w-8" />
          </span>
        </div>
      </Link>
    </section>
  );
}
