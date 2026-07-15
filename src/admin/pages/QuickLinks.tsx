import { Link } from 'react-router-dom';

const groups = [
  {
    title: 'داشبورد',
    items: [
      { title: 'داشبورد مدیریت', path: '/admin/dashboard', desc: 'آمار کلی، KPI و وضعیت فروش', icon: '📊' },
      { title: 'مرکز مسیرها', path: '/admin/quick-links', desc: 'همین صفحه؛ دسترسی سریع به همه بخش‌ها', icon: '🧭', badge: 'اصلی' },
      { title: 'مدیریت مسیرها / Route Registry', path: '/admin/route-registry', desc: 'مشاهده، بررسی و مدیریت همه مسیرهای ثبت‌شده پنل', icon: '📍', badge: 'جدید' },
      { title: 'تست سلامت مسیرها', path: '/admin/navigation-audit', desc: 'بررسی Route ها و لینک‌های پنل', icon: '🛠' },
      { title: 'سلامت سیستم', path: '/admin/system-health', desc: 'وضعیت کلی Supabase، جدول‌ها و سرویس‌ها', icon: '✅' },
      { title: 'گزارش خطاها', path: '/admin/bug-reports', desc: 'مشاهده گزارش خطاهای ثبت‌شده کاربران', icon: '🐞' },
    ],
  },
  {
    title: 'فروشگاه',
    items: [
      { title: 'محصولات', path: '/admin/products', desc: 'مدیریت محصولات، قیمت، موجودی و تصاویر', icon: '🛢' },
      { title: 'دسته‌بندی‌ها', path: '/admin/categories', desc: 'مدیریت دسته‌بندی‌های فروشگاه', icon: '🗂' },
      { title: 'برندها', path: '/admin/brands', desc: 'مدیریت برندها و لوگوها', icon: '🏷' },
      { title: 'پکیج‌ها', path: '/admin/packages', desc: 'پکیج‌های آماده مدیر', icon: '🎁' },
      { title: 'تخفیف‌ها', path: '/admin/discounts', desc: 'کد تخفیف و قوانین کمپین', icon: '🏷️' },
      { title: 'فروش هوشمند', path: '/admin/smart-sales', desc: 'Upsell، مکمل‌ها و پیشنهادهای سازگار', icon: '🧠' },
    ],
  },
  {
    title: 'عملیات و سرویس در محل',
    items: [
      { title: 'سفارش‌ها', path: '/admin/orders', desc: 'مدیریت سفارش‌ها و وضعیت‌ها', icon: '🧾' },
      { title: 'مرکز اعزام', path: '/admin/dispatch', desc: 'تخصیص سرویس‌کار و پیگیری عملیات', icon: '🚦' },
      { title: 'شعب', path: '/admin/branches', desc: 'مدیریت شعب و محدوده‌ها', icon: '🏬' },
      { title: 'ناوگان سرویس', path: '/admin/service-fleet', desc: 'مدیریت خودروهای سرویس در محل', icon: '🚚' },
      { title: 'خودروها', path: '/admin/cars', desc: 'تعریف خودروها و مشخصات فنی', icon: '🚗' },
    ],
  },
  {
    title: 'مشتریان و ارتباطات',
    items: [
      { title: 'CRM مشتریان', path: '/admin/customers-crm', desc: 'پرونده مشتری، برچسب و یادداشت', icon: '👥' },
      { title: 'باشگاه مشتریان', path: '/admin/loyalty', desc: 'امتیاز، کیف پول و سطح مشتری', icon: '⭐' },
      { title: 'پشتیبانی', path: '/admin/support', desc: 'تیکت‌های مشتریان', icon: '🎧' },
      { title: 'اعلان‌ها', path: '/admin/notifications', desc: 'اعلان‌های داخلی سایت', icon: '🔔' },
      { title: 'مرجوعی‌ها', path: '/admin/returns', desc: 'درخواست‌های بررسی و مرجوعی کالا', icon: '↩️' },
      { title: 'اصالت کالا', path: '/admin/authenticity', desc: 'کد رهگیری و بررسی اصالت کالا', icon: '✅' },
    ],
  },
  {
    title: 'انبار، خرید و مالی',
    items: [
      { title: 'انبار', path: '/admin/inventory', desc: 'موجودی و هشدار کمبود', icon: '📦' },
      { title: 'تأمین‌کنندگان', path: '/admin/suppliers', desc: 'مدیریت پخش‌کننده‌ها', icon: '🏭' },
      { title: 'خریدها', path: '/admin/purchases', desc: 'ثبت خرید کالا و افزایش موجودی', icon: '🧾' },
      { title: 'مالی', path: '/admin/finance', desc: 'فروش، هزینه و سود', icon: '💰' },
      { title: 'گزارش سرمایه‌گذار', path: '/admin/investor-report', desc: 'گزارش عملکرد و بازگشت سرمایه', icon: '📈' },
    ],
  },
  {
    title: 'محتوا و بازاریابی',
    items: [
      { title: 'محتوای صفحه اصلی', path: '/admin/home-content', desc: 'بنر، استوری و سکشن‌های صفحه اصلی', icon: '🏠' },
      { title: 'بلاگ', path: '/admin/blog', desc: 'مقالات و آموزش‌ها', icon: '📝' },
      { title: 'SEO', path: '/admin/seo', desc: 'متاتگ‌ها و تنظیمات سئو', icon: '🔎' },
    ],
  },
  {
    title: 'سیستم',
    items: [
      { title: 'تنظیمات', path: '/admin/settings', desc: 'تنظیمات مرکزی سایت', icon: '⚙️' },
      { title: 'ظاهر سایت', path: '/admin/appearance', desc: 'تم، فونت و حالت روشن/تاریک', icon: '🎨' },
      { title: 'کارکنان', path: '/admin/staff', desc: 'مدیریت کارکنان', icon: '👤' },
      { title: 'نقش‌ها', path: '/admin/roles', desc: 'مدیریت نقش‌ها و دسترسی‌ها', icon: '🔐' },
      { title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs', desc: 'Audit Log تغییرات پنل', icon: '📋' },
      { title: 'Diagnostics', path: '/admin/diagnostics', desc: 'بررسی اتصال Supabase و جدول‌ها', icon: '🩺' },
    ],
  },
];

export default function QuickLinks() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-black md:text-3xl">مرکز مسیرهای پنل مدیریت Carrtell</h1>
              <p className="mt-2 text-sm text-slate-300">همه مسیرهای ساخته‌شده پروژه در این صفحه دسته‌بندی شده‌اند.</p>
            </div>
            <Link
              to="/admin/route-registry"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300"
            >
              📍 ورود به Route Registry
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-amber-200">📍 مدیریت مسیرها / Route Registry</h2>
              <p className="mt-1 text-sm text-amber-100/80">برای مشاهده و بررسی همه route های ثبت‌شده پنل مدیریت از این دکمه استفاده کن.</p>
            </div>
            <Link to="/admin/route-registry" className="rounded-2xl bg-amber-400 px-5 py-3 text-center font-black text-slate-950 hover:bg-amber-300">
              ورود به مدیریت مسیرها
            </Link>
          </div>
        </div>

        {groups.map((group) => (
          <section key={group.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="mb-5 text-xl font-black text-amber-300">{group.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-amber-400/50 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white"><span className="ml-2">{item.icon}</span>{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                      <p className="mt-3 text-xs text-sky-300 ltr:text-left">{item.path}</p>
                    </div>
                    {'badge' in item && item.badge ? <span className="rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950">{item.badge}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
