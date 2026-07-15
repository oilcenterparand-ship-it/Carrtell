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
  if (!fs.existsSync(appPath)) {
    console.warn('App.tsx پیدا نشد؛ route /admin/inventory را دستی اضافه کن.');
    return;
  }

  let app = fs.readFileSync(appPath, 'utf8');

  if (!app.includes("./admin/pages/Inventory") && !app.includes("./pages/admin/Inventory")) {
    app = app.replace(/(import\s+[^;]+;\s*)/, `$1\nimport Inventory from './admin/pages/Inventory';\n`);
  }

  if (!app.includes('path="/admin/inventory"')) {
    const route = `\n          <Route path="/admin/inventory" element={<Inventory />} />`;
    if (app.includes('path="/admin/orders"')) {
      app = app.replace(/(<Route[^>]+path="\/admin\/orders"[^\n]+\n?)/, `$1${route}\n`);
    } else if (app.includes('</Routes>')) {
      app = app.replace('</Routes>', `${route}\n        </Routes>`);
    } else {
      console.warn('محل Routes پیدا نشد؛ route /admin/inventory را دستی اضافه کن.');
    }
  }

  fs.writeFileSync(appPath, app);
  console.log('App.tsx برای مسیر /admin/inventory بررسی/اصلاح شد.');
}

function patchAdminMenu() {
  const layoutPath = layoutCandidates.find((candidate) => fs.existsSync(candidate));
  if (!layoutPath) {
    console.warn('فایل منوی پنل مدیریت پیدا نشد؛ لینک /admin/inventory را دستی به منو اضافه کن.');
    return;
  }

  let content = fs.readFileSync(layoutPath, 'utf8');
  if (content.includes('/admin/inventory')) {
    console.log('لینک انبارداری قبلاً در منو وجود دارد.');
    return;
  }

  const menuText = `\n            <a href="/admin/inventory" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">انبارداری</a>`;

  if (content.includes('/admin/orders')) {
    content = content.replace(/(<a[^>]+href=["']\/admin\/orders["'][\s\S]*?<\/a>)/, `$1${menuText}`);
  } else if (content.includes('</nav>')) {
    content = content.replace('</nav>', `${menuText}\n          </nav>`);
  } else {
    console.warn('محل nav پیدا نشد؛ لینک /admin/inventory را دستی اضافه کن.');
    return;
  }

  fs.writeFileSync(layoutPath, content);
  console.log(`لینک انبارداری به ${path.relative(root, layoutPath)} اضافه شد.`);
}

patchApp();
patchAdminMenu();
console.log('پچ انبارداری اعمال شد. SQL را هم در Supabase اجرا کن: docs/sql/2026_inventory_system.sql');
