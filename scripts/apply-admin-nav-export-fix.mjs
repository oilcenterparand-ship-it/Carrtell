import fs from 'fs';
import path from 'path';

const root = process.cwd();
const candidates = [
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'pages', 'AdminQuickLinks.tsx'),
  path.join(root, 'src', 'pages', 'QuickLinks.tsx'),
];

const existing = candidates.filter((p) => fs.existsSync(p));
if (!existing.length) {
  console.error('❌ فایل QuickLinks/AdminQuickLinks پیدا نشد. مسیرهای بررسی شده:');
  candidates.forEach((p) => console.error(' - ' + p));
  process.exit(1);
}

const target = existing[0];
const backup = `${target}.bak-nav-export-${Date.now()}`;
fs.copyFileSync(target, backup);

const content = `import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'داشبورد',
    items: [
      { title: 'داشبورد مدیریت', path: '/admin/dashboard', desc: 'آمار کلی، KPI و وضعیت فروش', icon: '🏠' },
      { title: 'مرکز مسیرها', path: '/admin/quick-links', desc: 'همین صفحه؛ دسترسی سریع به همه بخش‌ها', icon: '🧭', badge: 'اصلی' },
      { title: 'مدیریت مسیرها', path: '/admin/route-registry', desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل', icon: '📍', badge: 'جدید' },
      { title: 'تست سلامت مسیرها', path: '/admin/navigation-audit', desc: 'بررسی route ها و لینک‌های پنل', icon: '🛠' },
      { title: 'سلامت سیستم', path: '/admin/system-health', desc: 'بررسی وضعیت کلی پروژه و اتصال‌ها', icon: '✅' },
      { title: 'گزارش خطاها', path: '/admin/bug-reports', desc: 'مشاهده خطاها و گزارش باگ‌ها', icon: '🐞' },
    ],
  },
  {
    title: 'فروشگاه',
    items: [
      { title: 'محصولات', path: '/admin/products', desc: 'مدیریت محصولات، قیمت و موجودی', icon: '🛢' },
      { title: 'دسته‌بندی‌ها', path: '/admin/categories', desc: 'مدیریت دسته‌بندی‌ها', icon: '🗂' },
      { title: 'برندها', path: '/admin/brands', desc: 'مدیریت برندها', icon: '🏷' },
      { title: 'پکیج‌ها', path: '/admin/packages', desc: 'مدیریت پکیج‌های آماده', icon: '🎁' },
      { title: 'محتوای صفحه اصلی', path: '/admin/home-content', desc: 'بنرها و سکشن‌های صفحه اصلی', icon: '🏪' },
      { title: 'خودروها', path: '/admin/cars', desc: 'مدیریت خودروها و سازگاری‌ها', icon: '🚗' },
      { title: 'پیشنهادها', path: '/admin/recommendations', desc: 'پیشنهاد محصولات مناسب خودرو', icon: '✨' },
      { title: 'اصالت کالا', path: '/admin/authenticity', desc: 'بررسی و مدیریت اصالت کالا', icon: '🔎' },
      { title: 'مرجوعی / بررسی کالا', path: '/admin/returns', desc: 'درخواست‌های مرجوعی و بررسی کالا', icon: '↩️' },
    ],
  },
  {
    title: 'سفارش و عملیات',
    items: [
      { title: 'سفارش‌ها', path: '/admin/orders', desc: 'مدیریت سفارش‌ها و وضعیت‌ها', icon: '🧾' },
      { title: 'درخواست‌های سرویس', path: '/admin/service-requests', desc: 'درخواست‌های سرویس در محل', icon: '🔧' },
      { title: 'مرکز اعزام', path: '/admin/dispatch', desc: 'تخصیص سرویس‌کار و ناوگان', icon: '🚚' },
      { title: 'ناوگان سرویس', path: '/admin/service-fleet', desc: 'مدیریت خودروهای سرویس', icon: '🚐' },
      { title: 'شعب', path: '/admin/branches', desc: 'مدیریت شعب و محدوده‌ها', icon: '🏬' },
    ],
  },
  {
    title: 'مشتریان',
    items: [
      { title: 'مشتریان', path: '/admin/customers', desc: 'لیست مشتریان', icon: '👥' },
      { title: 'CRM مشتریان', path: '/admin/customers-crm', desc: 'پروفایل کامل و ارتباط با مشتری', icon: '💬' },
      { title: 'باشگاه مشتریان', path: '/admin/loyalty', desc: 'امتیاز، کیف پول و کد معرفی', icon: '⭐' },
      { title: 'تیکت پشتیبانی', path: '/admin/support', desc: 'پشتیبانی مشتریان', icon: '🎧' },
      { title: 'اعلان‌ها', path: '/admin/notifications', desc: 'Notification Center', icon: '🔔' },
      { title: 'لاگ پیامک‌ها', path: '/admin/sms-logs', desc: 'گزارش پیامک‌ها', icon: '📨' },
    ],
  },
  {
    title: 'انبار و خرید',
    items: [
      { title: 'انبار', path: '/admin/inventory', desc: 'کنترل موجودی دستی و هشدار کمبود', icon: '📦' },
      { title: 'تأمین‌کنندگان', path: '/admin/suppliers', desc: 'فعلاً برای اتصال آینده حسابداری', icon: '🏭' },
      { title: 'خرید کالا', path: '/admin/purchases', desc: 'فعلاً برای اتصال آینده حسابداری', icon: '🛒' },
    ],
  },
  {
    title: 'مالی',
    items: [
      { title: 'مالی و سود', path: '/admin/finance', desc: 'گزارش فروش و سود', icon: '💰' },
      { title: 'تنظیمات پرداخت', path: '/admin/payment-settings', desc: 'درگاه و تنظیمات پرداخت', icon: '💳' },
      { title: 'گزارش سرمایه‌گذار', path: '/admin/investor-report', desc: 'گزارش رشد و عملکرد', icon: '📈' },
    ],
  },
  {
    title: 'بازاریابی و محتوا',
    items: [
      { title: 'تخفیف‌ها و کمپین‌ها', path: '/admin/discounts', desc: 'مدیریت کدهای تخفیف، کمپین‌ها و فروش ویژه', icon: '🎯' },
      { title: 'مقالات / بلاگ', path: '/admin/blog', desc: 'مدیریت محتوای آموزشی و سئو', icon: '📝' },
      { title: 'سئو و متاتگ', path: '/admin/seo', desc: 'تنظیم متاتگ‌ها', icon: '🌐' },
      { title: 'نظرات', path: '/admin/reviews', desc: 'مدیریت نظرات کاربران', icon: '💭' },
      { title: 'فروش هوشمند', path: '/admin/smart-sales', desc: 'Upsell و پیشنهادهای تکمیلی', icon: '🧠' },
    ],
  },
  {
    title: 'سیستم',
    items: [
      { title: 'تنظیمات', path: '/admin/settings', desc: 'تنظیمات مرکزی سیستم', icon: '⚙️' },
      { title: 'ظاهر سایت', path: '/admin/appearance', desc: 'تم‌ها، فونت و حالت روشن/تاریک', icon: '🎨' },
      { title: 'کارکنان', path: '/admin/staff', desc: 'مدیریت کارکنان', icon: '👤' },
      { title: 'نقش‌ها', path: '/admin/roles', desc: 'سطح دسترسی‌ها', icon: '🔐' },
      { title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs', desc: 'Audit Logs', icon: '📜' },
    ],
  },
];

export default function AdminQuickLinks() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black md:text-3xl">مرکز مسیرهای پنل مدیریت Carrtell</h1>
              <p className="mt-2 text-sm text-slate-300">همه مسیرهای ساخته‌شده پروژه در این صفحه دسته‌بندی شده‌اند.</p>
            </div>
            <Link to="/admin/route-registry" className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300">
              📍 ورود به Route Registry
            </Link>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="mb-5 text-xl font-black text-amber-300">{section.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group rounded-2xl border border-white/10 bg-slate-950/80 p-5 transition hover:-translate-y-1 hover:border-amber-300/50 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-white group-hover:text-amber-200">
                        <span className="ml-2">{item.icon}</span>{item.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-400">{item.desc}</div>
                      <div className="mt-3 text-xs text-sky-300">{item.path}</div>
                    </div>
                    {item.badge ? <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">{item.badge}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(target, content, 'utf8');
console.log('✅ AdminQuickLinks fixed:', path.relative(root, target));
console.log('✅ Backup:', path.relative(root, backup));
console.log('حالا Vite را ریستارت کن و /admin/quick-links را باز کن.');
