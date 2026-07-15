import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '__patch__'].includes(item)) continue;
      walk(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(item)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(srcRoot);
const candidates = files
  .map(file => ({ file, text: fs.readFileSync(file, 'utf8') }))
  .filter(x =>
    x.text.includes('مرکز مسیرها') ||
    x.text.includes('تست سلامت مسیرها') ||
    x.text.includes('/admin/quick-links')
  );

if (!candidates.length) {
  console.error('❌ هیچ فایل فعالی با متن مرکز مسیرها یا /admin/quick-links داخل src پیدا نشد.');
  console.error('لطفاً خروجی Ctrl+Shift+F برای «مرکز مسیرها» را بفرست.');
  process.exit(1);
}

const cardObject = `{ title: 'مدیریت مسیرها / Route Registry', path: '/admin/route-registry', desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل', icon: '📍', badge: 'جدید' }`;
const altCardObject = `{ title: 'مدیریت مسیرها / Route Registry', to: '/admin/route-registry', desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل', icon: '📍', badge: 'جدید' }`;

let patched = false;
const report = [];

for (const { file, text } of candidates) {
  let next = text;
  const rel = path.relative(root, file);

  if (next.includes('/admin/route-registry') || next.includes('Route Registry')) {
    report.push(`⏭ ${rel}: قبلاً Route Registry دارد.`);
    continue;
  }

  // Case 1: array item style with path property near مرکز مسیرها
  const patterns = [
    /(\{[^{}]*title:\s*['"]مرکز مسیرها['"][^{}]*path:\s*['"]\/admin\/quick-links['"][^{}]*\}\s*,?)/s,
    /(\{[^{}]*label:\s*['"]مرکز مسیرها['"][^{}]*path:\s*['"]\/admin\/quick-links['"][^{}]*\}\s*,?)/s,
    /(\{[^{}]*title:\s*['"]تست سلامت مسیرها['"][^{}]*path:\s*['"]\/admin\/navigation-audit['"][^{}]*\}\s*,?)/s,
    /(\{[^{}]*label:\s*['"]تست سلامت مسیرها['"][^{}]*path:\s*['"]\/admin\/navigation-audit['"][^{}]*\}\s*,?)/s,
  ];

  for (const rx of patterns) {
    if (rx.test(next)) {
      next = next.replace(rx, match => `${match.endsWith(',') ? match : match + ','}\n        ${cardObject},`);
      break;
    }
  }

  // Case 2: Link JSX to quick-links. Add visible button after it.
  if (next === text && next.includes('to="/admin/quick-links"')) {
    next = next.replace(
      /(<Link[^>]+to=["']\/admin\/quick-links["'][\s\S]*?<\/Link>)/,
      `$1\n          <Link to="/admin/route-registry" className="rounded-xl bg-amber-400 px-3 py-2 font-bold text-slate-950 hover:bg-amber-300">📍 مدیریت مسیرها</Link>`
    );
  }

  // Case 3: href JSX to quick-links. Add visible anchor after it.
  if (next === text && next.includes('href="/admin/quick-links"')) {
    next = next.replace(
      /(<a[^>]+href=["']\/admin\/quick-links["'][\s\S]*?<\/a>)/,
      `$1\n          <a href="/admin/route-registry" className="rounded-xl bg-amber-400 px-3 py-2 font-bold text-slate-950 hover:bg-amber-300">📍 مدیریت مسیرها</a>`
    );
  }

  if (next !== text) {
    fs.copyFileSync(file, `${file}.bak-route-registry-${Date.now()}`);
    fs.writeFileSync(file, next, 'utf8');
    patched = true;
    report.push(`✅ ${rel}: کارت/دکمه Route Registry اضافه شد.`);
  } else {
    report.push(`⚠️ ${rel}: پیدا شد ولی ساختارش قابل Merge خودکار نبود.`);
  }
}

// Ensure route registry page exists in the real structure: prefer src/pages because user's project uses it.
const pagesDir = path.join(srcRoot, 'pages');
fs.mkdirSync(pagesDir, { recursive: true });
const registryPage = path.join(pagesDir, 'RouteRegistryPage.tsx');
if (!fs.existsSync(registryPage)) {
  fs.writeFileSync(registryPage, `import { Link } from 'react-router-dom';

const routes = [
  ['/admin/quick-links', 'مرکز مسیرها'],
  ['/admin/navigation-audit', 'تست سلامت مسیرها'],
  ['/admin/system-health', 'سلامت سیستم'],
  ['/admin/bug-reports', 'گزارش خطاها'],
  ['/admin/dashboard', 'داشبورد مدیریت'],
  ['/admin/orders', 'سفارش‌ها'],
  ['/admin/products', 'محصولات'],
  ['/admin/settings', 'تنظیمات'],
];

export default function RouteRegistryPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <h1 className="text-2xl font-black">مدیریت مسیرها / Route Registry</h1>
          <p className="mt-2 text-sm text-slate-300">مرکز بررسی مسیرهای مهم Carrtell. این صفحه بعداً برای تست سلامت نهایی کامل‌تر می‌شود.</p>
          <Link to="/admin/quick-links" className="mt-4 inline-flex rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950">بازگشت به مرکز مسیرها</Link>
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
`, 'utf8');
  report.push('✅ src/pages/RouteRegistryPage.tsx ساخته شد.');
}

// Try to wire route into App.tsx using src/pages structure.
const appPath = path.join(srcRoot, 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('RouteRegistryPage')) {
    const importLine = `import RouteRegistryPage from './pages/RouteRegistryPage';\n`;
    app = importLine + app;
  }
  if (!app.includes('/admin/route-registry') && !app.includes('path="route-registry"')) {
    if (app.includes('path="quick-links"')) {
      app = app.replace(/<Route\s+path=["']quick-links["'][^\n]*\/>/, m => `${m}\n              <Route path="route-registry" element={<RouteRegistryPage />} />`);
    } else if (app.includes('path="/admin/quick-links"')) {
      app = app.replace(/<Route\s+path=["']\/admin\/quick-links["'][^\n]*\/>/, m => `${m}\n        <Route path="/admin/route-registry" element={<RouteRegistryPage />} />`);
    } else {
      app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/admin/route-registry" element={<RouteRegistryPage />} />`);
    }
  }
  fs.writeFileSync(appPath, app, 'utf8');
  report.push('✅ App.tsx برای /admin/route-registry بررسی/آپدیت شد.');
}

console.log('\nگزارش اعمال پچ:');
console.log(report.join('\n'));

if (!patched) {
  console.log('\n⚠️ هشدار: هیچ کارت/دکمه‌ای داخل فایل‌های موجود اضافه نشد.');
  console.log('لطفاً فایل واقعی‌ای که این کارت‌ها را render می‌کند باز کن و خروجی چند خط items را بفرست.');
  process.exit(2);
}

console.log('\n✅ پچ Structure-Aware Route Registry تمام شد.');
console.log('حالا Vite را ریستارت کن و برو به /admin/quick-links');
