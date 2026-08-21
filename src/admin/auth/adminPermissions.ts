export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'orders.view','orders.manage',
  'products.view','products.manage',
  'inventory.view','inventory.manage',
  'finance.view','finance.manage',
  'customers.view','customers.manage',
  'support.view','support.manage',
  'content.view','content.manage',
  'dispatch.view','dispatch.manage',
  'settings.view','settings.manage',
  'staff.view','staff.manage',
  'roles.view','roles.manage',
  'audit.view',
] as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  'dashboard.view': 'مشاهده داشبورد',
  'orders.view': 'مشاهده سفارش‌ها', 'orders.manage': 'مدیریت سفارش‌ها',
  'products.view': 'مشاهده محصولات', 'products.manage': 'مدیریت محصولات',
  'inventory.view': 'مشاهده انبار', 'inventory.manage': 'مدیریت انبار',
  'finance.view': 'مشاهده مالی', 'finance.manage': 'مدیریت مالی',
  'customers.view': 'مشاهده مشتریان', 'customers.manage': 'مدیریت مشتریان',
  'support.view': 'مشاهده پشتیبانی', 'support.manage': 'مدیریت پشتیبانی',
  'content.view': 'مشاهده محتوا', 'content.manage': 'مدیریت محتوا',
  'dispatch.view': 'مشاهده اعزام', 'dispatch.manage': 'مدیریت اعزام',
  'settings.view': 'مشاهده تنظیمات', 'settings.manage': 'مدیریت تنظیمات',
  'staff.view': 'مشاهده کاربران پنل', 'staff.manage': 'مدیریت کاربران پنل',
  'roles.view': 'مشاهده نقش‌ها', 'roles.manage': 'مدیریت نقش‌ها',
  'audit.view': 'مشاهده لاگ امنیتی',
};

export function permissionForAdminPath(path: string): AdminPermission | null {
  if (path === '/admin' || path.startsWith('/admin/dashboard') || path.startsWith('/admin/quick-links')) return 'dashboard.view';
  if (path.startsWith('/admin/orders') || path.startsWith('/admin/phone-order') || path.startsWith('/admin/reviews')) return 'orders.view';
  if (path.startsWith('/admin/products') || path.startsWith('/admin/categories') || path.startsWith('/admin/brands') || path.startsWith('/admin/packages') || path.startsWith('/admin/cars') || path.startsWith('/admin/oil-specs')) return 'products.view';
  if (path.startsWith('/admin/inventory') || path.startsWith('/admin/purchases') || path.startsWith('/admin/suppliers')) return 'inventory.view';
  if (path.startsWith('/admin/finance') || path.startsWith('/admin/payment') || path.startsWith('/admin/investor')) return 'finance.view';
  if (path.startsWith('/admin/customers') || path.startsWith('/admin/users') || path.startsWith('/admin/loyalty')) return 'customers.view';
  if (path.startsWith('/admin/support') || path.startsWith('/admin/notifications')) return 'support.view';
  if (path.startsWith('/admin/blog') || path.startsWith('/admin/seo') || path.startsWith('/admin/home-content') || path.startsWith('/admin/appearance')) return 'content.view';
  if (path.startsWith('/admin/dispatch') || path.startsWith('/admin/service-') || path.startsWith('/admin/operations-center') || path.startsWith('/admin/branches')) return 'dispatch.view';
  if (path.startsWith('/admin/staff') || path.startsWith('/admin/technicians')) return 'staff.view';
  if (path.startsWith('/admin/roles')) return 'roles.view';
  if (path.startsWith('/admin/audit')) return 'audit.view';
  if (path.startsWith('/admin/settings') || path.startsWith('/admin/system-') || path.startsWith('/admin/diagnostics') || path.startsWith('/admin/route-') || path.startsWith('/admin/navigation-') || path.startsWith('/admin/sms-')) return 'settings.view';
  return 'dashboard.view';
}
