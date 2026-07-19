import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Boxes,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Star,
  Users,
  WalletCards,
} from 'lucide-react';
import { getOperationsSnapshot, type OperationsAlert, type OperationsSnapshot } from '../services/operationsCenterApi';

const money = (value: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(value || 0))} تومان`;
const statusLabel = (status: string) => ({
  pending: 'در انتظار',
  pending_review: 'نیازمند بررسی',
  pending_payment: 'در انتظار پرداخت',
  processing: 'در حال آماده‌سازی',
  ready: 'آماده',
  ready_to_ship: 'آماده ارسال',
  assigned: 'تخصیص داده‌شده',
  on_the_way: 'در مسیر',
  arrived: 'رسیده',
  in_progress: 'در حال سرویس',
  completed: 'تکمیل‌شده',
} as Record<string, string>)[status] || status || 'نامشخص';

export default function OperationsCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState<OperationsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getOperationsSnapshot());
    } catch (loadError: any) {
      setError(loadError?.message || 'دریافت اطلاعات مرکز عملیات ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => { void load(); }, 20000);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  const updated = useMemo(() => data
    ? new Date(data.updatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—', [data]);
  const metrics = data?.metrics;

  return (
    <div dir="rtl" className="space-y-6 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-l from-slate-900 to-slate-900/70 p-5 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Activity /></span>
            <div>
              <h1 className="text-2xl font-black">مرکز عملیات Carrtell</h1>
              <p className="mt-1 text-sm text-slate-400">پایش زنده سفارش‌ها، سرویس‌ها، موجودی و بازخورد مشتریان</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate('/admin/phone-order')} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-900/20">ثبت سفارش تلفنی</button>
            <span className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">آخرین بروزرسانی: {updated}</span>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs">
              <input type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} /> بروزرسانی خودکار
            </label>
            <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-bold text-slate-950">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> بروزرسانی
            </button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<WalletCards />} title="فروش امروز" value={money(metrics?.todaySales || 0)} />
        <Metric icon={<ShoppingCart />} title="سفارش‌های باز" value={metrics?.pendingOrders || 0} onClick={() => navigate('/admin/orders')} />
        <Metric icon={<CarFront />} title="سرویس‌های فعال" value={metrics?.activeServices || 0} onClick={() => navigate('/admin/dispatch')} />
        <Metric icon={<Boxes />} title="کم‌موجود" value={metrics?.lowStock || 0} warning onClick={() => navigate('/admin/inventory')} />
        <Metric icon={<Users />} title="مشتری جدید ماه" value={metrics?.newCustomers || 0} onClick={() => navigate('/admin/customers')} />
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-black"><AlertTriangle className="text-amber-300" /> هشدارهای عملیاتی</h2>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">{data?.alerts.length || 0}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data?.alerts.length ? data.alerts.map(alert => <AlertCard key={alert.id} alert={alert} onClick={() => navigate(alert.path)} />) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center text-sm text-emerald-200">هشدار مهمی وجود ندارد.</div>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="سفارش‌های فوری" icon={<AlertTriangle className="text-rose-300" />} items={data?.urgentOrders || []} empty="سفارش فوری وجود ندارد." action={() => navigate('/admin/orders')} render={(item: any) => <Row title={`سفارش ${String(item.id || '').slice(0, 8)}`} meta={statusLabel(item.status)} value={money(Number(item.total_amount ?? item.total ?? 0))} />} />
        <Panel title="سرویس‌کارهای در مأموریت" icon={<CarFront className="text-sky-300" />} items={data?.activeServices || []} empty="سرویس فعالی وجود ندارد." action={() => navigate('/admin/dispatch')} render={(item: any) => <Row title={item.customer_name || item.service_title || `درخواست ${String(item.id || '').slice(0, 8)}`} meta={statusLabel(item.status)} value={item.scheduled_time || item.time_slot || ''} />} />
        <Panel title="سفارش‌های آماده ارسال" icon={<PackageCheck className="text-emerald-300" />} items={data?.readyOrders || []} empty="سفارشی آماده ارسال نیست." action={() => navigate('/admin/orders')} render={(item: any) => <Row title={`سفارش ${String(item.id || '').slice(0, 8)}`} meta={statusLabel(item.status)} value={money(Number(item.total_amount ?? item.total ?? 0))} />} />
        <Panel title="سرویس‌های تکمیل‌شده امروز" icon={<CheckCircle2 className="text-emerald-300" />} items={data?.completedToday || []} empty="هنوز سرویسی تکمیل نشده است." action={() => navigate('/admin/service-requests')} render={(item: any) => <Row title={item.customer_name || item.service_title || 'سرویس'} meta="تکمیل‌شده" value={item.completed_at ? new Date(item.completed_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''} />} />
        <Panel title="کالاهای رو به اتمام" icon={<Boxes className="text-amber-300" />} items={data?.lowStockProducts || []} empty="موجودی بحرانی وجود ندارد." action={() => navigate('/admin/inventory')} render={(item: any) => <Row title={item.name || 'محصول'} meta={`حداقل: ${item.min_stock ?? 5}`} value={`موجودی: ${item.stock ?? 0}`} />} />
        <Panel title="آخرین نظرات مشتریان" icon={<Star className="text-yellow-300" />} items={data?.recentReviews || []} empty="نظری ثبت نشده است." action={() => navigate('/admin/reviews')} render={(item: any) => <Row title={item.customer_name || 'مشتری'} meta={(item.comment || item.body || 'بدون متن').slice(0, 60)} value={`${item.rating || 0} ★`} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Info title="کیفیت کاتالوگ" icon={<AlertTriangle />} lines={[`محصول دارای نقص اطلاعات: ${data?.productIssues.length || 0}`, `محصول کم‌موجود: ${metrics?.lowStock || 0}`, `نظر در انتظار تأیید: ${metrics?.pendingReviews || 0}`]} />
        <Info title="پرونده سلامت خودرو" icon={<CarFront />} lines={[`خودروهای ثبت‌شده: ${data?.health.vehicles || 0}`, `سوابق سرویس: ${data?.health.records || 0}`, `نزدیک موعد سرویس: ${data?.health.dueSoon || 0}`]} />
        <Info title="کاربران بر اساس نقش" icon={<Users />} lines={Object.entries(data?.roleCounts || {}).map(([key, value]) => `${key}: ${value}`)} />
      </div>
    </div>
  );
}

function Metric({ icon, title, value, warning = false, onClick }: { icon: ReactNode; title: string; value: ReactNode; warning?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-right shadow-lg transition ${onClick ? 'hover:-translate-y-0.5 hover:border-yellow-400/40' : 'cursor-default'} ${warning ? 'border-amber-500/30 bg-amber-500/10' : 'border-slate-800 bg-slate-900/80'}`}>
    <div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-400">{title}</span><span className="text-yellow-300">{icon}</span></div>
    <b className="text-xl">{value}</b>
  </button>;
}

function AlertCard({ alert, onClick }: { alert: OperationsAlert; onClick: () => void }) {
  const style = alert.level === 'critical'
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
    : alert.level === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : 'border-sky-500/30 bg-sky-500/10 text-sky-100';
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 ${style}`}>
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/15 font-black">{alert.count}</span>
      <div className="min-w-0 flex-1"><p className="font-black">{alert.title}</p><p className="mt-1 text-xs leading-6 opacity-75">{alert.description}</p></div>
      <ChevronLeft size={17} className="mt-1 shrink-0 opacity-60" />
    </div>
  </button>;
}

function Panel({ title, icon, items, render, empty, action }: { title: string; icon: ReactNode; items: any[]; render: (item: any) => ReactNode; empty: string; action?: () => void }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
    <div className="flex items-center gap-2"><h2 className="flex items-center gap-2 font-black">{icon}{title}</h2><span className="mr-auto rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">{items.length}</span>{action && <button onClick={action} className="text-xs font-bold text-yellow-300">مشاهده همه</button>}</div>
    <div className="mt-4 max-h-80 space-y-2 overflow-auto">{items.length ? items.map((item, index) => <div key={item.id || index}>{render(item)}</div>) : <p className="py-8 text-center text-sm text-slate-500">{empty}</p>}</div>
  </section>;
}

function Row({ title, meta, value }: { title: string; meta: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3"><Clock3 size={15} className="shrink-0 text-slate-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{title}</p><p className="truncate text-xs text-slate-500">{meta}</p></div><span className="shrink-0 text-xs font-bold text-yellow-300">{value}</span></div>;
}

function Info({ title, icon, lines }: { title: string; icon: ReactNode; lines: string[] }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><h3 className="flex items-center gap-2 font-black text-slate-200">{icon}{title}</h3><div className="mt-4 space-y-2">{lines.length ? lines.map((line, index) => <p key={index} className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm text-slate-400">{line}</p>) : <p className="text-sm text-slate-500">داده‌ای موجود نیست.</p>}</div></div>;
}
