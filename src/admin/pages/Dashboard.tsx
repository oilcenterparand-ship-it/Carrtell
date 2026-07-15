import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import {
  getAdminOrderStats,
  getAdminOrderSummaries,
  subscribeToOrders,
  type AdminOrderStats,
  type AdminOrderSummary,
} from '../services/orderStatsApi';

function formatPrice(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(value || 0));
}

const initialStats: AdminOrderStats = {
  total: 0,
  pendingReview: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  today: 0,
  totalAmount: 0,
};

const cardTones = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function StatCard({ title, value, subtitle, icon: Icon, tone }: { title: string; value: string | number; subtitle: string; icon: any; tone: keyof typeof cardTones }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <b className="mt-2 block text-2xl text-slate-950 sm:text-3xl">{value}</b>
          <p className="mt-2 text-xs leading-5 text-slate-400">{subtitle}</p>
        </div>
        <div className={`rounded-2xl p-3 ring-4 ${cardTones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<AdminOrderStats>(initialStats);
  const [pendingOrders, setPendingOrders] = useState<AdminOrderSummary[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [nextStats, nextPending] = await Promise.all([
        getAdminOrderStats(),
        getAdminOrderSummaries(6),
      ]);
      setStats(nextStats);
      setPendingOrders(nextPending);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const unsubscribe = subscribeToOrders(loadDashboard);
    return unsubscribe;
  }, []);

  const averageOrder = stats.total > 0 ? stats.totalAmount / stats.total : 0;

  const cards = useMemo(() => [
    { title: 'سفارش جدید', value: stats.pendingReview, subtitle: 'نیاز به بررسی مدیر', icon: AlertCircle, tone: 'amber' as const },
    { title: 'در حال آماده‌سازی', value: stats.processing, subtitle: 'سفارش‌های تایید شده', icon: Truck, tone: 'sky' as const },
    { title: 'تکمیل شده', value: stats.completed, subtitle: 'سفارش‌های پایان‌یافته', icon: CheckCircle2, tone: 'emerald' as const },
    { title: 'سفارش امروز', value: stats.today, subtitle: 'ثبت‌شده از ابتدای امروز', icon: Clock3, tone: 'violet' as const },
    { title: 'میانگین سفارش', value: `${formatPrice(averageOrder)} ت`, subtitle: 'میانگین مبلغ کل سفارش‌ها', icon: CircleDollarSign, tone: 'rose' as const },
    { title: 'لغو شده', value: stats.cancelled, subtitle: 'نیازمند بررسی علت لغو', icon: Activity, tone: 'slate' as const },
  ], [averageOrder, stats]);

  const quickActions = [
    { label: 'محصول جدید', to: '/admin/products', icon: ShoppingBag, description: 'تعریف یا ویرایش کالا' },
    { label: 'مدیریت سفارش‌ها', to: '/admin/orders', icon: PackageCheck, description: 'بررسی و تغییر وضعیت' },
    { label: 'سرویس‌های در محل', to: '/admin/service-requests', icon: Wrench, description: 'مدیریت رزروها' },
    { label: 'مشتریان', to: '/admin/customers', icon: Users, description: 'CRM و اطلاعات مشتری' },
  ];

  const systemItems = [
    { label: 'اتصال پنل مدیریت', value: 'فعال', tone: 'emerald' },
    { label: 'سفارش‌های نیازمند اقدام', value: String(stats.pendingReview), tone: stats.pendingReview > 0 ? 'amber' : 'emerald' },
    { label: 'سفارش‌های در پردازش', value: String(stats.processing), tone: 'sky' },
  ];

  return (
    <section dir="rtl" className="space-y-5 sm:space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              مرکز کنترل Carrtell
            </div>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">داشبورد مدیریت</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              وضعیت فروش، سفارش‌ها و عملیات روزانه را از یک صفحه کنترل کن.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastUpdated && (
              <span className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 sm:text-xl">سفارش‌های در انتظار بررسی</h2>
              <p className="mt-1 text-sm text-slate-500">آخرین سفارش‌هایی که نیاز به اقدام دارند.</p>
            </div>
            <Link to="/admin/orders" className="inline-flex items-center gap-2 self-start rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-300">
              مشاهده همه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {isLoading && pendingOrders.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-3xl bg-slate-100" />)}
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-3 font-bold text-slate-900">فعلاً سفارشی برای بررسی نداری.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Link key={order.id} to="/admin/orders" className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50 md:grid-cols-[1fr_1fr_160px] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-slate-950">{order.order_number}</b>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">در انتظار بررسی</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{new Date(order.created_at).toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p className="font-bold">{order.customer_name || 'مشتری'}</p>
                    <p className="mt-1 text-xs text-slate-400">{order.customer_car || 'خودرو ثبت نشده'} • {order.items_count} کالا</p>
                  </div>
                  <b className="text-left text-amber-700">{formatPrice(Number(order.total_amount))} تومان</b>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">وضعیت سیستم</h2>
                <p className="mt-1 text-xs text-slate-500">نمای کلی عملیات پنل</p>
              </div>
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-3">
              {systemItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5">
                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    item.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : item.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">دسترسی سریع</h2>
              <Plus className="h-5 w-5 text-amber-600" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              {quickActions.map(({ label, to, icon: Icon, description }) => (
                <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-slate-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block">{label}</span>
                    <span className="mt-1 block text-[11px] font-normal text-slate-400">{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black text-amber-700">جمع مبلغ سفارش‌ها</p>
            <b className="mt-2 block text-2xl text-slate-950">{formatPrice(stats.totalAmount)} تومان</b>
            <p className="mt-2 text-xs text-slate-500">بر مبنای سفارش‌های ثبت‌شده در سیستم</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
