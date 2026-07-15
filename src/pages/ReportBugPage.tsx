import React, { useState } from 'react';
import { createBugReport } from '../admin/services/healthApi';

export default function ReportBugPage() {
  const [form, setForm] = useState({ title: '', description: '', area: 'general', severity: 'medium' as any, reporter_phone: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createBugReport({ ...form, page_url: window.location.href });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت گزارش');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-black">گزارش مشکل در سایت Carrtell</h1>
        <p className="mt-2 text-sm text-slate-300">هر مشکلی در سایت دیدی اینجا ثبت کن تا در پنل مدیریت بررسی شود.</p>
        {done ? <div className="mt-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-100">گزارش ثبت شد. ممنون از همکاری شما.</div> : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="عنوان مشکل" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="توضیح مشکل" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                <option value="general">عمومی</option><option value="checkout">خرید و پرداخت</option><option value="profile">پروفایل</option><option value="driver">سرویس‌کار</option><option value="admin">پنل مدیریت</option>
              </select>
              <select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as any })}>
                <option value="low">کم</option><option value="medium">متوسط</option><option value="high">زیاد</option><option value="critical">بحرانی</option>
              </select>
            </div>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="شماره تماس اختیاری" value={form.reporter_phone} onChange={(e) => setForm({ ...form, reporter_phone: e.target.value })} />
            {error && <div className="rounded-2xl bg-red-500/10 p-3 text-red-100">{error}</div>}
            <button className="w-full rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-950">ثبت گزارش مشکل</button>
          </form>
        )}
      </div>
    </div>
  );
}
