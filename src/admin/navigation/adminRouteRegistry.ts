export type AdminRouteItem = {
  title: string;
  path: string;
  description?: string;
  badge?: string;
  audience?: 'admin' | 'customer' | 'driver' | 'public';
};

export type AdminRouteGroup = {
  id: string;
  title: string;
  icon: string;
  items: AdminRouteItem[];
};

export const adminRouteRegistry: AdminRouteGroup[] = [
  {
    id: 'dashboard',
    title: 'داشبورد و سلامت',
    icon: '🏠',
    items: [
      { title: 'داشبورد مدیریت', path: '/admin/dashboard', description: 'آمار کلی و KPI' },
      { title: 'مرکز مسیرها', path: '/admin/quick-links', description: 'دسترسی سریع به همه صفحات' },
      { title: 'تست سلامت مسیرها', path: '/admin/navigation-audit', description: 'بررسی route ها و لینک‌ها' },
      { title: 'وضعیت سیستم', path: '/admin/system-health', description: 'تست اتصال‌ها و جداول' },
      { title: 'گزارش خطاها', path: '/admin/bug-reports', description: 'مشکلات ثبت‌شده کاربران' },
    ],
  },
  {
    id: 'shop',
    title: 'فروشگاه',
    icon: '🛒',
    items: [
      { title: 'محصولات', path: '/admin/products' },
      { title: 'دسته‌بندی‌ها', path: '/admin/categories' },
      { title: 'برندها', path: '/admin/brands' },
      { title: 'پکیج‌ها', path: '/admin/packages' },
      { title: 'محتوای صفحه اصلی', path: '/admin/home-content' },
      { title: 'کمپین‌ها', path: '/admin/campaigns', description: 'فروش ویژه و کمپین صفحه اصلی' },
      { title: 'کدهای تخفیف', path: '/admin/discounts' },
      { title: 'فروش هوشمند', path: '/admin/smart-sales' },
      { title: 'پیشنهادهای خودرو', path: '/admin/recommendations' },
      { title: 'اصالت کالا', path: '/admin/authenticity' },
      { title: 'مرجوعی/بررسی کالا', path: '/admin/returns' },
    ],
  },
  {
    id: 'orders',
    title: 'سفارش و عملیات',
    icon: '🚚',
    items: [
      { title: 'سفارش‌ها', path: '/admin/orders' },
      { title: 'درخواست‌های سرویس', path: '/admin/service-requests' },
      { title: 'مرکز اعزام Dispatch', path: '/admin/dispatch' },
      { title: 'شعب', path: '/admin/branches' },
      { title: 'سرویس‌کارها', path: '/admin/technicians' },
      { title: 'ناوگان سرویس', path: '/admin/service-fleet' },
    ],
  },
  {
    id: 'customers',
    title: 'مشتریان و ارتباطات',
    icon: '👥',
    items: [
      { title: 'مشتریان', path: '/admin/customers' },
      { title: 'CRM مشتریان', path: '/admin/customers-crm' },
      { title: 'باشگاه مشتریان', path: '/admin/loyalty' },
      { title: 'تیکت پشتیبانی', path: '/admin/support' },
      { title: 'اعلان‌ها', path: '/admin/notifications' },
      { title: 'لاگ پیامک‌ها', path: '/admin/sms-logs' },
    ],
  },
  {
    id: 'inventory',
    title: 'انبار و تأمین',
    icon: '📦',
    items: [
      { title: 'انبار', path: '/admin/inventory' },
      { title: 'تأمین‌کنندگان', path: '/admin/suppliers' },
      { title: 'خرید کالا', path: '/admin/purchases' },
    ],
  },
  {
    id: 'finance',
    title: 'مالی و گزارش‌ها',
    icon: '💰',
    items: [
      { title: 'مالی و سود', path: '/admin/finance' },
      { title: 'گزارش سرمایه‌گذار', path: '/admin/investor-report' },
      { title: 'تنظیمات پرداخت', path: '/admin/payment-settings' },
    ],
  },
  {
    id: 'content',
    title: 'محتوا و سئو',
    icon: '📢',
    items: [
      { title: 'بلاگ', path: '/admin/blog' },
      { title: 'SEO و متاتگ‌ها', path: '/admin/seo' },
    ],
  },
  {
    id: 'staff',
    title: 'کارکنان و دسترسی',
    icon: '👤',
    items: [
      { title: 'کارکنان', path: '/admin/staff' },
      { title: 'نقش‌ها و دسترسی‌ها', path: '/admin/roles' },
      { title: 'کاربران و نقش‌ها', path: '/admin/users' },
    ],
  },
  {
    id: 'system',
    title: 'سیستم و تنظیمات',
    icon: '⚙️',
    items: [
      { title: 'تنظیمات سایت', path: '/admin/settings' },
      { title: 'ظاهر سایت', path: '/admin/appearance' },
      { title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs' },
      { title: 'Diagnostics', path: '/admin/diagnostics' },
    ],
  },
  {
    id: 'front',
    title: 'مسیرهای عمومی / کاربر / راننده',
    icon: '🌐',
    items: [
      { title: 'فروشگاه', path: '/', audience: 'public' },
      { title: 'بلاگ', path: '/blog', audience: 'public' },
      { title: 'مناسب خودروی من', path: '/my-car/products', audience: 'customer' },
      { title: 'کیف پول مشتری', path: '/profile/wallet', audience: 'customer' },
      { title: 'پشتیبانی مشتری', path: '/profile/support', audience: 'customer' },
      { title: 'مرجوعی مشتری', path: '/profile/returns', audience: 'customer' },
      { title: 'ثبت گزارش خطا', path: '/report-bug', audience: 'public' },
      { title: 'پنل راننده', path: '/driver/dashboard', audience: 'driver' },
      { title: 'مأموریت تست راننده', path: '/driver/jobs/test', audience: 'driver' },
      { title: 'اعلان‌های من', path: '/notifications', audience: 'customer' },
      { title: 'بررسی اصالت کالا', path: '/authenticity', audience: 'public' },
    ],
  },
];

export const flatAdminRoutes = adminRouteRegistry.flatMap(group =>
  group.items.map(item => ({ ...item, groupId: group.id, groupTitle: group.title, groupIcon: group.icon }))
);
