export type AdminRouteItem = {
  path: string;
  title: string;
  group: string;
  description?: string;
  audience?: 'admin' | 'customer' | 'driver' | 'public';
  status?: 'active' | 'hidden' | 'review';
};

export const adminRouteRegistry: AdminRouteItem[] = [
  { path: '/admin/dashboard', title: 'داشبورد مدیریت', group: 'داشبورد', audience: 'admin', status: 'active' },
  { path: '/admin/quick-links', title: 'مرکز مسیرها', group: 'داشبورد', audience: 'admin', status: 'active' },
  { path: '/admin/navigation-audit', title: 'تست سلامت مسیرها', group: 'سلامت سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/system-health', title: 'وضعیت سیستم', group: 'سلامت سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/bug-reports', title: 'گزارش خطاها', group: 'سلامت سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/products', title: 'محصولات', group: 'فروشگاه', audience: 'admin', status: 'active' },
  { path: '/admin/categories', title: 'دسته‌بندی‌ها', group: 'فروشگاه', audience: 'admin', status: 'active' },
  { path: '/admin/brands', title: 'برندها', group: 'فروشگاه', audience: 'admin', status: 'active' },
  { path: '/admin/packages', title: 'پکیج‌ها', group: 'فروشگاه', audience: 'admin', status: 'active' },
  { path: '/admin/orders', title: 'سفارش‌ها', group: 'فروشگاه', audience: 'admin', status: 'active' },
  { path: '/admin/discounts', title: 'تخفیف‌ها', group: 'بازاریابی', audience: 'admin', status: 'active' },
  { path: '/admin/smart-sales', title: 'فروش هوشمند', group: 'بازاریابی', audience: 'admin', status: 'active' },
  { path: '/admin/loyalty', title: 'باشگاه مشتریان', group: 'بازاریابی', audience: 'admin', status: 'active' },
  { path: '/admin/dispatch', title: 'مرکز اعزام', group: 'سرویس در محل', audience: 'admin', status: 'active' },
  { path: '/admin/technicians', title: 'سرویس‌کارها', group: 'سرویس در محل', audience: 'admin', status: 'active' },
  { path: '/admin/service-fleet', title: 'ناوگان سرویس', group: 'سرویس در محل', audience: 'admin', status: 'active' },
  { path: '/admin/branches', title: 'شعب', group: 'سرویس در محل', audience: 'admin', status: 'active' },
  { path: '/admin/inventory', title: 'انبار', group: 'انبار', audience: 'admin', status: 'active' },
  { path: '/admin/suppliers', title: 'تأمین‌کنندگان', group: 'انبار', audience: 'admin', status: 'active' },
  { path: '/admin/purchases', title: 'خرید کالا', group: 'انبار', audience: 'admin', status: 'active' },
  { path: '/admin/finance', title: 'مالی', group: 'مالی', audience: 'admin', status: 'active' },
  { path: '/admin/investor-report', title: 'گزارش سرمایه‌گذار', group: 'مالی', audience: 'admin', status: 'active' },
  { path: '/admin/customers', title: 'مشتریان', group: 'مشتریان', audience: 'admin', status: 'active' },
  { path: '/admin/customers-crm', title: 'CRM مشتریان', group: 'مشتریان', audience: 'admin', status: 'active' },
  { path: '/admin/support', title: 'تیکت‌ها', group: 'مشتریان', audience: 'admin', status: 'active' },
  { path: '/admin/notifications', title: 'اعلان‌ها', group: 'مشتریان', audience: 'admin', status: 'active' },
  { path: '/admin/blog', title: 'بلاگ', group: 'محتوا', audience: 'admin', status: 'active' },
  { path: '/admin/seo', title: 'سئو', group: 'محتوا', audience: 'admin', status: 'active' },
  { path: '/admin/settings', title: 'تنظیمات', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/appearance', title: 'ظاهر سایت', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/staff', title: 'کارکنان', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/roles', title: 'نقش‌ها', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/audit-logs', title: 'گزارش فعالیت‌ها', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/authenticity', title: 'اصالت کالا', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/admin/returns', title: 'مرجوعی/بررسی کالا', group: 'سیستم', audience: 'admin', status: 'active' },
  { path: '/profile/wallet', title: 'کیف پول مشتری', group: 'مسیرهای مشتری', audience: 'customer', status: 'active' },
  { path: '/profile/support', title: 'پشتیبانی مشتری', group: 'مسیرهای مشتری', audience: 'customer', status: 'active' },
  { path: '/profile/returns', title: 'مرجوعی مشتری', group: 'مسیرهای مشتری', audience: 'customer', status: 'active' },
  { path: '/driver/dashboard', title: 'داشبورد سرویس‌کار', group: 'مسیرهای سرویس‌کار', audience: 'driver', status: 'active' },
  { path: '/driver/jobs/test', title: 'مأموریت تست سرویس‌کار', group: 'مسیرهای سرویس‌کار', audience: 'driver', status: 'active' },
  { path: '/blog', title: 'بلاگ عمومی', group: 'مسیرهای عمومی', audience: 'public', status: 'active' },
  { path: '/notifications', title: 'اعلان‌های کاربر', group: 'مسیرهای عمومی', audience: 'public', status: 'active' },
  { path: '/report-bug', title: 'ثبت گزارش خطا', group: 'مسیرهای عمومی', audience: 'public', status: 'active' },
  { path: '/authenticity', title: 'بررسی اصالت کالا', group: 'مسیرهای عمومی', audience: 'public', status: 'active' }
];

export const routeGroups = Array.from(new Set(adminRouteRegistry.map((item) => item.group)));
