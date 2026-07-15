import fs from 'fs';
import path from 'path';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.tsx');
const quickLinksPath = path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx');

function read(p){ return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : ''; }
function write(p,c){ fs.writeFileSync(p,c,'utf8'); }

let changed = false;
let app = read(appPath);
if (!app) {
  console.error('❌ src/App.tsx پیدا نشد. این اسکریپت را از ریشه پروژه اجرا کن.');
  process.exit(1);
}

// Remove duplicated absolute quick-links route that can shadow the nested admin route.
const beforeApp = app;
app = app.replace(/\n\s*<Route\s+path=["']\/admin\/quick-links["']\s+element=\{<AdminQuickLinks\s*\/>\}\s*\/?>/g, '');

// Ensure nested admin quick-links route exists.
if (!app.includes('path="quick-links"') && !app.includes("path='quick-links'")) {
  const routeLine = '              <Route path="quick-links" element={<AdminQuickLinks />} />';
  if (app.includes('<Route index element={<AdminDashboard />} />')) {
    app = app.replace(/<Route index element=\{<AdminDashboard\s*\/>\}\s*\/>/, (m)=>`${m}\n${routeLine}`);
  } else {
    app = app.replace(/<Route\s+path=["']products["'][^\n]*\n?/, (m)=>`${routeLine}\n${m}`);
  }
}
if (app !== beforeApp) { write(appPath, app); changed = true; }

// Force QuickLinks to include Route Registry card if the active file is this file.
if (fs.existsSync(quickLinksPath)) {
  let q = read(quickLinksPath);
  if (!q.includes('/admin/route-registry')) {
    const card = `\n  { title: 'مدیریت مسیرها / Route Registry', path: '/admin/route-registry', desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل' },`;
    q = q.replace(/(const\s+[^=]*links\s*=\s*\[[\s\S]*?routes\s*:\s*\[)/, `$1${card}`);
    q = q.replace(/(const\s+[^=]*items\s*=\s*\[)/, `$1${card}`);
    if (!q.includes('/admin/route-registry')) {
      q = q.replace(/(\{\s*title:\s*['"]مرکز مسیرها['"][\s\S]*?\},)/, `$1${card}`);
    }
    write(quickLinksPath, q);
    changed = true;
  }
}

console.log('✅ QuickLinks Route Cleanup Fix اجرا شد.');
console.log(changed ? 'تغییرات اعمال شد.' : 'چیزی برای تغییر پیدا نشد؛ احتمالاً قبلاً اصلاح شده است.');
console.log('حالا Vite را کامل ریستارت کن: Ctrl+C سپس npm run dev');
console.log('تست: /admin/quick-links');
