import { useEffect, useMemo, useState } from 'react';
import {
  getInventoryMovements,
  getInventoryProducts,
  getInventoryStatus,
  getInventoryStatusLabel,
  getProductMinStock,
  getProductStock,
  updateLowStockThreshold,
  updateProductInventory,
  type InventoryMovementRow,
  type InventoryMovementType,
  type InventoryProductRow,
} from '../services/inventoryApi';

const darkInput =
  'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20';

const statusClass = {
  in_stock: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  low_stock: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  out_of_stock: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
};

const movementLabels: Record<InventoryMovementType, string> = {
  increase: 'افزایش موجودی',
  decrease: 'کاهش موجودی',
  adjustment: 'اصلاح دستی',
  sale: 'فروش',
  return: 'مرجوعی',
};

export default function Inventory() {
  const [products, setProducts] = useState<InventoryProductRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<InventoryMovementType>('increase');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, movementsData] = await Promise.all([
        getInventoryProducts(),
        getInventoryMovements(),
      ]);
      setProducts(productsData);
      setMovements(movementsData);
      if (!selectedProductId && productsData[0]?.id) setSelectedProductId(productsData[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const out = products.filter((p) => getInventoryStatus(p) === 'out_of_stock').length;
    const low = products.filter((p) => getInventoryStatus(p) === 'low_stock').length;
    const ok = total - out - low;
    return { total, ok, low, out };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const title = String(product.name || product.title || '').toLowerCase();
      const sku = String(product.sku || '').toLowerCase();
      const status = getInventoryStatus(product);
      const matchesSearch = !term || title.includes(term) || sku.includes(term);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const handleMovement = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    setMessage('');
    try {
      await updateProductInventory({
        productId: selectedProductId,
        movementType,
        quantity: Number(quantity),
        note,
      });
      setMessage('موجودی با موفقیت بروزرسانی شد.');
      setQuantity('1');
      setNote('');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خطا در بروزرسانی موجودی');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdBlur = async (productId: string, value: string) => {
    try {
      await updateLowStockThreshold(productId, Number(value));
      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? { ...product, low_stock_threshold: Number(value), min_stock: Number(value) }
            : product,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خطا در ذخیره حداقل موجودی');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/40 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-amber-200">Carrtell Inventory</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">انبارداری و کنترل موجودی</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                موجودی محصولات، هشدار کمبود، گردش کالا و کاهش خودکار موجودی بعد از پرداخت از این بخش مدیریت می‌شود.
              </p>
            </div>
            <button
              onClick={() => void loadData()}
              className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300"
            >
              بروزرسانی اطلاعات
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="کل محصولات" value={stats.total} />
          <StatCard title="موجود" value={stats.ok} tone="emerald" />
          <StatCard title="رو به اتمام" value={stats.low} tone="amber" />
          <StatCard title="ناموجود" value={stats.out} tone="rose" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجوی محصول یا SKU..."
                className={darkInput}
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className={darkInput}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="in_stock">موجود</option>
                <option value="low_stock">رو به اتمام</option>
                <option value="out_of_stock">ناموجود</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-300">
                در حال خواندن اطلاعات انبار...
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="max-h-[620px] overflow-auto">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-950/95 text-slate-300 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3 text-right">محصول</th>
                        <th className="px-4 py-3 text-center">موجودی</th>
                        <th className="px-4 py-3 text-center">حداقل هشدار</th>
                        <th className="px-4 py-3 text-center">وضعیت</th>
                        <th className="px-4 py-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-slate-900/40">
                      {filteredProducts.map((product) => {
                        const status = getInventoryStatus(product);
                        return (
                          <tr key={product.id} className="hover:bg-white/[0.03]">
                            <td className="px-4 py-4">
                              <div className="font-bold text-white">{product.name || product.title || 'بدون نام'}</div>
                              <div className="mt-1 text-xs text-slate-400">{product.sku || product.brand || product.category || '—'}</div>
                            </td>
                            <td className="px-4 py-4 text-center text-lg font-black">{getProductStock(product)}</td>
                            <td className="px-4 py-4 text-center">
                              <input
                                defaultValue={getProductMinStock(product)}
                                onBlur={(event) => void handleThresholdBlur(product.id, event.target.value)}
                                className="mx-auto w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-white outline-none focus:border-amber-400/60"
                                type="number"
                                min={0}
                              />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass[status]}`}>
                                {getInventoryStatusLabel(status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => setSelectedProductId(product.id)}
                                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-400/20"
                              >
                                انتخاب
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <h2 className="text-lg font-black">ثبت گردش کالا</h2>
              <div className="mt-4 space-y-3">
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className={darkInput}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name || product.title} - موجودی {getProductStock(product)}
                    </option>
                  ))}
                </select>
                <select value={movementType} onChange={(event) => setMovementType(event.target.value as InventoryMovementType)} className={darkInput}>
                  {Object.entries(movementLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min={0} className={darkInput} placeholder="تعداد" />
                <textarea value={note} onChange={(event) => setNote(event.target.value)} className={darkInput} rows={3} placeholder="توضیح اختیاری" />
                <button
                  disabled={saving || !selectedProduct}
                  onClick={() => void handleMovement()}
                  className="w-full rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'در حال ذخیره...' : 'ثبت تغییر موجودی'}
                </button>
                {message && <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200">{message}</div>}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <h2 className="text-lg font-black">آخرین گردش‌ها</h2>
              <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                {movements.length === 0 ? (
                  <p className="text-sm text-slate-400">هنوز گردش کالایی ثبت نشده است.</p>
                ) : (
                  movements.map((movement) => (
                    <div key={movement.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-white">{movementLabels[movement.movement_type]}</span>
                        <span className="text-amber-200">{movement.quantity}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {movement.previous_stock} ← {movement.new_stock}
                      </div>
                      {movement.note && <div className="mt-2 text-xs leading-6 text-slate-300">{movement.note}</div>}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, tone = 'slate' }: { title: string; value: number; tone?: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const toneClass = {
    slate: 'from-slate-900 to-slate-800 text-white',
    emerald: 'from-emerald-950/80 to-slate-900 text-emerald-100',
    amber: 'from-amber-950/80 to-slate-900 text-amber-100',
    rose: 'from-rose-950/80 to-slate-900 text-rose-100',
  }[tone];

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br p-5 shadow-xl shadow-black/20 ${toneClass}`}>
      <p className="text-sm text-slate-300">{title}</p>
      <div className="mt-3 text-3xl font-black">{value.toLocaleString('fa-IR')}</div>
    </div>
  );
}
