import { useMemo } from 'react';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { permissionForAdminPath } from '../auth/adminPermissions';

interface AdminRoute {
  path: string;
  label: string;
  icon: 'home' | 'homeContent' | 'box' | 'orders' | 'brand' | 'package' | 'category' | 'oil' | 'car' | 'users' | 'settings';
}

const routes: AdminRoute[] = [
  { path: '/admin/dashboard', label: 'داشبورد', icon: 'home' },
  { path: '/admin/operations-center', label: 'مرکز عملیات زنده', icon: 'orders' },
  { path: '/admin/phone-order', label: 'ثبت سفارش تلفنی', icon: 'orders' },
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
  { path: '/admin/customers-crm', label: 'مشتریان', icon: 'users' },
  { path: '/admin/service-requests', label: 'درخواست سرویس', icon: 'orders' },
  { path: '/admin/dispatch', label: 'مرکز اعزام', icon: 'orders' },
  { path: '/admin/inventory', label: 'انبارداری', icon: 'box' },
  { path: '/admin/finance', label: 'مالی و سود', icon: 'orders' },
  { path: '/admin/admin-accounts', label: 'کاربران پنل', icon: 'users' },
  { path: '/admin/roles', label: 'نقش‌ها و دسترسی‌ها', icon: 'users' },
  { path: '/admin/audit-logs', label: 'لاگ فعالیت‌ها', icon: 'settings' },
  { path: '/admin/settings', label: 'تنظیمات', icon: 'settings' },
];

export function useAdminRoutes() {
  const { can } = useAdminAuth();
  return useMemo(() => routes.filter((route) => can(permissionForAdminPath(route.path))), [can]);
}
