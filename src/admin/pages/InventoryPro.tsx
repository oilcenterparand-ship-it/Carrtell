import { useEffect, useMemo, useState } from 'react';
import { addInventoryTransaction, InventoryRow, InventoryTransaction, listInventory, listInventoryTransactions, updateProductMinStock } from '../services/inventoryProApi';

const statusLabels = {
  in_stock: { label: 'موجود', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  low_stock: { label: 'رو به اتمام', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  out_of_stock: { label: 'ناموجود', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/20' },
};

const txLabels = {
  purchase: 'ورود کالا / خرید',
  sale: 'خروج کالا / فروش',
  manual_adjustment: 'اصلاح دستی',
  return: 'مرجوعی',
  damage: 'خرابی / ضایعات',
};

export default function InventoryPro() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [form, setForm] = useState({ type: 'purchase' as InventoryTransaction['type'], quantity: 1, note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [inventory, txs] = await Promise.all([listInventory(), listInventoryTransactions()]);
      setRows(inventory);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const low = rows.filter((x) => x.status === 'low_stock').length;
    const out = rows.filter((x) => x.status === 'out_of_stock').length;
    const value = rows.reduce((sum, x) => sum + (Number(x.price || 0) * Number(x.stock || 0)), 0);
    return { total, low, out, value };
  }, [rows]);

  const filtered = rows.filter((row) => `${row.name} ${row.brand || ''} ${row.sku || ''}`.toLowerCase().includes(query.toLowerCase()));

  const handleTx = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addInventoryTransaction({
        product_id: selected.id,
        type: form.type,
        quantity: Number(form.quantity) || 1,
        note: form.note,
      });
      setForm({ type: 'purchase', quantity: 1, note: '' });
      setSelected(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-amber-300">مدیریت انبار Carrtell</p>
              <h1 className="mt-1 text-2xl font-black">انبار حرفه‌ای و کنترل موجودی</h1>
              <p className="mt-2 text-sm text-slate-400">موجودی محصولات، حداقل هشدار، ورود و خروج کالا و تاریخچه گردش انبار.</p>
            </div>
            <button onClick={load} className="rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300">بروزرسانی</button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="کل محصولات" value={stats.total.toLocaleString('fa-IR')} />
          <Stat label="رو به اتمام" value={stats.low.toLocaleString('fa-IR')} tone="amber" />
          <Stat label="ناموجود" value={stats.out.toLocaleString('fa-IR')} tone="rose" />
          <Stat label="ارزش تقریبی انبار" value={`${Math.round(stats.value).toLocaleString('fa-IR')} تومان`} tone="emerald" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-black">لیست موجودی</h2>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی محصول..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-amber-400" />
            </div>
            {loading ? <p className="p-6 text-center text-slate-400">در حال دریافت اطلاعات...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-white/10">
                      <th className="p-3 text-right">محصول</th>
                      <th className="p-3">موجودی</th>
                      <th className="p-3">حداقل هشدار</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3">
                          <div className="font-bold">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.brand || 'بدون برند'} {row.sku ? `• ${row.sku}` : ''}</div>
                        </td>
                        <td className="p-3 text-center font-black">{row.stock.toLocaleString('fa-IR')}</td>
                        <td className="p-3 text-center">
                          <input type="number" defaultValue={row.min_stock} onBlur={(e) => updateProductMinStock(row.id, Number(e.target.value)).then(load)} className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-white" />
                        </td>
                        <td className="p-3 text-center"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusLabels[row.status].cls}`}>{statusLabels[row.status].label}</span></td>
                        <td className="p-3 text-center"><button onClick={() => setSelected(row)} className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/15">ثبت گردش</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <h2 className="font-black">⚠️ هشدار کمبود</h2>
              <div className="mt-3 space-y-2">
                {rows.filter((r) => r.status !== 'in_stock').slice(0, 8).map((r) => <div key={r.id} className="rounded-2xl bg-slate-950 p-3 text-sm"><b>{r.name}</b><div className="text-slate-400">موجودی: {r.stock.toLocaleString('fa-IR')}</div></div>)}
                {!rows.some((r) => r.status !== 'in_stock') && <p className="text-sm text-slate-400">فعلاً کالای کم‌موجود ندارید.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <h2 className="font-black">آخرین گردش‌ها</h2>
              <div className="mt-3 max-h-[340px] space-y-2 overflow-auto">
                {transactions.map((tx) => <div key={tx.id} className="rounded-2xl bg-slate-950 p-3 text-xs text-slate-300"><b>{txLabels[tx.type] || tx.type}</b> • {Number(tx.quantity).toLocaleString('fa-IR')} عدد<div className="mt-1 text-slate-500">{tx.note || 'بدون توضیح'}</div></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setSelected(null)}>
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-black">ثبت گردش انبار</h3>
          <p className="mt-1 text-sm text-slate-400">{selected.name}</p>
          <div className="mt-4 space-y-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              {Object.entries(txLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="تعداد" />
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="توضیحات" />
            <button disabled={saving} onClick={handleTx} className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-60">{saving ? 'در حال ذخیره...' : 'ثبت و بروزرسانی موجودی'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function Stat({ label, value, tone = 'sky' }: { label: string; value: string; tone?: 'sky' | 'amber' | 'rose' | 'emerald' }) {
  const cls = tone === 'amber' ? 'text-amber-300' : tone === 'rose' ? 'text-rose-300' : tone === 'emerald' ? 'text-emerald-300' : 'text-sky-300';
  return <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"><div className="text-sm text-slate-400">{label}</div><div className={`mt-2 text-xl font-black ${cls}`}>{value}</div></div>;
}
