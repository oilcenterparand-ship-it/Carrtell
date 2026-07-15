import React, { useEffect, useMemo, useState } from 'react';
import { getSavedHealthChecks, runSystemHealthChecks } from '../services/healthApi';

const statusClass: Record<string, string> = {
  ok: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
  warning: 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30',
  error: 'bg-red-500/10 text-red-200 border-red-500/30',
  unknown: 'bg-slate-500/10 text-slate-200 border-slate-500/30',
};

const statusText: Record<string, string> = {
  ok: 'سالم',
  warning: 'نیاز به بررسی',
  error: 'خطا',
  unknown: 'نامشخص',
};

export default function SystemHealth() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const grouped = useMemo(() => items.reduce((acc: Record<string, any[]>, item) => {
    const key = item.category || 'general';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {}), [items]);

  async function load() {
    try {
      const data = await getSavedHealthChecks();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت وضعیت سلامت');
    }
  }

  async function runChecks() {
    setLoading(true);
    setError('');
    try {
      const data = await runSystemHealthChecks();
      setItems(data.map((x) => ({
        check_key: x.key,
        title: x.title,
        category: x.category,
        status: x.status,
        message: x.message,
        last_checked_at: new Date().toISOString(),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در اجرای تست سلامت');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const errorCount = items.filter((x) => x.status === 'error').length;
  const warningCount = items.filter((x) => x.status === 'warning').length;

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black">مرکز تست سلامت Carrtell</h1>
              <p className="mt-2 text-sm text-slate-300">بررسی جدول‌ها، اتصال‌ها، مسیرها و خطاهای مهم سایت</p>
            </div>
            <button
              onClick={runChecks}
              disabled={loading}
              className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60"
            >
              {loading ? 'در حال تست...' : 'اجرای تست سلامت'}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-100">سالم: {items.filter((x) => x.status === 'ok').length}</div>
            <div className="rounded-2xl bg-yellow-500/10 p-4 text-yellow-100">هشدار: {warningCount}</div>
            <div className="rounded-2xl bg-red-500/10 p-4 text-red-100">خطا: {errorCount}</div>
          </div>
          {error && <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-red-100">{error}</div>}
        </div>

        {Object.entries(grouped).map(([category, rows]) => (
          <section key={category} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-black">{category}</h2>
            <div className="grid gap-3">
              {rows.map((item) => (
                <div key={item.check_key || item.key} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass[item.status || 'unknown']}`}>
                      {statusText[item.status || 'unknown']}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
