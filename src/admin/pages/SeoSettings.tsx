import { useEffect, useState } from 'react';
import { deleteSeoMeta, getSeoMetas, SeoMeta, upsertSeoMeta } from '../services/seoApi';

const emptyForm: SeoMeta = {
  path: '/',
  title: '',
  description: '',
  keywords: '',
  og_title: '',
  og_description: '',
  og_image: '',
  canonical_url: '',
  is_active: true,
};

export default function SeoSettings() {
  const [items, setItems] = useState<SeoMeta[]>([]);
  const [form, setForm] = useState<SeoMeta>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getSeoMetas());
    } catch (error: any) {
      setMessage(error.message || 'خطا در دریافت اطلاعات SEO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await upsertSeoMeta(form);
      setForm(emptyForm);
      setMessage('تنظیمات SEO ذخیره شد.');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'خطا در ذخیره SEO');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id?: string) => {
    if (!id || !confirm('حذف شود؟')) return;
    await deleteSeoMeta(id);
    await load();
  };

  const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400';

  return (
    <div className="space-y-6 p-4 text-white" dir="rtl">
      <div className="rounded-2xl border border-amber-400/20 bg-slate-900/80 p-5 shadow-xl">
        <h1 className="text-2xl font-bold text-amber-300">مدیریت SEO و متاتگ‌ها</h1>
        <p className="mt-2 text-sm text-slate-300">برای هر مسیر سایت عنوان، توضیحات، کلمات کلیدی و تصویر اشتراک‌گذاری تنظیم کن.</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-300">مسیر صفحه</span>
          <input className={inputClass} value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/shop یا /blog/slug" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">عنوان SEO</span>
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-slate-300">توضیحات</span>
          <textarea className={inputClass} rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-slate-300">کلمات کلیدی</span>
          <input className={inputClass} value={form.keywords || ''} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">OG Title</span>
          <input className={inputClass} value={form.og_title || ''} onChange={(e) => setForm({ ...form, og_title: e.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">تصویر OG</span>
          <input className={inputClass} value={form.og_image || ''} onChange={(e) => setForm({ ...form, og_image: e.target.value })} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-slate-300">Canonical URL</span>
          <input className={inputClass} value={form.canonical_url || ''} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} />
        </label>
        <div className="flex items-center gap-3 md:col-span-2">
          <button onClick={save} disabled={loading} className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50">ذخیره</button>
          <button onClick={() => setForm(emptyForm)} className="rounded-xl border border-white/10 px-5 py-3 text-slate-200">فرم جدید</button>
          {message && <span className="text-sm text-amber-200">{message}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
        <h2 className="mb-4 text-lg font-bold">متاتگ‌های ثبت‌شده</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id || item.path} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-amber-200">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.path}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setForm(item)} className="rounded-lg bg-white/10 px-3 py-2 text-sm">ویرایش</button>
                  <button onClick={() => remove(item.id)} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">حذف</button>
                </div>
              </div>
              {item.description && <p className="mt-2 text-sm text-slate-300">{item.description}</p>}
            </div>
          ))}
          {!items.length && !loading && <p className="text-sm text-slate-400">هنوز تنظیم SEO ثبت نشده است.</p>}
        </div>
      </div>
    </div>
  );
}
