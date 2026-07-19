import type { ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';
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
      <div className="grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.slice(0, visibleCount).map(renderProduct)}
      </div>

      {visibleCount < products.length ? (
        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
            aria-label="نمایش محصولات بیشتر"
            title="نمایش ۱۲ محصول بیشتر"
          >
            <Plus className="h-6 w-6" />
          </button>
          <span className="text-xs font-black text-red-600">مشاهده بیشتر</span>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs font-bold" style={{ color: mutedTextColor }}>همه محصولات نمایش داده شد.</p>
      )}
    </>
  );
}
