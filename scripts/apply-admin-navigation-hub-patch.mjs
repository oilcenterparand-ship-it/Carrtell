import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
function write(file, data) {
  fs.writeFileSync(file, data, 'utf8');
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

const routesFile = path.join(root, 'src/admin/hooks/useAdminRoutes.ts');
if (fs.existsSync(routesFile)) {
  const next = `import { useMemo } from 'react';

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
`;
  write(routesFile, next);
  console.log('✅ Admin sidebar routes updated.');
} else {
  console.warn('⚠️ useAdminRoutes.ts not found. Sidebar route list was not updated.');
}

const sidebarFile = path.join(root, 'src/admin/components/Sidebar.tsx');
if (fs.existsSync(sidebarFile)) {
  let s = read(sidebarFile);
  s = s.replace('className="mt-4 px-4"', 'className="mt-4 max-h-[calc(100vh-96px)] space-y-1 overflow-y-auto px-4 pb-6"');
  write(sidebarFile, s);
  console.log('✅ Admin sidebar made scrollable.');
}

const appFile = path.join(root, 'src/App.tsx');
if (fs.existsSync(appFile)) {
  let app = read(appFile);
  if (!app.includes('AdminQuickLinks')) {
    const anchor = /import\s+AdminReviews[^;]*;\n?/;
    if (anchor.test(app)) app = app.replace(anchor, (m) => m + `import AdminQuickLinks from './admin/pages/AdminQuickLinks';\n`);
    else app = `import AdminQuickLinks from './admin/pages/AdminQuickLinks';\n` + app;
  }
  if (!app.includes('path="quick-links"')) {
    app = app.replace(/<Route\s+index\s+element=\{<AdminDashboard\s*\/?>\}\s*\/>/, (m) => `${m}\n            <Route path="quick-links" element={<AdminQuickLinks />} />`);
    if (!app.includes('path="quick-links"')) {
      app = app.replace(/<Route\s+path="settings"[^\n]*\n?/, (m) => `${m}            <Route path="quick-links" element={<AdminQuickLinks />} />\n`);
    }
  }
  write(appFile, app);
  console.log('✅ /admin/quick-links route added.');
}

console.log('✅ Admin Navigation Hub patch applied.');
console.log('Open: /admin/quick-links');
