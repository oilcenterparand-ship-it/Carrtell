export type AdminNavGroup =
  | 'dashboard'
  | 'sales'
  | 'operations'
  | 'catalog'
  | 'customers'
  | 'finance'
  | 'marketing'
  | 'content'
  | 'system'
  | 'public'
  | 'driver';

export type AdminNavItem = {
  title: string;
  path: string;
  group: AdminNavGroup;
  description: string;
  badge?: string;
  status?: 'active' | 'optional' | 'test';
};

export const adminNavGroups: Record<AdminNavGroup, string> = {
  dashboard: 'داشبورد و کنترل',
  sales: 'فروش و سفارش‌ها',
  operations: 'عملیات سرویس در محل',
  catalog: 'کاتالوگ و فروشگاه',
  customers: 'مشتریان و ارتباطات',
  finance: 'مالی، انبار و تأمین',
  marketing: 'مارکتینگ و وفاداری',
  content: 'محتوا و سئو',
  system: 'تنظیمات و سلامت سیستم',
  public: 'مسیرهای عمومی مهم',
  driver: 'مسیرهای سرویس‌کار',
};

export const adminNavigationItems: AdminNavItem[] = [
  { title: 'مرکز مسیرها', path: '/admin/quick-links', group: 'dashboard', description: 'همه مسیرهای مدیریتی، مشتری، سرویس‌کار و عمومی در یک صفحه', badge: 'اصلی' },
  { title: 'داشبورد مدیریت', path: '/admin/dashboard', group: 'dashboard', description: 'KPI، آمار فروش، هشدارها و وضعیت کلی کارتل' },
  { title: 'Diagnostics', path: '/admin/diagnostics', group: 'dashboard', description: 'بررسی اتصال Supabase و جدول‌های اصلی' },
  { title: 'سلامت سیستم', path: '/admin/system-health', group: 'dashboard', description: 'تست سلامت مسیرها و سرویس‌های سایت' },
  { title: 'گزارش باگ‌ها', path: '/admin/bug-reports', group: 'dashboard', description: 'مشاهده خطاها و گزارش‌های ارسال‌شده از سایت' },
  { title: 'ممیزی مسیرها', path: '/admin/navigation-audit', group: 'dashboard', description: 'بررسی اینکه همه مسیرهای ساخته‌شده در مرکز مسیرها ثبت شده‌اند', badge: 'جدید' },

  { title: 'سفارش‌ها', path: '/admin/orders', group: 'sales', description: 'مدیریت سفارش‌ها، وضعیت پرداخت و گردش سفارش' },
  { title: 'پرداخت‌ها', path: '/admin/payment-settings', group: 'sales', description: 'تنظیمات درگاه، زرین‌پال و پرداخت آزمایشی' },
  { title: 'تنظیمات پرداخت', path: '/admin/payment-settings', group: 'sales', description: 'Merchant ID، حالت تست/واقعی و تنظیمات پرداخت' },

  { title: 'مرکز اعزام', path: '/admin/dispatch', group: 'operations', description: 'اختصاص سرویس‌کار، وضعیت مأموریت و عملیات سرویس در محل' },
  { title: 'درخواست‌های سرویس', path: '/admin/service-requests', group: 'operations', description: 'درخواست‌های رزرو سرویس در محل' },
  { title: 'تنظیمات رزرو هوشمند', path: '/admin/service-booking-settings', group: 'operations', description: 'خدمات، ظرفیت بازه‌ها و قیمت‌گذاری داینامیک' },
  { title: 'خودروهای سرویس', path: '/admin/service-fleet', group: 'operations', description: 'ناوگان سرویس، پلاک، راننده، وضعیت و موجودی خودرو' },
  { title: 'شعب', path: '/admin/branches', group: 'operations', description: 'مدیریت شعب، شهر، محدوده فعالیت و مدیر شعبه' },

  { title: 'محصولات', path: '/admin/products', group: 'catalog', description: 'مدیریت محصول، قیمت، موجودی، تصاویر WebP و واترمارک' },
  { title: 'دسته‌بندی‌ها', path: '/admin/categories', group: 'catalog', description: 'دسته‌بندی‌های داینامیک فروشگاه' },
  { title: 'برندها', path: '/admin/brands', group: 'catalog', description: 'برندهای محصولات و لوگوها' },
  { title: 'خودروها', path: '/admin/cars', group: 'catalog', description: 'تعریف خودرو، مدل، موتور و گیربکس' },
  { title: 'پکیج‌ها', path: '/admin/packages', group: 'catalog', description: 'پکیج‌های آماده مدیر؛ بدون پکیج هوشمند خودکار' },
  { title: 'محتوای صفحه اصلی', path: '/admin/home-content', group: 'catalog', description: 'بنرها، سکشن‌های صفحه اصلی، برندها و محتوا' },
  { title: 'پیشنهاد محصولات', path: '/admin/recommendations', group: 'catalog', description: 'تنظیم اولویت پیشنهاد محصول براساس خودرو و موجودی' },

  { title: 'مشتریان', path: '/admin/customers', group: 'customers', description: 'لیست مشتریان و خروجی Excel شماره تماس‌ها' },
  { title: 'CRM مشتریان', path: '/admin/customers-crm', group: 'customers', description: 'یادداشت مدیریتی، برچسب مشتری، Timeline و کمپین مشتری' },
  { title: 'نظرات مشتریان', path: '/admin/reviews', group: 'customers', description: 'تایید، رد و مدیریت نظرات سایت' },
  { title: 'تیکت‌های پشتیبانی', path: '/admin/support', group: 'customers', description: 'مدیریت تیکت مشتریان و پاسخ پشتیبانی' },
  { title: 'اعلان‌ها', path: '/admin/notifications', group: 'customers', description: 'مدیریت Notification Center و اعلان‌های داخلی' },
  { title: 'مرجوعی‌ها', path: '/admin/returns', group: 'customers', description: 'درخواست مرجوعی و بررسی کالا بدون بخش وارانتی' },
  { title: 'اصالت کالا', path: '/admin/authenticity', group: 'customers', description: 'مدیریت کد رهگیری و بررسی اصالت کالا' },

  { title: 'مالی و KPI', path: '/admin/finance', group: 'finance', description: 'فروش، سود، هزینه‌ها، خروجی Excel و گزارش مالی' },
  { title: 'انبارداری', path: '/admin/inventory', group: 'finance', description: 'موجودی، هشدار کمبود، گردش کالا و اصلاح موجودی' },
  { title: 'تأمین‌کنندگان', path: '/admin/suppliers', group: 'finance', description: 'ثبت تأمین‌کننده، رابط فروش و وضعیت همکاری' },
  { title: 'خرید کالا', path: '/admin/purchases', group: 'finance', description: 'ثبت فاکتور خرید و افزایش موجودی انبار' },
  { title: 'گزارش سرمایه‌گذار', path: '/admin/investor-report', group: 'finance', description: 'گزارش عملکرد، درآمد خودرو سرویس و خروجی سرمایه‌گذار' },

  { title: 'باشگاه مشتریان', path: '/admin/loyalty', group: 'marketing', description: 'امتیاز، سطح مشتری، کیف پول و قوانین وفاداری' },
  { title: 'کد تخفیف و کمپین', path: '/admin/discounts', group: 'marketing', description: 'کد تخفیف، محدودیت استفاده، کمپین و اتصال به Checkout' },
  { title: 'لاگ پیامک‌ها', path: '/admin/sms-logs', group: 'marketing', description: 'مشاهده پیامک‌ها، خطاها، ارسال مجدد و کپی متن' },

  { title: 'بلاگ و مقالات', path: '/admin/blog', group: 'content', description: 'مدیریت مقالات آموزشی، دسته‌بندی، تصویر و انتشار' },
  { title: 'SEO و متاتگ‌ها', path: '/admin/seo', group: 'content', description: 'مدیریت عنوان، توضیحات و داده‌های SEO صفحات' },

  { title: 'تنظیمات مرکزی', path: '/admin/settings', group: 'system', description: 'تنظیمات سایت، سفارش، پیامک، سرویس، نقشه و برند' },
  { title: 'ظاهر سایت', path: '/admin/appearance', group: 'system', description: 'تم‌های آماده، فونت، حالت روشن/تاریک و Preview' },
  { title: 'کارکنان', path: '/admin/staff', group: 'system', description: 'مدیریت کارکنان، وضعیت فعال/غیرفعال و شعبه' },
  { title: 'نقش‌ها و دسترسی‌ها', path: '/admin/roles', group: 'system', description: 'مدیریت نقش‌ها، سطح دسترسی و پرمیشن‌ها' },
  { title: 'کاربران و نقش‌ها', path: '/admin/users', group: 'system', description: 'تغییر نقش customer / driver / admin' },
  { title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs', group: 'system', description: 'لاگ تغییرات مدیران، کارکنان و عملیات حساس' },

  { title: 'فروشگاه', path: '/shop', group: 'public', description: 'صفحه فروشگاه عمومی' },
  { title: 'صفحه اصلی', path: '/', group: 'public', description: 'صفحه اصلی فروشگاهی Carrtell' },
  { title: 'پکیج‌ها', path: '/packages', group: 'public', description: 'پکیج‌های آماده مدیر برای مشتری' },
  { title: 'رزرو سرویس', path: '/book', group: 'public', description: 'رزرو سرویس در محل براساس خودرو و کیلومتر' },
  { title: 'محصولات مناسب خودروی من', path: '/my-car/products', group: 'public', description: 'پیشنهاد محصول براساس خودروی انتخابی' },
  { title: 'بلاگ', path: '/blog', group: 'public', description: 'مقالات آموزشی Carrtell' },
  { title: 'اصالت کالا', path: '/authenticity', group: 'public', description: 'بررسی عمومی اصالت کالا' },
  { title: 'گزارش باگ', path: '/report-bug', group: 'public', description: 'ارسال گزارش مشکل از سمت کاربر' },

  { title: 'پروفایل', path: '/profile', group: 'public', description: 'پروفایل مشتری' },
  { title: 'کیف پول', path: '/profile/wallet', group: 'public', description: 'کیف پول و امتیاز مشتری' },
  { title: 'پشتیبانی مشتری', path: '/profile/support', group: 'public', description: 'تیکت پشتیبانی مشتری' },
  { title: 'مرجوعی مشتری', path: '/profile/returns', group: 'public', description: 'ثبت درخواست مرجوعی و بررسی کالا' },
  { title: 'اعلان‌های مشتری', path: '/notifications', group: 'public', description: 'Notification Center کاربر' },

  { title: 'پنل سرویس‌کار', path: '/driver', group: 'driver', description: 'پنل قدیمی/اصلی سرویس‌کار' },
  { title: 'داشبورد سرویس‌کار', path: '/driver/dashboard', group: 'driver', description: 'سرویس‌های امروز، درآمد، امتیاز و مأموریت‌ها' },
  { title: 'مأموریت تست سرویس‌کار', path: '/driver/jobs/test', group: 'driver', description: 'تست UI مأموریت سرویس‌کار بدون دیتابیس', status: 'test' },
];

export const adminNavigationByGroup = adminNavigationItems.reduce<Record<AdminNavGroup, AdminNavItem[]>>((acc, item) => {
  acc[item.group] = acc[item.group] || [];
  acc[item.group].push(item);
  return acc;
}, {} as Record<AdminNavGroup, AdminNavItem[]>);
