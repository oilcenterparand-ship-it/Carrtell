import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Package, RefreshCw, ShoppingCart, Star, TrendingUp, Users } from 'lucide-react';
import { getAdminKpiSummary, getOperationalAlerts, getSalesChart } from '../services/dashboardApi';

const money = (value: number) => new Intl.NumberFormat('fa-IR').format(Math.round(value || 0)) + ' تومان';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [chart, setChart] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [summaryData, chartData, alertsData] = await Promise.all([
      getAdminKpiSummary(),
      getSalesChart(14),
      getOperationalAlerts(),
    ]);
    setSummary(summaryData);
    setChart(chartData);
    setAlerts(alertsData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const maxSales = useMemo(() => Math.max(...chart.map((x) => x.sales), 1), [chart]);

  return (
    <div className="ct-admin-dashboard space-y-6 p-4 text-white md:p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">داشبورد مدیریت Carrtell</h1>
          <p className="text-slate-400 mt-2">نمای کلی فروش، سفارش‌ها، مشتری‌ها و هشدارهای عملیاتی</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 text-slate-950 px-5 py-3 font-bold hover:bg-yellow-300">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<TrendingUp />} title="فروش امروز" value={money(summary?.todaySales ?? 0)} />
        <KpiCard icon={<BarChart3 />} title="فروش ماه" value={money(summary?.monthSales ?? 0)} />
        <KpiCard icon={<ShoppingCart />} title="سفارش‌های پرداخت‌شده ماه" value={summary?.paidOrders ?? 0} />
        <KpiCard icon={<Users />} title="مشتری جدید ماه" value={summary?.newCustomers ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black">نمودار فروش ۱۴ روز اخیر</h2>
            <span className="text-xs text-slate-400">براساس سفارش‌های پرداخت‌شده</span>
          </div>
          <div className="h-72 flex items-end gap-2 border-t border-slate-800 pt-6">
            {chart.map((item) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-yellow-400/80 min-h-[8px]" style={{ height: `${Math.max(8, (item.sales / maxSales) * 220)}px` }} title={money(item.sales)} />
                <span className="text-[10px] text-slate-500 -rotate-45 origin-top whitespace-nowrap">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-800 bg-rose-950/70 p-5 text-white shadow-xl">
          <h2 className="text-xl font-black flex items-center gap-2"><AlertTriangle className="text-rose-300" /> هشدارها</h2>
          <div className="mt-5 space-y-3">
            <AlertRow label="سفارش‌های معطل" value={summary?.pendingOrders ?? 0} />
            <AlertRow label="پرداخت‌های ناموفق/در انتظار" value={summary?.unpaidOrders ?? 0} />
            <AlertRow label="محصولات کم‌موجود" value={summary?.lowStockProducts ?? 0} />
            <AlertRow label="نظرات تایید نشده" value={summary?.unapprovedReviews ?? 0} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertList title="محصولات کم‌موجود" icon={<Package />} items={alerts?.products ?? []} render={(p:any) => `${p.name ?? 'محصول'} - موجودی: ${p.stock ?? 0}`} />
        <AlertList title="نظرات در انتظار تایید" icon={<Star />} items={alerts?.reviews ?? []} render={(r:any) => `${r.customer_name ?? 'مشتری'} - امتیاز ${r.rating ?? '-'}`} />
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value }: any) {
  return <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
    <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 text-yellow-300 flex items-center justify-center mb-4">{icon}</div>
    <p className="text-slate-400 text-sm">{title}</p>
    <p className="text-2xl font-black mt-2">{value}</p>
  </div>;
}

function AlertRow({ label, value }: any) {
  return <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 border border-slate-800 px-4 py-3">
    <span className="text-slate-300">{label}</span><b className="text-yellow-300">{value}</b>
  </div>;
}

function AlertList({ title, icon, items, render }: any) {
  return <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
    <h2 className="text-lg font-black flex items-center gap-2 text-white">{icon}{title}</h2>
    <div className="mt-4 space-y-2 max-h-72 overflow-auto">
      {items.length === 0 ? <p className="text-slate-500 text-sm">موردی برای نمایش وجود ندارد.</p> : items.slice(0, 8).map((item:any, i:number) => (
        <div key={item.id ?? i} className="rounded-2xl bg-slate-950/50 border border-slate-800 px-4 py-3 text-sm text-slate-300">{render(item)}</div>
      ))}
    </div>
  </div>;
}
