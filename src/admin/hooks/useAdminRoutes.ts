import { useMemo } from 'react';

interface AdminRoute {
  path: string;
  label: string;
  icon: 'home' | 'homeContent' | 'box' | 'orders' | 'brand' | 'package' | 'category' | 'oil' | 'car' | 'users' | 'settings';
}

export function useAdminRoutes() {
  return useMemo<AdminRoute[]>(
    () => [
      { path: '/admin', label: 'داشبورد', icon: 'home' },
      { path: '/admin/dashboard', label: 'داشبورد KPI', icon: 'home' },
      { path: '/admin/operations-center', label: 'مرکز عملیات زنده', icon: 'orders' },
      { path: '/admin/phone-order', label: 'ثبت سفارش تلفنی', icon: 'orders' },
      { path: '/admin/quick-links', label: 'مرکز مسیرها', icon: 'settings' },
      { path: '/admin/home-content', label: 'صفحه اصلی', icon: 'homeContent' },
      { path: '/admin/products', label: 'محصولات', icon: 'box' },
      { path: '/admin/orders', label: 'سفارش‌ها', icon: 'orders' },
      { path: '/admin/reviews', label: 'نظرات', icon: 'orders' },
      { path: '/admin/discounts', label: 'تخفیف و کمپین', icon: 'orders' },
      { path: '/admin/support', label: 'پشتیبانی', icon: 'users' },
      { path: '/admin/brands', label: 'برندها', icon: 'brand' },
      { path: '/admin/packages', label: 'پکیج‌ها', icon: 'package' },
      { path: '/admin/categories', label: 'دسته‌بندی‌ها', icon: 'category' },
      { path: '/admin/oil-specs', label: 'گرید و سطح کیفی', icon: 'oil' },
      { path: '/admin/cars', label: 'خودروها', icon: 'car' },
      { path: '/admin/recommendations', label: 'پیشنهاد هوشمند', icon: 'car' },
      { path: '/admin/users', label: 'کاربران و نقش‌ها', icon: 'users' },
      { path: '/admin/customers', label: 'مشتری‌ها', icon: 'users' },
      { path: '/admin/loyalty', label: 'باشگاه مشتریان', icon: 'users' },
      { path: '/admin/service-requests', label: 'درخواست سرویس', icon: 'orders' },
      { path: '/admin/service-booking-settings', label: 'تنظیمات رزرو', icon: 'car' },
      { path: '/admin/service-catalog', label: 'اقلام سرویس', icon: 'car' },
      { path: '/admin/dispatch', label: 'مرکز اعزام', icon: 'orders' },
      { path: '/admin/service-fleet', label: 'ناوگان سرویس', icon: 'car' },
      { path: '/admin/branches', label: 'شعب', icon: 'homeContent' },
      { path: '/admin/inventory', label: 'انبارداری', icon: 'box' },
      { path: '/admin/suppliers', label: 'تأمین‌کنندگان', icon: 'box' },
      { path: '/admin/purchases', label: 'خرید کالا', icon: 'box' },
      { path: '/admin/finance', label: 'مالی و سود', icon: 'orders' },
      { path: '/admin/investor-report', label: 'گزارش سرمایه‌گذار', icon: 'orders' },
      { path: '/admin/sms-logs', label: 'لاگ پیامک‌ها', icon: 'settings' },
      { path: '/admin/payment-settings', label: 'تنظیمات پرداخت', icon: 'settings' },
      { path: '/admin/diagnostics', label: 'تست سلامت', icon: 'settings' },
      { path: '/admin/settings', label: 'تنظیمات', icon: 'settings' },
    ],
    []
  );
}
