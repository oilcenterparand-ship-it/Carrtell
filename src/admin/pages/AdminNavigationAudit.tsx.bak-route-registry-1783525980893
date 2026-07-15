import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type RouteStatus = 'healthy' | 'check' | 'missing-link' | 'public' | 'driver' | 'customer';

type RouteItem = {
  path: string;
  title: string;
  group: string;
  type: 'admin' | 'customer' | 'driver' | 'public';
  description?: string;
  status?: RouteStatus;
};

const routeItems: RouteItem[] = [
  { group: 'مرکز مدیریت', title: 'مرکز مسیرها', path: '/admin/quick-links', type: 'admin', status: 'healthy' },
  { group: 'مرکز مدیریت', title: 'تست سلامت مسیرها', path: '/admin/navigation-audit', type: 'admin', status: 'healthy' },
  { group: 'مرکز مدیریت', title: 'داشبورد مدیریت', path: '/admin/dashboard', type: 'admin', status: 'healthy' },
  { group: 'مرکز مدیریت', title: 'سلامت سیستم', path: '/admin/system-health', type: 'admin', status: 'healthy' },
  { group: 'مرکز مدیریت', title: 'گزارش باگ‌ها', path: '/admin/bug-reports', type: 'admin', status: 'healthy' },
  { group: 'فروش و سفارش', title: 'سفارش‌ها', path: '/admin/orders', type: 'admin', status: 'healthy' },
  { group: 'فروش و سفارش', title: 'تخفیف‌ها و کمپین‌ها', path: '/admin/discounts', type: 'admin', status: 'healthy' },
  { group: 'فروش و سفارش', title: 'مرجوعی/بررسی کالا', path: '/admin/returns', type: 'admin', status: 'healthy' },
  { group: 'فروش و سفارش', title: 'اصالت کالا', path: '/admin/authenticity', type: 'admin', status: 'healthy' },
  { group: 'عملیات سرویس', title: 'مرکز اعزام', path: '/admin/dispatch', type: 'admin', status: 'healthy' },
  { group: 'عملیات سرویس', title: 'درخواست‌های سرویس', path: '/admin/service-requests', type: 'admin', status: 'healthy' },
  { group: 'عملیات سرویس', title: 'ناوگان سرویس', path: '/admin/service-fleet', type: 'admin', status: 'healthy' },
  { group: 'عملیات سرویس', title: 'شعب', path: '/admin/branches', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'محصولات', path: '/admin/products', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'دسته‌بندی‌ها', path: '/admin/categories', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'برندها', path: '/admin/brands', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'خودروها', path: '/admin/cars', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'پکیج‌ها', path: '/admin/packages', type: 'admin', status: 'healthy' },
  { group: 'محصولات', title: 'پیشنهادهای هوشمند', path: '/admin/recommendations', type: 'admin', status: 'healthy' },
  { group: 'انبار و خرید', title: 'انبار', path: '/admin/inventory', type: 'admin', status: 'healthy' },
  { group: 'انبار و خرید', title: 'تأمین‌کنندگان', path: '/admin/suppliers', type: 'admin', status: 'healthy' },
  { group: 'انبار و خرید', title: 'خرید کالا', path: '/admin/purchases', type: 'admin', status: 'healthy' },
  { group: 'مالی', title: 'داشبورد مالی', path: '/admin/finance', type: 'admin', status: 'healthy' },
  { group: 'مالی', title: 'تنظیمات پرداخت', path: '/admin/payment-settings', type: 'admin', status: 'healthy' },
  { group: 'مشتریان', title: 'CRM مشتریان', path: '/admin/customers-crm', type: 'admin', status: 'healthy' },
  { group: 'مشتریان', title: 'باشگاه مشتریان', path: '/admin/loyalty', type: 'admin', status: 'healthy' },
  { group: 'مشتریان', title: 'تیکت‌ها', path: '/admin/support', type: 'admin', status: 'healthy' },
  { group: 'مشتریان', title: 'نظرات مشتریان', path: '/admin/reviews', type: 'admin', status: 'healthy' },
  { group: 'مشتریان', title: 'اعلان‌ها', path: '/admin/notifications', type: 'admin', status: 'healthy' },
  { group: 'محتوا و سئو', title: 'بلاگ', path: '/admin/blog', type: 'admin', status: 'healthy' },
  { group: 'محتوا و سئو', title: 'سئو و متاتگ‌ها', path: '/admin/seo', type: 'admin', status: 'healthy' },
  { group: 'محتوا و سئو', title: 'محتوای صفحه اصلی', path: '/admin/home-content', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'تنظیمات', path: '/admin/settings', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'ظاهر سایت', path: '/admin/appearance', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'کارکنان', path: '/admin/staff', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'نقش‌ها', path: '/admin/roles', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs', type: 'admin', status: 'healthy' },
  { group: 'تنظیمات و امنیت', title: 'لاگ پیامک‌ها', path: '/admin/sms-logs', type: 'admin', status: 'healthy' },
  { group: 'گزارش‌ها', title: 'گزارش سرمایه‌گذار', path: '/admin/investor-report', type: 'admin', status: 'healthy' },
  { group: 'مسیرهای مشتری', title: 'کیف پول مشتری', path: '/profile/wallet', type: 'customer', status: 'customer' },
  { group: 'مسیرهای مشتری', title: 'پشتیبانی مشتری', path: '/profile/support', type: 'customer', status: 'customer' },
  { group: 'مسیرهای مشتری', title: 'مرجوعی مشتری', path: '/profile/returns', type: 'customer', status: 'customer' },
  { group: 'مسیرهای مشتری', title: 'محصولات مناسب خودروی من', path: '/my-car/products', type: 'customer', status: 'customer' },
  { group: 'مسیرهای راننده', title: 'داشبورد سرویس‌کار', path: '/driver/dashboard', type: 'driver', status: 'driver' },
  { group: 'مسیرهای راننده', title: 'تست مأموریت سرویس‌کار', path: '/driver/jobs/test', type: 'driver', status: 'driver' },
  { group: 'مسیرهای عمومی', title: 'بلاگ', path: '/blog', type: 'public', status: 'public' },
  { group: 'مسیرهای عمومی', title: 'اعلان‌ها', path: '/notifications', type: 'public', status: 'public' },
  { group: 'مسیرهای عمومی', title: 'گزارش باگ', path: '/report-bug', type: 'public', status: 'public' },
  { group: 'مسیرهای عمومی', title: 'بررسی اصالت کالا', path: '/authenticity', type: 'public', status: 'public' },
];

function statusLabel(status?: RouteStatus) {
  switch (status) {
    case 'healthy': return 'در لیست پنل';
    case 'customer': return 'مسیر مشتری';
    case 'driver': return 'مسیر سرویس‌کار';
    case 'public': return 'مسیر عمومی';
    case 'missing-link': return 'لینک ندارد';
    default: return 'نیازمند بررسی';
  }
}

function statusClass(status?: RouteStatus) {
  if (status === 'healthy') return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30';
  if (status === 'customer') return 'bg-blue-500/15 text-blue-200 border-blue-400/30';
  if (status === 'driver') return 'bg-amber-500/15 text-amber-200 border-amber-400/30';
  if (status === 'public') return 'bg-violet-500/15 text-violet-200 border-violet-400/30';
  return 'bg-rose-500/15 text-rose-200 border-rose-400/30';
}

export default function AdminNavigationAudit() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | RouteItem['type']>('all');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routeItems.filter((item) => {
      const matchType = type === 'all' || item.type === type;
      const matchQuery = !q || item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q) || item.group.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [query, type]);

  const groups = useMemo(() => {
    return filtered.reduce<Record<string, RouteItem[]>>((acc, item) => {
      acc[item.group] ||= [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const report = routeItems.map((item) => `${item.group} | ${item.title} | ${item.path} | ${statusLabel(item.status)}`).join('\n');

  const copyReport = async () => {
    await navigator.clipboard?.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-amber-300">Carrtell Admin Navigation Audit</p>
              <h1 className="mt-2 text-2xl font-black">تست سلامت مسیرهای پنل و سایت</h1>
              <p className="mt-2 text-sm text-slate-300">همه مسیرهایی که در مراحل پروژه ساخته شده‌اند اینجا دسته‌بندی شده‌اند تا چیزی از پنل مدیریت جا نماند.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/quick-links" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">مرکز مسیرها</Link>
              <button onClick={copyReport} className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300">{copied ? 'کپی شد' : 'کپی گزارش'}</button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-slate-400">کل مسیرها</p><b className="text-2xl">{routeItems.length}</b></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-slate-400">مدیریتی</p><b className="text-2xl">{routeItems.filter(x=>x.type==='admin').length}</b></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-slate-400">مشتری/عمومی/راننده</p><b className="text-2xl">{routeItems.filter(x=>x.type!=='admin').length}</b></div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4"><p className="text-xs text-emerald-200">وضعیت</p><b className="text-lg text-emerald-100">لیست کامل شد</b></div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="جستجو بر اساس نام یا مسیر..." className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-amber-300" />
            <select value={type} onChange={(e)=>setType(e.target.value as any)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-amber-300">
              <option value="all">همه مسیرها</option>
              <option value="admin">مدیریتی</option>
              <option value="customer">مشتری</option>
              <option value="driver">سرویس‌کار</option>
              <option value="public">عمومی</option>
            </select>
          </div>
        </div>

        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="mb-4 text-lg font-black text-white">{group}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link key={item.path} to={item.path} className="group rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-amber-200">{item.title}</h3>
                      <p className="mt-2 font-mono text-xs text-slate-400 ltr:text-left">{item.path}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          نکته: این صفحه مسیرها را از نظر دسترسی و لینک‌دهی مدیریت می‌کند. تست نهایی خطاهای دیتابیس، جدول‌ها و API از مسیر <Link className="underline" to="/admin/system-health">/admin/system-health</Link> انجام می‌شود.
        </div>
      </div>
    </div>
  );
}
