import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  CarFront,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  ShoppingCart,
  Star,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { getAdminKpiSummary, getOperationalAlerts, getSalesChart } from '../services/dashboardApi';

const money = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value || 0))} تومان`;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [chart, setChart] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryData, chartData, alertsData] = await Promise.all([getAdminKpiSummary(), getSalesChart(14), getOperationalAlerts()]);
      setSummary(summaryData); setChart(chartData); setAlerts(alertsData);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const maxSales = useMemo(() => Math.max(...chart.map((x) => Number(x.sales || 0)), 1), [chart]);
  const attentionCount = Number(summary?.pendingOrders || 0) + Number(summary?.unpaidOrders || 0) + Number(summary?.lowStockProducts || 0) + Number(summary?.unapprovedReviews || 0);

  return <div className="space-y-5" dir="rtl">
    <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/30 p-5 shadow-2xl shadow-black/20 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> مرکز کار روزانه</div>
          <h1 className="text-2xl font-black text-white md:text-3xl">امروز در Carrtell چه کاری داری؟</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">سفارش‌های نیازمند اقدام، سرویس‌های در انتظار تخصیص و هشدارها را از همین صفحه ببین. برای کار روزانه لازم نیست بین منوهای مختلف بگردی.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/dispatch" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20"><Wrench className="h-4 w-4" /> عملیات سرویس</Link>
          <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-sm font-black text-white"><ShoppingCart className="h-4 w-4" /> سفارش‌ها</Link>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-300"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی</button>
        </div>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi icon={<TrendingUp />} title="فروش امروز" value={money(summary?.todaySales ?? 0)} />
      <Kpi icon={<BarChart3 />} title="فروش ماه" value={money(summary?.monthSales ?? 0)} />
      <Kpi icon={<ShoppingCart />} title="سفارش پرداخت‌شده" value={summary?.paidOrders ?? 0} />
      <Kpi icon={<Users />} title="مشتری جدید" value={summary?.newCustomers ?? 0} />
      <Kpi icon={<AlertTriangle />} title="نیازمند توجه" value={attentionCount} warning />
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-white">اقدام‌های اصلی</h2><p className="mt-1 text-xs text-slate-500">چهار کاری که بیشترین استفاده روزانه را دارند</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard to="/admin/dispatch" icon={<CarFront />} title="بررسی و تخصیص سرویس" desc="سفارش پرداخت‌شده → سرویس‌کار → خودرو → اعزام" primary />
          <ActionCard to="/admin/orders" icon={<ShoppingCart />} title="بررسی سفارش‌ها" desc="پرداخت، اقلام، مشتری و وضعیت سفارش" />
          <ActionCard to="/admin/technicians" icon={<UserRoundCheck />} title="مدیریت سرویس‌کاران" desc="ساخت حساب، ویرایش و فعال/غیرفعال" />
          <ActionCard to="/admin/service-fleet" icon={<CarFront />} title="مدیریت خودروهای سرویس" desc="پلاک، محدوده و سرویس‌کار پیش‌فرض" />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-white">هشدارهای فوری</h2><p className="mt-1 text-xs text-slate-500">مواردی که بهتر است امروز بررسی شوند</p></div><span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-300">{attentionCount.toLocaleString('fa-IR')}</span></div>
        <div className="space-y-2">
          <AlertRow label="سفارش معطل" value={summary?.pendingOrders ?? 0} to="/admin/orders" />
          <AlertRow label="پرداخت ناموفق/در انتظار" value={summary?.unpaidOrders ?? 0} to="/admin/orders" />
          <AlertRow label="محصول کم‌موجود" value={summary?.lowStockProducts ?? 0} to="/admin/inventory" />
          <AlertRow label="نظر در انتظار تأیید" value={summary?.unapprovedReviews ?? 0} to="/admin/reviews" />
        </div>
      </div>
    </section>

    <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-white">چرخه عملیات سرویس</h2><p className="mt-1 text-xs text-slate-500">مدیر فقط تخصیص را انجام می‌دهد؛ ادامه مراحل در پنل سرویس‌کار پیش می‌رود.</p></div><Link to="/admin/dispatch" className="text-xs font-black text-amber-300">باز کردن عملیات سرویس ←</Link></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <FlowStep n="۱" title="پرداخت شد" text="وارد صف عملیات" />
        <FlowStep n="۲" title="تخصیص" text="سرویس‌کار + خودرو" />
        <FlowStep n="۳" title="در مسیر" text="شروع حرکت" />
        <FlowStep n="۴" title="در حال سرویس" text="ثبت عملیات و اقلام" />
        <FlowStep n="۵" title="تکمیل" text="فاکتور و نظرسنجی" done />
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-white">فروش ۱۴ روز اخیر</h2><span className="text-[11px] text-slate-500">سفارش‌های پرداخت‌شده</span></div>
        <div className="flex h-56 items-end gap-2 border-t border-slate-800 pt-6">{chart.map((item) => <div key={item.date} className="flex flex-1 flex-col items-center gap-2"><div className="w-full min-h-[6px] rounded-t-lg bg-amber-400/80" style={{ height: `${Math.max(6, (Number(item.sales || 0) / maxSales) * 170)}px` }} title={money(item.sales)} /><span className="text-[9px] text-slate-600">{String(item.date).slice(5)}</span></div>)}</div>
      </div>
      <div className="space-y-4">
        <MiniList title="محصولات کم‌موجود" icon={<Package />} items={alerts?.products ?? []} render={(p:any) => `${p.name ?? 'محصول'} · ${p.stock ?? 0}`} to="/admin/inventory" />
        <MiniList title="نظرات جدید" icon={<Star />} items={alerts?.reviews ?? []} render={(r:any) => `${r.customer_name ?? 'مشتری'} · ${r.rating ?? '-'} ★`} to="/admin/reviews" />
      </div>
    </section>
  </div>;
}

function Kpi({ icon, title, value, warning = false }: { icon: ReactNode; title: string; value: ReactNode; warning?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${warning ? 'border-rose-500/25 bg-rose-500/10' : 'border-slate-800 bg-slate-900/80'}`}><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-500">{title}</span><span className={warning ? 'text-rose-300' : 'text-amber-300'}>{icon}</span></div><b className="text-xl text-white">{value}</b></div>;
}
function ActionCard({ to, icon, title, desc, primary = false }: { to: string; icon: ReactNode; title: string; desc: string; primary?: boolean }) {
  return <Link to={to} className={`group flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${primary ? 'border-amber-400/30 bg-amber-400/10' : 'border-slate-800 bg-slate-950/55 hover:border-slate-700'}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${primary ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300'}`}>{icon}</span><span className="min-w-0 flex-1"><b className="text-sm text-white">{title}</b><span className="mt-1 block text-xs leading-6 text-slate-500">{desc}</span></span><ArrowLeft className="mt-2 h-4 w-4 text-slate-600 transition group-hover:text-amber-300" /></Link>;
}
function AlertRow({ label, value, to }: { label: string; value: number; to: string }) {
  return <Link to={to} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 transition hover:border-amber-400/30"><Clock3 className="h-4 w-4 text-slate-600" /><span className="flex-1 text-sm text-slate-300">{label}</span><b className="text-amber-300">{Number(value || 0).toLocaleString('fa-IR')}</b></Link>;
}
function FlowStep({ n, title, text, done = false }: { n: string; title: string; text: string; done?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/55'}`}><div className="mb-3 flex items-center justify-between"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${done ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : n}</span></div><b className="text-sm text-white">{title}</b><p className="mt-1 text-xs text-slate-500">{text}</p></div>;
}
function MiniList({ title, icon, items, render, to }: { title: string; icon: ReactNode; items: any[]; render: (item:any) => string; to: string }) {
  return <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-4"><div className="mb-3 flex items-center gap-2"><span className="text-amber-300">{icon}</span><h3 className="text-sm font-black text-white">{title}</h3><Link to={to} className="mr-auto text-[10px] font-black text-slate-500">همه</Link></div><div className="space-y-2">{items.length ? items.slice(0,4).map((item:any,i:number) => <div key={item.id ?? i} className="rounded-xl bg-slate-950/55 px-3 py-2 text-xs text-slate-400">{render(item)}</div>) : <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600">موردی نیست.</div>}</div></div>;
}
