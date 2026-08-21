import { useEffect, useMemo, useState } from 'react';
import { CarFront, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { deleteServiceFleetVehicle, getServiceFleet, saveServiceFleetVehicle, type ServiceFleetInput, type ServiceFleetVehicle } from '../services/serviceFleetApi';
import { listServiceTechnicians, type ServiceTechnician } from '../services/technicianAdminApi';

const empty: ServiceFleetInput = { title: '', plate_number: '', driver_id: '', driver_name: '', driver_phone: '', service_area: '', status: 'active', operational_status: 'available', notes: '' };

export default function ServiceFleet() {
  const [items, setItems] = useState<ServiceFleetVehicle[]>([]);
  const [technicians, setTechnicians] = useState<ServiceTechnician[]>([]);
  const [form, setForm] = useState<ServiceFleetInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setBusy(true); setError('');
    try {
      const [fleet, techs] = await Promise.all([getServiceFleet(), listServiceTechnicians(true)]);
      setItems(fleet); setTechnicians(techs);
    } catch (e) { setError(e instanceof Error ? e.message : 'خطا در دریافت ناوگان'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => [item.title, item.plate_number, item.driver_name, item.driver_phone].some(v => String(v || '').toLowerCase().includes(q)));
  }, [items, query]);

  function chooseTechnician(id: string) {
    const tech = technicians.find(item => item.id === id);
    setForm(current => ({ ...current, driver_id: id, driver_name: tech?.full_name || '', driver_phone: tech?.phone || '' }));
  }

  function edit(item: ServiceFleetVehicle) {
    setEditingId(item.id);
    setForm({ title: item.title, plate_number: item.plate_number || '', driver_id: item.driver_id || '', driver_name: item.driver_name || '', driver_phone: item.driver_phone || '', service_area: item.service_area || '', status: item.status, operational_status: item.operational_status || 'available', notes: item.notes || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    setError(''); setMessage('');
    if (!form.title.trim()) return setError('عنوان خودرو را وارد کن.');
    setBusy(true);
    try { await saveServiceFleetVehicle(form, editingId || undefined); setEditingId(null); setForm(empty); setMessage('خودروی سرویس ذخیره شد.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'ذخیره خودرو انجام نشد.'); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm('این خودروی سرویس حذف شود؟')) return;
    setBusy(true);
    try { await deleteServiceFleetVehicle(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'حذف خودرو انجام نشد.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5 text-white" dir="rtl">
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-l from-cyan-500/10 via-slate-900 to-slate-950 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-black">خودروهای سرویس</h1><p className="mt-2 text-sm text-slate-300">خودرو را یک‌بار تعریف کن؛ هنگام تخصیص سفارش همین لیست نمایش داده می‌شود. انتخاب خودرو برای اعزام اختیاری است.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3"><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> بروزرسانی</button></div></section>
    {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>}{message && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">{message}</div>}
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">{editingId ? 'ویرایش خودرو' : 'خودروی جدید'}</h2>{editingId && <button onClick={() => { setEditingId(null); setForm(empty); }}><X className="h-4 w-4" /></button>}</div><div className="space-y-3">
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="عنوان خودرو؛ مثلا وانت کارتل ۱" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="پلاک" value={form.plate_number || ''} onChange={e => setForm({ ...form, plate_number: e.target.value })} />
        <select className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" value={form.driver_id || ''} onChange={e => chooseTechnician(e.target.value)}><option value="">بدون سرویس‌کار پیش‌فرض</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}{t.phone ? ` - ${t.phone}` : ''}</option>)}</select>
        <input className="w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="محدوده سرویس‌دهی" value={form.service_area || ''} onChange={e => setForm({ ...form, service_area: e.target.value })} />
        <textarea className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="توضیحات" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button onClick={() => void save()} disabled={busy} className="w-full rounded-xl bg-cyan-300 p-3 font-black text-slate-950 disabled:opacity-50">ذخیره خودرو</button>
        {!technicians.length && <a href="/admin/technicians" className="block rounded-xl border border-amber-400/30 p-3 text-center text-sm font-bold text-amber-200">اول سرویس‌کار تعریف کن</a>}
      </div></section>
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-black">لیست خودروها</h2><div className="flex gap-2"><input className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2" placeholder="جستجو" value={query} onChange={e => setQuery(e.target.value)} /><button onClick={() => { setEditingId(null); setForm(empty); }} className="inline-flex items-center gap-1 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> افزودن</button></div></div><div className="grid gap-3 md:grid-cols-2">{filtered.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><CarFront className="h-6 w-6 text-cyan-300" /><div><strong>{item.title}</strong><div className="mt-1 text-sm text-slate-400">{item.plate_number || 'بدون پلاک'}</div><div className="mt-1 text-xs text-slate-500">{item.driver_name || 'بدون سرویس‌کار پیش‌فرض'}</div></div></div><div className="flex gap-1"><button onClick={() => edit(item)} className="rounded-lg bg-white/10 p-2"><Pencil className="h-4 w-4" /></button><button onClick={() => void remove(item.id)} className="rounded-lg bg-red-500/10 p-2 text-red-300"><Trash2 className="h-4 w-4" /></button></div></div></article>)}{!filtered.length && !busy && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400 md:col-span-2">هنوز خودروی سرویس ثبت نشده است.</div>}</div></section>
    </div>
  </div>;
}
