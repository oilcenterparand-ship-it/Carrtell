import type { ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Product } from '../../admin/services/productsApi';

interface ShopProductGridProps {
  products: Product[];
  visibleCount: number;
  mutedTextColor: string;
  primaryColor: string;
  onLoadMore: () => void;
  onClearFilters: () => void;
  renderProduct: (product: Product) => ReactNode;
}

export function ShopProductGrid({
  products,
  visibleCount,
  mutedTextColor,
  primaryColor,
  onLoadMore,
  onClearFilters,
  renderProduct,
}: ShopProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <p className="font-black text-slate-500">محصولی با این فیلترها پیدا نشد</p>
        <button type="button" onClick={onClearFilters} className="mt-3 text-xs font-black" style={{ color: primaryColor }}>
          حذف همه فیلترها
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="ct-shop-main-product-grid grid grid-cols-2 items-stretch gap-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
        {products.slice(0, visibleCount).map(renderProduct)}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (Math.min(visibleCount, products.length) / products.length) * 100)}%`,
              background: primaryColor,
            }}
          />
        </div>
        <p className="text-[11px] font-bold" style={{ color: mutedTextColor }}>
          نمایش {Math.min(visibleCount, products.length).toLocaleString('fa-IR')} از {products.length.toLocaleString('fa-IR')} محصول
        </p>
        {visibleCount < products.length ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="flex min-w-[170px] items-center justify-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            style={{ borderColor: `${primaryColor}55`, color: primaryColor }}
          >
            نمایش محصولات بیشتر
            <ChevronDown className="h-4 w-4" />
          </button>
        ) : (
          <p className="text-center text-xs font-black" style={{ color: mutedTextColor }}>همه محصولات نمایش داده شد.</p>
        )}
      </div>
    </>
  );
}
