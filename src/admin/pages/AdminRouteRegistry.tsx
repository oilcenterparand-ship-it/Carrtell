import { Link } from 'react-router-dom';

const routes = [
  ['/admin/quick-links', 'مرکز مسیرها'],
  ['/admin/navigation-audit', 'تست سلامت مسیرها'],
  ['/admin/system-health', 'سلامت سیستم'],
  ['/admin/bug-reports', 'گزارش خطاها'],
  ['/admin/dashboard', 'داشبورد مدیریت'],
  ['/admin/orders', 'سفارش‌ها'],
  ['/admin/products', 'محصولات'],
  ['/admin/settings', 'تنظیمات'],
  ['/admin/appearance', 'ظاهر سایت'],
  ['/admin/customers-crm', 'CRM مشتریان'],
  ['/admin/finance', 'مالی'],
  ['/admin/inventory', 'انبار'],
];

export default function AdminRouteRegistry() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <h1 className="text-2xl font-black">📍 مدیریت مسیرها / Route Registry</h1>
          <p className="mt-2 text-sm text-slate-300">لیست مسیرهای مهم پنل مدیریت کارتل برای تست و دسترسی سریع.</p>
          <Link to="/admin/quick-links" className="mt-4 inline-flex rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950">بازگشت به مرکز مسیرها</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map(([path, label]) => (
            <Link key={path} to={path} className="rounded-2xl border border-white/10 bg-slate-900 p-4 hover:bg-slate-800">
              <div className="font-bold">{label}</div>
              <div className="mt-2 text-xs text-sky-300">{path}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
