import { useEffect, useState } from 'react';
import { createAuthenticityCode, getAuthenticityCodes, updateAuthenticityCodeStatus, AuthenticityCode } from '../../services/authenticityReturnsApi';

export default function AdminAuthenticity() {
  const [items, setItems] = useState<AuthenticityCode[]>([]);
  const [form, setForm] = useState({ code: '', product_name: '', status: 'valid' as AuthenticityCode['status'] });

  async function load() { setItems(await getAuthenticityCodes()); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await createAuthenticityCode(form);
    setForm({ code: '', product_name: '', status: 'valid' });
    await load();
  }

  return (
    <main className="space-y-6 p-4 text-white" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-amber-300">پنل مدیریت</p>
        <h1 className="mt-2 text-2xl font-black">کدهای اصالت کالا</h1>
        <p className="mt-2 text-sm text-slate-300">ساخت و مدیریت کد رهگیری Carrtell برای محصولات و فاکتورها.</p>
      </section>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-5 md:grid-cols-4">
        <input placeholder="کد دلخواه یا خالی" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
        <input placeholder="نام محصول" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as AuthenticityCode['status'] })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"><option value="valid">معتبر</option><option value="needs_review">نیازمند بررسی</option><option value="blocked">مسدود</option></select>
        <button className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">ساخت کد</button>
      </form>
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="text-slate-400"><tr><th className="p-3">کد</th><th className="p-3">محصول</th><th className="p-3">وضعیت</th><th className="p-3">تعداد بررسی</th><th className="p-3">عملیات</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id} className="border-t border-white/10"><td className="p-3 font-mono">{item.code}</td><td className="p-3">{item.product_name || '-'}</td><td className="p-3">{item.status}</td><td className="p-3">{item.checked_count ?? 0}</td><td className="p-3"><select defaultValue="" onChange={e => updateAuthenticityCodeStatus(item.id, e.target.value as AuthenticityCode['status']).then(load)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="" disabled>تغییر</option><option value="valid">معتبر</option><option value="needs_review">بررسی</option><option value="blocked">مسدود</option><option value="used">استفاده شده</option></select></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
