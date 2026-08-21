import { useMemo } from 'react';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { permissionForAdminPath } from '../auth/adminPermissions';

export type AdminRouteGroup =
  | 'today'
  | 'service'
  | 'commerce'
  | 'customers'
  | 'growth'
  | 'finance'
  | 'team'
  | 'system';

export interface AdminRoute {
  path: string;
  label: string;
  description?: string;
  group: AdminRouteGroup;
  icon:
    | 'home'
    | 'homeContent'
    | 'box'
    | 'orders'
    | 'service'
    | 'reviews'
    | 'sms'
    | 'brand'
    | 'package'
    | 'category'
    | 'oil'
    | 'car'
    | 'users'
    | 'settings'
    | 'payment'
    | 'inventory'
    | 'support'
    | 'discount'
    | 'roles'
    | 'audit';
  badge?: string;
}

export const ADMIN_ROUTE_GROUP_LABELS: Record<AdminRouteGroup, string> = {
  today: 'کار امروز',
  service: 'عملیات سرویس',
  commerce: 'فروشگاه و کالا',
  customers: 'مشتریان',
  growth: 'بازاریابی و محتوا',
  finance: 'مالی و پرداخت',
  team: 'تیم و دسترسی‌ها',
  system: 'تنظیمات و سیستم',
};

const routes: AdminRoute[] = [
  { path: '/admin/dashboard', label: 'داشبورد', description: 'کارهای مهم امروز و هشدارهای مدیریتی', group: 'today', icon: 'home' },
  { path: '/admin/dispatch', label: 'صف تخصیص سرویس‌کار', description: 'سفارش‌های پرداخت‌شده و آماده اعزام', group: 'today', icon: 'service', badge: 'روزانه' },
  { path: '/admin/service-operations', label: 'روند مأموریت‌ها', description: 'مشاهده لحظه‌ای وضعیت اجرای سرویس‌ها', group: 'today', icon: 'car' },
  { path: '/admin/orders', label: 'همه سفارش‌ها', description: 'سفارش فروشگاهی و وضعیت پرداخت', group: 'today', icon: 'orders' },
  { path: '/admin/phone-order', label: 'سفارش تلفنی', description: 'ثبت سریع سفارش توسط اپراتور', group: 'today', icon: 'orders' },

  { path: '/admin/technicians', label: 'سرویس‌کاران', description: 'حساب، وضعیت و محدوده کاری', group: 'service', icon: 'users' },
  { path: '/admin/service-fleet', label: 'خودروهای سرویس', description: 'ناوگان و سرویس‌کار پیش‌فرض', group: 'service', icon: 'car' },
  { path: '/admin/service-booking-settings', label: 'تنظیمات رزرو', description: 'ظرفیت، زمان‌بندی و قیمت سرویس', group: 'service', icon: 'settings' },
  { path: '/admin/service-catalog', label: 'خدمات قابل رزرو', description: 'تعریف سرویس‌های قابل انتخاب مشتری', group: 'service', icon: 'service' },
  { path: '/admin/service-requests', label: 'آرشیو درخواست‌ها', description: 'نمای فنی درخواست‌های سرویس', group: 'service', icon: 'orders' },

  { path: '/admin/products', label: 'محصولات', description: 'قیمت، موجودی و مشخصات', group: 'commerce', icon: 'box' },
  { path: '/admin/inventory', label: 'انبار', description: 'موجودی، کمبود و گردش کالا', group: 'commerce', icon: 'inventory' },
  { path: '/admin/categories', label: 'دسته‌بندی‌ها', group: 'commerce', icon: 'category' },
  { path: '/admin/brands', label: 'برندها', group: 'commerce', icon: 'brand' },
  { path: '/admin/packages', label: 'پکیج‌ها', group: 'commerce', icon: 'package' },
  { path: '/admin/cars', label: 'خودروها', group: 'commerce', icon: 'car' },
  { path: '/admin/oil-specs', label: 'گرید و سطح کیفی', group: 'commerce', icon: 'oil' },

  { path: '/admin/customers-crm', label: 'مشتریان و CRM', description: 'پرونده مشتری، یادداشت و Timeline', group: 'customers', icon: 'users' },
  { path: '/admin/reviews', label: 'نظرات مشتریان', group: 'customers', icon: 'reviews' },
  { path: '/admin/support', label: 'پشتیبانی', group: 'customers', icon: 'support' },

  { path: '/admin/home-content', label: 'صفحه اصلی', description: 'بنرها و محتوای فروشگاه', group: 'growth', icon: 'homeContent' },
  { path: '/admin/discounts', label: 'تخفیف و کمپین', group: 'growth', icon: 'discount' },
  { path: '/admin/blog', label: 'بلاگ', group: 'growth', icon: 'homeContent' },
  { path: '/admin/appearance', label: 'ظاهر سایت', group: 'growth', icon: 'settings' },

  { path: '/admin/finance', label: 'مالی و سود', group: 'finance', icon: 'payment' },
  { path: '/admin/payment-settings', label: 'تنظیمات پرداخت', group: 'finance', icon: 'payment' },

  { path: '/admin/admin-accounts', label: 'کاربران پنل', description: 'مدیران و حساب‌های مدیریتی', group: 'team', icon: 'users' },
  { path: '/admin/roles', label: 'نقش‌ها و دسترسی‌ها', group: 'team', icon: 'roles' },
  { path: '/admin/audit-logs', label: 'لاگ فعالیت‌ها', group: 'team', icon: 'audit' },

  { path: '/admin/settings', label: 'تنظیمات مرکزی', group: 'system', icon: 'settings' },
  { path: '/admin/system-health', label: 'سلامت سیستم', group: 'system', icon: 'settings' },
  { path: '/admin/quick-links', label: 'همه ابزارها', description: 'صفحات تخصصی و ابزارهای کم‌استفاده', group: 'system', icon: 'settings' },
];

export function useAdminRoutes() {
  const { can } = useAdminAuth();
  return useMemo(() => routes.filter((route) => can(permissionForAdminPath(route.path))), [can]);
}
