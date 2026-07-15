import React, { useEffect, useState } from 'react';
import { getSmartSuggestions } from '../../services/smartSalesEngine';

type Props = {
  productId?: string | null;
  carId?: string | null;
  onAdd?: (product: any) => void;
};

export default function ProductUpsellBox({ productId, carId, onAdd }: Props) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getSmartSuggestions({ currentProductId: productId, carId, limit: 4 }).then(setItems).catch(() => setItems([]));
  }, [productId, carId]);

  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 my-4">
      <h3 className="text-base font-bold text-white mb-1">معمولاً همراه این محصول خریداری می‌شود</h3>
      <p className="text-xs text-white/60 mb-3">پیشنهادها بر اساس موجودی و سازگاری خودرو فیلتر شده‌اند.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl bg-black/20 border border-white/10 p-3">
            <div className="text-sm font-bold text-white line-clamp-2">{p.name}</div>
            <div className="mt-2 text-xs text-amber-300">{Number(p.price || 0).toLocaleString('fa-IR')} تومان</div>
            {onAdd && <button onClick={() => onAdd(p)} className="mt-3 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black w-full">افزودن</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
