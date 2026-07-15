import { useEffect, useState } from 'react';
import { createReturnRequest, getMyReturnRequests, ReturnRequest } from '../../services/authenticityReturnsApi';

const statusLabel: Record<string, string> = {
  pending: 'در انتظار بررسی',
  reviewing: 'در حال بررسی',
  approved: 'تایید شده',
  rejected: 'رد شده',
  refunded: 'مبلغ برگشت داده شد',
  replaced: 'تعویض شد',
  closed: 'بسته شده',
};

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product_name: '', customer_phone: '', reason: 'مغایرت کالا', description: '' });
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      setItems(await getMyReturnRequests());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    await createReturnRequest(form);
    setForm({ product_name: '', customer_phone: '', reason: 'مغایرت کالا', description: '' });
    setMessage('درخواست شما ثبت شد و توسط پشتیبانی بررسی می‌شود.');
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="text-sm text-amber-300">مرجوعی و بررسی کالا</p>
          <h1 className="mt-2 text-2xl font-black">درخواست مرجوعی / مغایرت کالا</h1>
          <p className="mt-2 text-sm text-slate-300">این بخش فقط برای مرجوعی، مغایرت، مشکل محصول و بررسی اصالت است؛ وارانتی در این نسخه اضافه نشده.</p>
        </section>

        <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>نام محصول</span>
            <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" required />
          </label>
          <label className="space-y-2 text-sm">
            <span>شماره تماس</span>
            <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" required />
          </label>
          <label className="space-y-2 text-sm">
            <span>موضوع</span>
            <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400">
              <option>مغایرت کالا</option>
              <option>مشکل محصول</option>
              <option>آسیب در ارسال</option>
              <option>بررسی اصالت</option>
              <option>سایر</option>
            </select>
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span>توضیحات</span>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" />
          </label>
          <button className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">ثبت درخواست</button>
          {message && <p className="self-center text-sm text-emerald-300">{message}</p>}
        </form>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">درخواست‌های من</h2>
          {loading ? <p className="mt-4 text-slate-400">در حال دریافت...</p> : (
            <div className="mt-4 grid gap-3">
              {items.length === 0 && <p className="text-slate-400">هنوز درخواستی ثبت نشده.</p>}
              {items.map(item => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b>{item.product_name || 'محصول'}</b>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{statusLabel[item.status] || item.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
                  {item.admin_note && <p className="mt-2 text-sm text-emerald-300">پاسخ مدیر: {item.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
