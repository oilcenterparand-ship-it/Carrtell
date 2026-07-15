import React, { useEffect, useMemo, useState } from 'react';
import { getSmsLogs, markSmsLogSent, retrySmsLog, SmsLog } from '../services/smsApi';

const inputClass = 'rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400/20';

const statusLabel: Record<string, string> = {
  pending: 'در انتظار ارسال',
  sent: 'ارسال‌شده',
  failed: 'ناموفق',
  disabled: 'غیرفعال',
  manual: 'دستی/تست',
};

export default function SmsLogs() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState('all');

  async function load() {
    setLoading(true);
    try {
      setLogs(await getSmsLogs({ status, phone, template_key: template }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, template]);

  const templates = useMemo(() => Array.from(new Set(logs.map((log) => log.template_key).filter(Boolean))) as string[], [logs]);

  async function copy(text: string) {
    await navigator.clipboard?.writeText(text);
  }

  async function handleRetry(log: SmsLog) {
    await retrySmsLog(log);
    await load();
  }

  async function handleMarkSent(log: SmsLog) {
    await markSmsLogSent(log.id);
    await load();
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black md:text-3xl">لاگ پیامک‌ها</h1>
            <p className="mt-2 text-sm text-slate-300">پیامک‌های سفارش، سرویس و نظرسنجی اینجا ثبت می‌شوند.</p>
          </div>
          <button onClick={load} className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-950">بروزرسانی</button>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-4">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="جستجوی شماره" />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select className={inputClass} value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="all">همه قالب‌ها</option>
            {templates.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button onClick={load} className="rounded-2xl border border-white/10 bg-slate-800 px-5 py-3 font-bold text-white">اعمال فیلتر</button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
          {loading ? (
            <div className="p-6 text-slate-300">در حال بارگذاری...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-slate-300">لاگی پیدا نشد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="p-4">شماره</th>
                    <th className="p-4">پیام</th>
                    <th className="p-4">قالب</th>
                    <th className="p-4">وضعیت</th>
                    <th className="p-4">تاریخ</th>
                    <th className="p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-white/10 align-top">
                      <td className="p-4 font-bold text-yellow-200">{log.phone}</td>
                      <td className="max-w-xl p-4 text-slate-200">{log.message}</td>
                      <td className="p-4 text-slate-300">{log.template_key ?? '-'}</td>
                      <td className="p-4"><span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{statusLabel[log.status] ?? log.status}</span></td>
                      <td className="p-4 text-slate-400">{new Date(log.created_at).toLocaleString('fa-IR')}</td>
                      <td className="space-y-2 p-4">
                        <button onClick={() => copy(log.message)} className="ml-2 rounded-xl bg-slate-800 px-3 py-2 text-xs">کپی متن</button>
                        <button onClick={() => handleRetry(log)} className="ml-2 rounded-xl bg-yellow-400 px-3 py-2 text-xs font-black text-slate-950">ارسال مجدد</button>
                        {log.status !== 'sent' && <button onClick={() => handleMarkSent(log)} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white">ارسال شد</button>}
                        {log.error_message && <p className="mt-2 text-xs text-red-300">{log.error_message}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
