import { useMemo } from 'react';

interface AdminRoute {
  path: string;
  label: string;
  icon: 'home' | 'box' | 'users' | 'settings';
}

export function useAdminRoutes() {
  return useMemo<AdminRoute[]>(
    () => [
      { path: '/admin', label: 'داشبورد', icon: 'home' },
      { path: '/admin/products', label: 'محصولات', icon: 'box' },
      { path: '/admin/users', label: 'کاربران', icon: 'users' },
      { path: '/admin/settings', label: 'تنظیمات', icon: 'settings' },
    ],
    []
  );
}
