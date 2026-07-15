import React, { useEffect, useState } from 'react';
import { getBugReports, updateBugReportStatus } from '../services/healthApi';

export default function BugReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setReports(await getBugReports()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: any) {
    await updateBugReportStatus(id, status);
    await load();
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h1 className="text-2xl font-black">گزارش باگ‌ها و مشکلات کاربران</h1>
          <p className="mt-2 text-sm text-slate-300">مشکلات ثبت‌شده از سمت مشتری، سرویس‌کار و مدیر</p>
        </div>
        {loading ? <div>در حال بارگذاری...</div> : reports.length === 0 ? <div className="rounded-2xl bg-white/5 p-5">گزارشی ثبت نشده است.</div> : (
          <div className="grid gap-4">
            {reports.map((r) => (
              <div key={r.id} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-black">{r.title}</h2>
                    <p className="mt-2 text-sm text-slate-300">{r.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>بخش: {r.area}</span>
                      <span>نقش: {r.role}</span>
                      <span>شدت: {r.severity}</span>
                      <span>صفحه: {r.page_url}</span>
                    </div>
                  </div>
                  <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    <option value="open">باز</option>
                    <option value="reviewing">در حال بررسی</option>
                    <option value="fixed">رفع شده</option>
                    <option value="closed">بسته شده</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
