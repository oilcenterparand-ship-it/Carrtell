import React, { useEffect, useState } from 'react';
import { deleteSupplier, getSuppliers, saveSupplier, type Supplier } from '../services/purchasesApi';

const emptyForm: Partial<Supplier> = { name: '', contact_name: '', phone: '', address: '', notes: '', is_active: true };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<Partial<Supplier>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try { setSuppliers(await getSuppliers()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveSupplier(form);
      setForm(emptyForm);
      setMessage('تأمین‌کننده ذخیره شد.');
      await load();
    } catch (err: any) {
      setMessage(err.message || 'خطا در ذخیره تأمین‌کننده');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 p-4 text-slate-100" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl">
        <h1 className="text-2xl font-black text-white">مدیریت تأمین‌کنندگان</h1>
        <p className="mt-2 text-sm text-slate-400">پخش‌کننده‌ها، شرکت‌ها و رابط‌های خرید Carrtell را اینجا ثبت کن.</p>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2">
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="نام تأمین‌کننده" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="نام رابط فروش" value={form.contact_name || ''} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="شماره تماس" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="آدرس" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <textarea className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 md:col-span-2" placeholder="توضیحات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> فعال</label>
        <button disabled={loading} className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{form.id ? 'ویرایش تأمین‌کننده' : 'افزودن تأمین‌کننده'}</button>
        {message && <p className="md:col-span-2 text-sm text-yellow-300">{message}</p>}
      </form>

      <div className="grid gap-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-white">{supplier.name}</h2>
                <p className="text-sm text-slate-400">{supplier.contact_name || 'بدون رابط'} · {supplier.phone || 'بدون شماره'}</p>
                {supplier.address && <p className="mt-1 text-xs text-slate-500">{supplier.address}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm(supplier)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white">ویرایش</button>
                <button onClick={() => deleteSupplier(supplier.id).then(load)} className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
