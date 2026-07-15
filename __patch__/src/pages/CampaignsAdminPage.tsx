import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Campaign, deleteCampaign, getCampaigns, saveCampaign } from '../admin/services/campaignsApi';

const emptyCampaign: Campaign = {
  title: '',
  subtitle: '',
  slug: '',
  desktop_banner_url: '',
  mobile_banner_url: '',
  link_url: '',
  starts_at: '',
  ends_at: '',
  status: 'active',
  priority: 10,
  show_on_home: true,
};

function toInputDateTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function CampaignsAdminPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [form, setForm] = useState<Campaign>(emptyCampaign);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCampaigns();
      setItems(data);
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت کمپین‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => [c.title, c.subtitle, c.slug, c.status].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [items, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError('عنوان کمپین الزامی است.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveCampaign({
        ...form,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      setMessage('کمپین ذخیره شد.');
      setForm(emptyCampaign);
      await load();
    } catch (err: any) {
      setError(err?.message || 'خطا در ذخیره کمپین');
    } finally {
      setSaving(false);
    }
  };

  const edit = (campaign: Campaign) => {
    setForm({
      ...campaign,
      starts_at: toInputDateTime(campaign.starts_at),
      ends_at: toInputDateTime(campaign.ends_at),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm('کمپین حذف شود؟')) return;
    try {
      await deleteCampaign(id);
      await load();
    } catch (err: any) {
      setError(err?.message || 'خطا در حذف کمپین');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">بازاریابی و فروش ویژه</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">مدیریت کمپین‌های فروش</h1>
              <p className="mt-2 text-sm text-slate-300">کمپین‌های صفحه اصلی، بنرهای فروش ویژه و تایمر جشنواره‌ها را مدیریت کن.</p>
            </div>
            <Link to="/admin/quick-links" className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15">بازگشت به مرکز مسیرها</Link>
          </div>
        </div>

        {(error || message) && (
          <div className={`rounded-2xl border p-4 text-sm ${error ? 'border-rose-400/40 bg-rose-950/40 text-rose-100' : 'border-emerald-400/40 bg-emerald-950/40 text-emerald-100'}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-5">
            <h2 className="text-xl font-black">{form.id ? 'ویرایش کمپین' : 'کمپین جدید'}</h2>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="عنوان کمپین" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="زیرعنوان" value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="slug مثل summer-oil" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="لینک بنر / مسیر مقصد" value={form.link_url || ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="آدرس بنر دسکتاپ" value={form.desktop_banner_url || ''} onChange={(e) => setForm({ ...form, desktop_banner_url: e.target.value })} />
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="آدرس بنر موبایل" value={form.mobile_banner_url || ''} onChange={(e) => setForm({ ...form, mobile_banner_url: e.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">شروع<input type="datetime-local" className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white" value={form.starts_at || ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
              <label className="space-y-2 text-sm text-slate-300">پایان<input type="datetime-local" className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white" value={form.ends_at || ''} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                <option value="active">فعال</option><option value="draft">پیش‌نویس</option><option value="paused">متوقف</option><option value="expired">پایان‌یافته</option>
              </select>
              <input type="number" className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white" placeholder="اولویت" value={form.priority || 10} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800 p-3 text-sm">
              <input type="checkbox" checked={!!form.show_on_home} onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })} /> نمایش در صفحه اصلی
            </label>
            <div className="flex gap-3">
              <button disabled={saving} className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">{saving ? 'در حال ذخیره...' : 'ذخیره کمپین'}</button>
              {form.id && <button type="button" onClick={() => setForm(emptyCampaign)} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">لغو</button>}
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-black">لیست کمپین‌ها</h2>
              <input className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400" placeholder="جستجوی کمپین..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {loading ? <p className="text-slate-300">در حال دریافت...</p> : (
              <div className="space-y-3">
                {filtered.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-black">{c.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{c.subtitle || 'بدون زیرعنوان'}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full bg-white/10 px-3 py-1">{c.status}</span>
                          <span className="rounded-full bg-white/10 px-3 py-1">اولویت {c.priority}</span>
                          {c.show_on_home && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">صفحه اصلی</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => edit(c)} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold">ویرایش</button>
                        <button onClick={() => remove(c.id)} className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-bold">حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
                {!filtered.length && <p className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-400">کمپینی پیدا نشد.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
