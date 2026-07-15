import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, '__patch__', 'src', 'admin', 'pages', 'QuickLinks.tsx');
const dest = path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx');

if (!fs.existsSync(src)) {
  console.error('❌ فایل پچ پیدا نشد:', src);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);

const appPath = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("path=\"quick-links\"") && app.includes('<Route index element={<AdminDashboard />}')) {
    app = app.replace('<Route index element={<AdminDashboard />} />', '<Route index element={<AdminDashboard />} />\n            <Route path="quick-links" element={<AdminQuickLinks />} />');
  }
  fs.writeFileSync(appPath, app, 'utf8');
}

console.log('✅ QuickLinks.tsx کامل جایگزین شد.');
console.log('🔁 Vite را کامل ریستارت کن: Ctrl+C سپس npm run dev');
console.log('📍 تست: /admin/quick-links');
console.log('📍 کارت Route Registry داخل بخش «مرکز مدیریت» و بالای صفحه قرار دارد.');
