import fs from 'fs';
import path from 'path';

const root = process.cwd();
const qlPath = path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx');
const appPath = path.join(root, 'src', 'App.tsx');

function fail(message) {
  console.error('\n❌ ' + message);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail(`فایل پیدا نشد: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}
function backup(file) {
  if (!fs.existsSync(file)) return;
  const backupPath = file + `.bak-${Date.now()}`;
  fs.copyFileSync(file, backupPath);
  console.log('🗂 backup:', path.relative(root, backupPath));
}

const routeCard = `{ title: 'مدیریت مسیرها / Route Registry', path: '/admin/route-registry', desc: 'مشاهده، تست و مدیریت تمام مسیرهای ثبت‌شده پنل' }`;

let quickLinks = read(qlPath);
backup(qlPath);

if (quickLinks.includes('/admin/route-registry') || quickLinks.includes('Route Registry')) {
  console.log('✅ کارت Route Registry از قبل داخل QuickLinks وجود دارد.');
} else {
  const dashboardHeaderRegex = /\{\s*title:\s*['"]داشبورد['"]\s*,\s*items:\s*\[/m;
  if (dashboardHeaderRegex.test(quickLinks)) {
    quickLinks = quickLinks.replace(dashboardHeaderRegex, (m) => `${m}\n      ${routeCard},`);
    console.log('✅ کارت Route Registry به گروه داشبورد اضافه شد.');
  } else {
    // fallback: first items array in the page
    const itemsRegex = /items:\s*\[/m;
    if (itemsRegex.test(quickLinks)) {
      quickLinks = quickLinks.replace(itemsRegex, (m) => `${m}\n      ${routeCard},`);
      console.log('✅ کارت Route Registry به اولین لیست مسیرها اضافه شد.');
    } else {
      // fallback: routes array with object cards at top-level
      const arrayRegex = /(const\s+\w+\s*=\s*\[)/m;
      if (arrayRegex.test(quickLinks)) {
        quickLinks = quickLinks.replace(arrayRegex, `$1\n  { title: 'سیستم', items: [\n    ${routeCard}\n  ] },`);
        console.log('✅ گروه سیستم با کارت Route Registry اضافه شد.');
      } else {
        fail('ساختار QuickLinks.tsx قابل تشخیص نیست. فایل را دستی بفرست تا دقیق اصلاح کنم.');
      }
    }
  }
  write(qlPath, quickLinks);
}

// Ensure App route exists for /admin/route-registry without duplicate/import missing assumptions.
let app = read(appPath);
backup(appPath);

if (!app.includes('AdminRouteRegistry')) {
  const importLine = `import AdminRouteRegistry from './admin/pages/AdminRouteRegistry';`;
  const lastImportRegex = /^(import[\s\S]*?;)(?![\s\S]*^import)/m;
  if (lastImportRegex.test(app)) {
    app = app.replace(lastImportRegex, `$1\n${importLine}`);
  } else {
    app = `${importLine}\n${app}`;
  }
  console.log('✅ import AdminRouteRegistry اضافه شد.');
}

const registryPageDir = path.join(root, 'src', 'admin', 'pages');
const registryPagePath = path.join(registryPageDir, 'AdminRouteRegistry.tsx');
if (!fs.existsSync(registryPagePath)) {
  fs.mkdirSync(registryPageDir, { recursive: true });
  fs.writeFileSync(registryPagePath, `import { Link } from 'react-router-dom';\n\nconst routes = [\n  ['/admin/quick-links','مرکز مسیرها'],\n  ['/admin/navigation-audit','تست سلامت مسیرها'],\n  ['/admin/system-health','سلامت سیستم'],\n  ['/admin/bug-reports','گزارش خطاها'],\n  ['/admin/dashboard','داشبورد مدیریت'],\n  ['/admin/orders','سفارش‌ها'],\n  ['/admin/products','محصولات'],\n  ['/admin/settings','تنظیمات'],\n];\n\nexport default function AdminRouteRegistry() {\n  return (\n    <div dir=\"rtl\" className=\"min-h-screen bg-slate-950 p-6 text-white\">\n      <div className=\"mx-auto max-w-6xl space-y-6\">\n        <div className=\"rounded-3xl border border-white/10 bg-slate-900 p-6\">\n          <h1 className=\"text-2xl font-black\">مدیریت مسیرها / Route Registry</h1>\n          <p className=\"mt-2 text-sm text-slate-300\">لیست مسیرهای مهم پنل مدیریت کارتل برای تست و دسترسی سریع.</p>\n          <Link to=\"/admin/quick-links\" className=\"mt-4 inline-flex rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950\">بازگشت به مرکز مسیرها</Link>\n        </div>\n        <div className=\"grid gap-3 md:grid-cols-2\">\n          {routes.map(([path,label]) => (\n            <Link key={path} to={path} className=\"rounded-2xl border border-white/10 bg-slate-900 p-4 hover:bg-slate-800\">\n              <div className=\"font-bold\">{label}</div>\n              <div className=\"mt-1 text-xs text-slate-400\">{path}</div>\n            </Link>\n          ))}\n        </div>\n      </div>\n    </div>\n  );\n}\n`, 'utf8');
  console.log('✅ صفحه AdminRouteRegistry ساخته شد.');
}

if (!app.includes('path="/admin/route-registry"') && !app.includes("path='/admin/route-registry'") && !app.includes('path="route-registry"') && !app.includes("path='route-registry'")) {
  // Prefer nested admin route near quick-links
  if (app.includes('path="quick-links"')) {
    app = app.replace(/<Route\s+path="quick-links"\s+element=\{<AdminQuickLinks\s*\/>\}\s*\/>/, (m) => `${m}\n            <Route path="route-registry" element={<AdminRouteRegistry />} />`);
  } else if (app.includes('path="/admin/quick-links"')) {
    app = app.replace(/<Route\s+path="\/admin\/quick-links"\s+element=\{<AdminQuickLinks\s*\/>\}\s*\/>/, (m) => `${m}\n        <Route path="/admin/route-registry" element={<AdminRouteRegistry />} />`);
  } else {
    app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/admin/route-registry" element={<AdminRouteRegistry />} />`);
  }
  console.log('✅ Route /admin/route-registry اضافه شد.');
}
write(appPath, app);

console.log('\n🎉 Deep QuickLinks Route Registry patch applied.');
console.log('حالا Vite را کامل ریستارت کن و باز کن: /admin/quick-links');
