import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, RefreshCw, ShieldCheck, Search } from 'lucide-react';
import { AuditLog, exportAuditLogsCsv, getAuditLogs } from '../services/auditApi';

type FilterState = {
  search: string;
  action: string;
  entityType: string;
  actorRole: string;
};

const actionLabels: Record<string, string> = {
  create: 'ایجاد',
  update: 'ویرایش',
  delete: 'حذف',
  status_change: 'تغییر وضعیت',
  login: 'ورود',
  logout: 'خروج',
  export: 'خروجی گرفتن',
  manual: 'ثبت دستی',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({ search: '', action: '', entityType: '', actorRole: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAuditLogs({
        search: filters.search || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        actorRole: filters.actorRole || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت گزارش فعالیت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: logs.length,
      today: logs.filter((log) => new Date(log.created_at).toDateString() === today).length,
      deletes: logs.filter((log) => log.action === 'delete').length,
      updates: logs.filter((log) => log.action === 'update' || log.action === 'status_change').length,
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-bold">امنیت و کنترل داخلی</span>
              </div>
              <h1 className="text-2xl font-black text-white">گزارش فعالیت کاربران و کارکنان</h1>
              <p className="mt-2 text-sm text-slate-400">ردیابی تغییرات مهم پنل مدیریت، سفارش‌ها، انبار، مالی و کاربران.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold hover:bg-slate-700">
                <RefreshCw className="h-4 w-4" /> بروزرسانی
              </button>
              <button onClick={() => exportAuditLogsCsv(logs)} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-300">
                <Download className="h-4 w-4" /> خروجی CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="کل رویدادها" value={stats.total} />
          <Stat title="امروز" value={stats.today} />
          <Stat title="ویرایش/وضعیت" value={stats.updates} />
          <Stat title="حذف‌ها" value={stats.deletes} danger />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="mb-4 flex items-center gap-2 text-slate-300">
            <Filter className="h-4 w-4" /> فیلتر گزارش‌ها
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="جستجو در توضیحات/کاربر"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pr-9 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <select value={filters.action} onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
              <option value="">همه عملیات‌ها</option>
              <option value="create">ایجاد</option>
              <option value="update">ویرایش</option>
              <option value="delete">حذف</option>
              <option value="status_change">تغییر وضعیت</option>
              <option value="export">خروجی</option>
            </select>
            <select value={filters.entityType} onChange={(e) => setFilters((p) => ({ ...p, entityType: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
              <option value="">همه بخش‌ها</option>
              <option value="products">محصولات</option>
              <option value="orders">سفارش‌ها</option>
              <option value="inventory">انبار</option>
              <option value="finance">مالی</option>
              <option value="customers">مشتری‌ها</option>
              <option value="service_requests">سرویس در محل</option>
            </select>
            <button onClick={load} className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-white">اعمال فیلتر</button>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-red-200">{error}</div>}

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3">زمان</th>
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3">عملیات</th>
                  <th className="px-4 py-3">بخش</th>
                  <th className="px-4 py-3">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">در حال دریافت...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">گزارشی ثبت نشده است.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">{new Date(log.created_at).toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{log.actor_name || 'سیستم'}</div>
                        <div className="text-xs text-slate-500">{log.actor_role || '-'}</div>
                      </td>
                      <td className="px-4 py-3"><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">{actionLabels[log.action] || log.action}</span></td>
                      <td className="px-4 py-3 text-slate-300">{log.entity_type || '-'}</td>
                      <td className="max-w-xl px-4 py-3 text-slate-300">{log.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, danger }: { title: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${danger ? 'border-red-500/30 bg-red-950/20' : 'border-slate-800 bg-slate-900/80'}`}>
      <div className="text-sm text-slate-400">{title}</div>
      <div className={`mt-2 text-3xl font-black ${danger ? 'text-red-300' : 'text-white'}`}>{value.toLocaleString('fa-IR')}</div>
    </div>
  );
}
