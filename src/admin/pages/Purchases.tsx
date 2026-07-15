import React, { useEffect, useMemo, useState } from 'react';
import { createPurchaseOrder, getPurchaseOrders, getPurchaseStats, getSuppliers, type Supplier } from '../services/purchasesApi';
import { supabase } from '../../lib/supabase';

type Product = { id: string; name: string; stock?: number; price?: number; avg_purchase_price?: number };

type Item = { product_id: string; quantity: number; unit_cost: number };

const money = (value: number) => new Intl.NumberFormat('fa-IR').format(value || 0) + ' تومان';

export default function Purchases() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [supplierId, setSupplierId] = useState('');
  const [invoice, setInvoice] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Item[]>([{ product_id: '', quantity: 1, unit_cost: 0 }]);
  const [message, setMessage] = useState('');

  const load = async () => {
    setSuppliers(await getSuppliers());
    setOrders(await getPurchaseOrders());
    setStats(await getPurchaseStats());
    const { data } = await supabase.from('products').select('id, name, stock, price, avg_purchase_price').order('name');
    setProducts(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => Math.max(items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0) - Number(discount || 0), 0), [items, discount]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPurchaseOrder({ supplier_id: supplierId || null, invoice_number: invoice, discount_amount: discount, items });
      setMessage('خرید ثبت شد و موجودی افزایش پیدا کرد.');
      setItems([{ product_id: '', quantity: 1, unit_cost: 0 }]);
      setInvoice('');
      setDiscount(0);
      await load();
    } catch (err: any) {
      setMessage(err.message || 'خطا در ثبت خرید');
    }
  };

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  return (
    <div className="space-y-6 p-4 text-slate-100" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl">
        <h1 className="text-2xl font-black text-white">ثبت خرید و مدیریت سود</h1>
        <p className="mt-2 text-sm text-slate-400">با ثبت خرید، موجودی محصول افزایش پیدا می‌کند و قیمت خرید میانگین برای گزارش سود ذخیره می‌شود.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">ارزش تقریبی موجودی</p><b className="text-xl text-yellow-300">{money(stats?.inventoryValue || 0)}</b></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">سود ناخالص بالقوه</p><b className="text-xl text-emerald-300">{money(stats?.potentialGrossProfit || 0)}</b></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">جمع خرید جاری</p><b className="text-xl text-white">{money(total)}</b></div>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">انتخاب تأمین‌کننده</option>
            {suppliers.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="شماره فاکتور" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" type="number" placeholder="تخفیف کل" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 md:grid-cols-4">
            <select className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white md:col-span-2" value={item.product_id} onChange={(e) => updateItem(index, { product_id: e.target.value })}>
              <option value="">انتخاب محصول</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} · موجودی {p.stock ?? 0}</option>)}
            </select>
            <input className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} placeholder="تعداد" />
            <input className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" type="number" value={item.unit_cost} onChange={(e) => updateItem(index, { unit_cost: Number(e.target.value) })} placeholder="قیمت خرید واحد" />
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1, unit_cost: 0 }])} className="rounded-2xl bg-white/10 px-5 py-3 font-bold text-white">افزودن ردیف کالا</button>
          <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950">ثبت خرید و افزایش موجودی</button>
        </div>
        {message && <p className="text-sm text-yellow-300">{message}</p>}
      </form>

      <div className="space-y-3">
        <h2 className="text-xl font-black">آخرین خریدها</h2>
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <b className="text-white">{order.suppliers?.name || 'بدون تأمین‌کننده'}</b>
                <p className="text-sm text-slate-400">فاکتور: {order.invoice_number || '—'} · {order.purchase_date}</p>
              </div>
              <b className="text-yellow-300">{money(order.total_amount || 0)}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
