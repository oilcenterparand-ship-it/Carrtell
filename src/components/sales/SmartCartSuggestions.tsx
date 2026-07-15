import React, { useEffect, useState } from 'react';
import { getSmartSuggestions } from '../../services/smartSalesEngine';

type Props = {
  carId?: string | null;
  cartItems?: any[];
  onAdd?: (product: any) => void;
};

export default function SmartCartSuggestions({ carId, cartItems = [], onAdd }: Props) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getSmartSuggestions({ carId, cartItems, limit: 6 }).then(setItems).catch(() => setItems([]));
  }, [carId, JSON.stringify(cartItems.map((i) => i.id))]);

  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 my-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">تکمیل هوشمند سبد خرید</h3>
          <p className="text-xs text-white/60">فقط محصولات موجود و مناسب خودروی انتخاب‌شده پیشنهاد می‌شوند.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl bg-black/20 border border-white/10 p-3 flex flex-col gap-2">
            <div className="aspect-square rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-contain" /> : <span className="text-white/40">بدون عکس</span>}
            </div>
            <div className="text-xs font-bold text-white line-clamp-2 min-h-[32px]">{p.name}</div>
            <div className="text-xs text-amber-300">{Number(p.price || 0).toLocaleString('fa-IR')} تومان</div>
            {onAdd && <button onClick={() => onAdd(p)} className="rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-black">افزودن</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
