import fs from 'fs';
import path from 'path';

const root = process.cwd();
const quickLinksPath = path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx');
const adminRoutesPath = path.join(root, 'src', 'admin', 'routes', 'adminRoutes.ts');

const routeGroups = [
  { title: 'داشبورد و سلامت', icon: '🏠', routes: [
    ['/admin/dashboard','داشبورد مدیریت'], ['/admin/quick-links','مرکز مسیرها'], ['/admin/navigation-audit','تست سلامت مسیرها'], ['/admin/system-health','وضعیت سیستم'], ['/admin/bug-reports','گزارش خطاها']
  ]},
  { title: 'فروشگاه', icon: '🛒', routes: [
    ['/admin/products','محصولات'], ['/admin/categories','دسته‌بندی‌ها'], ['/admin/brands','برندها'], ['/admin/packages','پکیج‌ها'], ['/admin/discounts','تخفیف‌ها'], ['/admin/campaigns','کمپین‌ها'], ['/admin/smart-sales','فروش هوشمند']
  ]},
  { title: 'سفارش و عملیات', icon: '🚗', routes: [
    ['/admin/orders','سفارش‌ها'], ['/admin/dispatch','مرکز اعزام'], ['/admin/service-requests','درخواست‌های سرویس'], ['/admin/service-fleet','ناوگان سرویس'], ['/admin/branches','شعب']
  ]},
  { title: 'مشتریان', icon: '👥', routes: [
    ['/admin/customers','مشتری‌ها'], ['/admin/customers-crm','CRM مشتریان'], ['/admin/loyalty','باشگاه مشتریان'], ['/admin/support','پشتیبانی'], ['/admin/notifications','اعلان‌ها'], ['/admin/returns','مرجوعی‌ها'], ['/admin/authenticity','اصالت کالا']
  ]},
  { title: 'انبار و تأمین', icon: '📦', routes: [
    ['/admin/inventory','انبار'], ['/admin/suppliers','تأمین‌کنندگان'], ['/admin/purchases','خرید کالا']
  ]},
  { title: 'مالی و گزارش‌ها', icon: '💰', routes: [
    ['/admin/finance','مالی'], ['/admin/investor-report','گزارش سرمایه‌گذار']
  ]},
  { title: 'محتوا و بازاریابی', icon: '📢', routes: [
    ['/admin/blog','بلاگ'], ['/admin/seo','SEO'], ['/admin/home-content','محتوای صفحه اصلی']
  ]},
  { title: 'کارکنان و سیستم', icon: '⚙️', routes: [
    ['/admin/staff','کارکنان'], ['/admin/roles','نقش‌ها'], ['/admin/settings','تنظیمات'], ['/admin/appearance','ظاهر سایت'], ['/admin/audit-logs','گزارش فعالیت‌ها'], ['/admin/sms-logs','لاگ پیامک'], ['/admin/payment-settings','تنظیمات پرداخت'], ['/admin/route-registry','Route Registry']
  ]},
  { title: 'مسیرهای عمومی/کاربر/راننده', icon: '🌐', routes: [
    ['/profile/wallet','کیف پول مشتری'], ['/profile/support','پشتیبانی مشتری'], ['/profile/returns','مرجوعی مشتری'], ['/notifications','اعلان‌های کاربر'], ['/blog','بلاگ عمومی'], ['/authenticity','بررسی اصالت'], ['/driver/dashboard','داشبورد سرویس‌کار'], ['/driver/jobs/test','مأموریت تست سرویس‌کار']
  ]}
];

const routeData = JSON.stringify(routeGroups, null, 2);

const component = `import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const routeGroups = ${routeData};

export default function QuickLinks() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'registry'>('quick');

  const flatRoutes = useMemo(() => routeGroups.flatMap(group => group.routes.map(([path, title]) => ({ path, title, group: group.title, icon: group.icon }))), []);
  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatRoutes;
    return flatRoutes.filter(item => item.path.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q));
  }, [flatRoutes, query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">مرکز مسیرهای پنل مدیریت</h1>
              <p className="mt-2 text-sm text-slate-400">همه مسیرهای جدید Carrtell از این صفحه قابل دسترسی و بررسی هستند.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/navigation-audit" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400">🛠 تست سلامت مسیرها</Link>
              <Link to="/admin/system-health" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400">وضعیت سیستم</Link>
              <Link to="/admin/bug-reports" className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400">گزارش خطاها</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
          <button onClick={() => setActiveTab('quick')} className={
            `rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'quick' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`
          }>دسترسی سریع</button>
          <button onClick={() => setActiveTab('registry')} className={
            `rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'registry' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`
          }>📍 مدیریت مسیرها / Route Registry</button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در مسیرها، عنوان‌ها و دسته‌بندی‌ها..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
          />
        </div>

        {activeTab === 'quick' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {routeGroups.map(group => (
              <section key={group.title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white"><span>{group.icon}</span>{group.title}</h2>
                <div className="grid gap-2">
                  {group.routes
                    .filter(([path, title]) => {
                      const q = query.trim().toLowerCase();
                      return !q || path.toLowerCase().includes(q) || title.toLowerCase().includes(q) || group.title.toLowerCase().includes(q);
                    })
                    .map(([path, title]) => (
                      <Link key={path} to={path} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 hover:border-amber-400 hover:bg-slate-900">
                        <span className="font-bold">{title}</span>
                        <span className="ltr text-xs text-slate-500">{path}</span>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">📍 مدیریت مسیرها / Route Registry</h2>
                <p className="mt-1 text-sm text-slate-400">لیست یکپارچه همه مسیرهای ساخته‌شده، برای اینکه چیزی از پنل مدیریت جا نماند.</p>
              </div>
              <Link to="/admin/route-registry" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-amber-400">باز کردن صفحه Route Registry</Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">عنوان</th>
                    <th className="p-3">مسیر</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map(item => (
                    <tr key={item.path} className="border-t border-slate-800 hover:bg-slate-950/50">
                      <td className="p-3 font-bold text-white">{item.title}</td>
                      <td className="p-3 ltr text-slate-300">{item.path}</td>
                      <td className="p-3 text-slate-300">{item.icon} {item.group}</td>
                      <td className="p-3"><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">فعال</span></td>
                      <td className="p-3"><Link to={item.path} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400">باز کردن</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
`;

fs.mkdirSync(path.dirname(quickLinksPath), { recursive: true });
if (fs.existsSync(quickLinksPath)) {
  fs.copyFileSync(quickLinksPath, quickLinksPath + `.bak-${Date.now()}`);
}
fs.writeFileSync(quickLinksPath, component, 'utf8');

// Keep adminRoutes lightweight; if it exists, append route metadata only when safe.
if (fs.existsSync(adminRoutesPath)) {
  let content = fs.readFileSync(adminRoutesPath, 'utf8');
  if (!content.includes('/admin/quick-links') && content.includes('adminRoutes')) {
    content += `\n// QuickLinks route is provided in App.tsx. Registry merged into /admin/quick-links.\n`;
    fs.writeFileSync(adminRoutesPath, content, 'utf8');
  }
}

console.log('✅ Quick Links Route Registry Fix applied. Open /admin/quick-links');
