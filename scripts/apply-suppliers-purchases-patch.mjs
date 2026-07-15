import fs from 'fs';
import path from 'path';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.tsx');
const layoutCandidates = [
  path.join(root, 'src', 'admin', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'Layout.tsx'),
];

function patchApp() {
  if (!fs.existsSync(appPath)) return console.warn('App.tsx پیدا نشد؛ routeها را دستی اضافه کن.');
  let app = fs.readFileSync(appPath, 'utf8');

  if (!app.includes("./admin/pages/Suppliers")) {
    app = app.replace(/(import\s+[^;]+;\s*)/, `$1\nimport Suppliers from './admin/pages/Suppliers';\nimport Purchases from './admin/pages/Purchases';\n`);
  }

  if (!app.includes('path="/admin/suppliers"')) {
    const routes = `\n          <Route path="/admin/suppliers" element={<Suppliers />} />\n          <Route path="/admin/purchases" element={<Purchases />} />`;
    if (app.includes('</Routes>')) app = app.replace('</Routes>', `${routes}\n        </Routes>`);
  }

  fs.writeFileSync(appPath, app);
  console.log('App.tsx برای تأمین‌کنندگان و خرید بررسی شد.');
}

function patchAdminMenu() {
  const layoutPath = layoutCandidates.find((candidate) => fs.existsSync(candidate));
  if (!layoutPath) return console.warn('منوی پنل مدیریت پیدا نشد؛ لینک‌ها را دستی اضافه کن.');
  let content = fs.readFileSync(layoutPath, 'utf8');
  if (content.includes('/admin/suppliers') && content.includes('/admin/purchases')) return;

  const links = `\n            <a href="/admin/suppliers" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">تأمین‌کنندگان</a>\n            <a href="/admin/purchases" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">خرید کالا</a>`;

  if (content.includes('/admin/inventory')) {
    content = content.replace(/(<a[^>]+href=["']\/admin\/inventory["'][\s\S]*?<\/a>)/, `$1${links}`);
  } else if (content.includes('</nav>')) {
    content = content.replace('</nav>', `${links}\n          </nav>`);
  }

  fs.writeFileSync(layoutPath, content);
  console.log('لینک تأمین‌کنندگان و خرید کالا به منو اضافه شد.');
}

patchApp();
patchAdminMenu();
console.log('پچ تأمین‌کنندگان و خرید اعمال شد. SQL را اجرا کن: docs/sql/2026_suppliers_purchases.sql');
