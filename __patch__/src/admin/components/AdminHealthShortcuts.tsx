import { Link } from 'react-router-dom';

const healthLinks = [
  {
    title: 'تست سلامت مسیرها',
    description: 'بررسی Routeها، لینک‌های پنل و صفحات جاافتاده',
    href: '/admin/navigation-audit',
    icon: '✅',
  },
  {
    title: 'وضعیت سیستم',
    description: 'بررسی اتصال Supabase، جدول‌ها و وضعیت بخش‌های اصلی',
    href: '/admin/system-health',
    icon: '📊',
  },
  {
    title: 'گزارش خطاها',
    description: 'مشاهده باگ‌ها و گزارش‌های ثبت‌شده توسط کاربران',
    href: '/admin/bug-reports',
    icon: '🐞',
  },
];

export default function AdminHealthShortcuts() {
  return (
    <section className="rounded-2xl border border-amber-400/25 bg-gradient-to-l from-amber-500/15 via-slate-900/90 to-slate-950 p-4 shadow-lg shadow-amber-500/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-amber-100">🛠 سلامت سیستم Carrtell</h2>
          <p className="mt-1 text-xs text-slate-300">دسترسی سریع به تست مسیرها، خطاها و وضعیت کلی پروژه</p>
        </div>
        <Link
          to="/admin/navigation-audit"
          className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
        >
          بررسی سلامت
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {healthLinks.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-amber-300/60 hover:bg-white/10"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-bold text-white">{item.title}</span>
            </div>
            <p className="text-xs leading-6 text-slate-300">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
