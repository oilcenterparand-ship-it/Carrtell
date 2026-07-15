import fs from 'fs';
import path from 'path';

const root = process.cwd();
const quickLinksPath = path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx');
const routeRegistryPath = path.join(root, 'src', 'admin', 'pages', 'AdminRouteRegistry.tsx');
const appPath = path.join(root, 'src', 'App.tsx');

function fail(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}
function backup(file) {
  if (fs.existsSync(file)) fs.copyFileSync(file, file + `.bak-${Date.now()}`);
}
function writeIfChanged(file, content) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (old !== content) fs.writeFileSync(file, content, 'utf8');
}

if (!fs.existsSync(quickLinksPath)) fail('فایل src/admin/pages/QuickLinks.tsx پیدا نشد. مسیر پروژه را چک کن.');

let quick = fs.readFileSync(quickLinksPath, 'utf8');
backup(quickLinksPath);

const card = `{ title: 'مدیریت مسیرها / Route Registry', path: '/admin/route-registry', desc: 'مشاهده، دسته‌بندی و تست تمام مسیرهای ثبت‌شده پنل مدیریت', icon: '📍', badge: 'جدید' }`;

if (!quick.includes('/admin/route-registry')) {
  // Insert directly after the visible مرکز مسیرها card inside the actual items array.
  const re = /(\{\s*title:\s*['"]مرکز مسیرها['"][\s\S]*?path:\s*['"]\/admin\/quick-links['"][\s\S]*?\},?)/m;
  if (re.test(quick)) {
    quick = quick.replace(re, (m) => {
      const suffix = m.trim().endsWith(',') ? '' : ',';
      return `${m}${suffix}\n        ${card},`;
    });
  } else {
    // Fallback: insert after dashboard card if structure changed.
    const re2 = /(\{\s*title:\s*['"]داشبورد مدیریت['"][\s\S]*?path:\s*['"]\/admin\/dashboard['"][\s\S]*?\},?)/m;
    if (!re2.test(quick)) {
      fail('ساختار QuickLinks.tsx شناخته نشد. عبارت «مرکز مسیرها» یا «داشبورد مدیریت» پیدا نشد.');
    }
    quick = quick.replace(re2, (m) => {
      const suffix = m.trim().endsWith(',') ? '' : ',';
      return `${m}${suffix}\n        ${card},`;
    });
  }
  writeIfChanged(quickLinksPath, quick);
  console.log('✅ کارت Route Registry به src/admin/pages/QuickLinks.tsx اضافه شد.');
} else {
  console.log('ℹ️ کارت Route Registry از قبل داخل QuickLinks وجود دارد.');
}

// Ensure AdminRouteRegistry page exists.
fs.mkdirSync(path.dirname(routeRegistryPath), { recursive: true });
if (!fs.existsSync(routeRegistryPath)) {
  fs.writeFileSync(routeRegistryPath, `import { Link } from 'react-router-dom';

const routes = [
  ['/admin/quick-links', 'مرکز مسیرها'],
  ['/admin/route-registry', 'مدیریت مسیرها / Route Registry'],
  ['/admin/navigation-audit', 'تست سلامت مسیرها'],
  ['/admin/system-health', 'سلامت سیستم'],
  ['/admin/bug-reports', 'گزارش خطاها'],
  ['/admin/dashboard', 'داشبورد مدیریت'],
  ['/admin/orders', 'سفارش‌ها'],
  ['/admin/products', 'محصولات'],
  ['/admin/settings', 'تنظیمات'],
  ['/admin/appearance', 'ظاهر سایت'],
  ['/admin/smart-sales', 'فروش هوشمند'],
];

export default function AdminRouteRegistry() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <h1 className="text-2xl font-black">مدیریت مسیرها / Route Registry</h1>
          <p className="mt-2 text-sm text-slate-300">لیست مسیرهای مهم پنل مدیریت کارتل برای دسترسی و تست سریع.</p>
          <Link to="/admin/quick-links" className="mt-4 inline-flex rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300">بازگشت به مرکز مسیرها</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map(([path, label]) => (
            <Link key={path} to={path} className="rounded-2xl border border-white/10 bg-slate-900 p-4 hover:bg-slate-800">
              <div className="font-bold">{label}</div>
              <div dir="ltr" className="mt-2 text-sm text-sky-300">{path}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`);
  console.log('✅ صفحه AdminRouteRegistry ساخته شد.');
}

// Ensure App import + route. Try both absolute and nested route styles, because this project has both.
if (fs.existsSync(appPath)) {
  backup(appPath);
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("./admin/pages/AdminRouteRegistry")) {
    const lastImport = app.match(/import[\s\S]*?;\n/g)?.pop();
    if (lastImport) app = app.replace(lastImport, `${lastImport}import AdminRouteRegistry from './admin/pages/AdminRouteRegistry';\n`);
    else app = `import AdminRouteRegistry from './admin/pages/AdminRouteRegistry';\n${app}`;
  }
  if (!app.includes('path="/admin/route-registry"') && !app.includes("path='/admin/route-registry'")) {
    if (app.includes('path="/admin/quick-links"')) {
      app = app.replace(/<Route\s+path=["']\/admin\/quick-links["'][^>]*\/>/, (m) => `${m}\n        <Route path="/admin/route-registry" element={<AdminRouteRegistry />} />`);
    } else if (app.includes('path="quick-links"')) {
      app = app.replace(/<Route\s+path=["']quick-links["'][^>]*\/>/, (m) => `${m}\n            <Route path="route-registry" element={<AdminRouteRegistry />} />`);
    } else {
      console.warn('⚠️ مسیر quick-links در App.tsx پیدا نشد. مسیر /admin/route-registry را دستی چک کن.');
    }
  }
  writeIfChanged(appPath, app);
  console.log('✅ Route /admin/route-registry در App.tsx بررسی/اضافه شد.');
}

console.log('\n✅ QuickLinks Real Registry Fix applied.');
console.log('حالا Vite را کامل ریستارت کن و برو به /admin/quick-links');
