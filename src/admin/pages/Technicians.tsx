import { useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Save, UserRoundCheck, X } from 'lucide-react';
import { listServiceTechnicians, saveServiceTechnician, setServiceTechnicianActive, type ServiceTechnician, type ServiceTechnicianInput } from '../services/technicianAdminApi';

const empty: ServiceTechnicianInput = { username: '', password: '', full_name: '', phone: '', is_active: true, service_area: '', notes: '' };

export default function Technicians() {
  const [items, setItems] = useState<ServiceTechnician[]>([]);
  const [form, setForm] = useState<ServiceTechnicianInput>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setBusy(true); setError('');
    try { setItems(await listServiceTechnicians()); }
    catch (e) { setError(e instanceof Error ? e.message : 'خطا در دریافت سرویس‌کارها'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);

  function edit(item: ServiceTechnician) {
    setForm({ id: item.id, username: item.username, password: '', full_name: item.full_name, phone: item.phone || '', is_active: item.is_active, service_area: item.service_area || '', notes: item.notes || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    setError(''); setMessage('');
    if (!form.full_name.trim()) return setError('نام سرویس‌کار را وارد کن.');
    if (!/^[a-z0-9_.-]{3,40}$/i.test(form.username.trim())) return setError('نام کاربری حداقل ۳ کاراکتر انگلیسی باشد.');
    if (!form.id && (!form.password || form.password.length < 8)) return setError('برای سرویس‌کار جدید رمز حداقل ۸ کاراکتری وارد کن.');
    if (form.password && form.password.length < 8) return setError('رمز جدید حداقل ۸ کاراکتر باشد.');
    setBusy(true);
    try {
      await saveServiceTechnician({ ...form, username: form.username.trim().toLowerCase(), password: form.password || undefined });
      setForm(empty); setMessage(form.id ? 'سرویس‌کار ویرایش شد.' : 'سرویس‌کار ساخته شد و آماده تخصیص مأموریت است.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'ذخیره انجام نشد.'); }
    finally { setBusy(false); }
  }

  async function toggle(item: ServiceTechnician) {
    setBusy(true); setError('');
    try { await setServiceTechnicianActive(item.id, !item.is_active); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'تغییر وضعیت انجام نشد.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5 text-white" dir="rtl">
    <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-l from-amber-500/15 via-slate-900 to-slate-950 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-black">سرویس‌کارها</h1><p className="mt-2 text-sm text-slate-300">هر سرویس‌کار یک حساب ورود مستقل دارد و همین افراد در لیست تخصیص سفارش نمایش داده می‌شوند.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3"><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> بروزرسانی</button></div>
    </section>
    {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">{message}</div>}
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">{form.id ? 'ویرایش سرویس‌کار' : 'سرویس‌کار جدید'}</h2>{form.id && <button onClick={() => setForm(empty)} className="rounded-lg p-2"><X className="h-4 w-4" /></button>}</div><div className="space-y-3">
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="نام و نام خانوادگی" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="موبایل" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input dir="ltr" className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-left" placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input dir="ltr" type="password" className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-left" placeholder={form.id ? 'رمز جدید (اگر نمی‌خواهی تغییر کند خالی بگذار)' : 'رمز ورود (حداقل ۸ کاراکتر)'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="محدوده سرویس‌دهی" value={form.service_area || ''} onChange={e => setForm({ ...form, service_area: e.target.value })} />
        <textarea className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="توضیحات" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button onClick={() => void save()} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 p-3 font-black text-slate-950 disabled:opacity-50"><Save className="h-5 w-5" /> ذخیره سرویس‌کار</button>
      </div></section>
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">لیست سرویس‌کارها</h2><button onClick={() => setForm(empty)} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> افزودن</button></div><div className="space-y-3">{items.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5 text-amber-300" /><strong>{item.full_name}</strong><span className={`rounded-full px-2 py-1 text-xs ${item.is_active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>{item.is_active ? 'فعال' : 'غیرفعال'}</span></div><div className="mt-2 text-sm text-slate-400">{item.username} {item.phone ? `· ${item.phone}` : ''}</div></div><div className="flex gap-2"><button onClick={() => edit(item)} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm"><Pencil className="h-4 w-4" /> ویرایش</button><button onClick={() => void toggle(item)} className="rounded-xl border border-white/10 px-3 py-2 text-sm">{item.is_active ? 'غیرفعال' : 'فعال'}</button></div></div></article>)}{!items.length && !busy && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">هنوز سرویس‌کاری تعریف نشده است.</div>}</div></section>
    </div>
  </div>;
}
