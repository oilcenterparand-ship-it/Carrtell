import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const srcDir = path.join(root, 'src');
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, 'utf8'); };
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const backup = (p) => { if (fs.existsSync(p)) fs.copyFileSync(p, `${p}.bak-${Date.now()}`); };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

function relImport(fromFile, toFileNoExt) {
  let rel = path.relative(path.dirname(fromFile), toFileNoExt).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

// 1) copy service and page
copy(path.join(patchRoot, 'src/admin/services/campaignsApi.ts'), path.join(srcDir, 'admin/services/campaignsApi.ts'));
copy(path.join(patchRoot, 'src/pages/CampaignsAdminPage.tsx'), path.join(srcDir, 'pages/CampaignsAdminPage.tsx'));

// 2) patch App route in actual App.tsx
const appPath = path.join(srcDir, 'App.tsx');
let app = read(appPath);
if (!app) throw new Error('src/App.tsx پیدا نشد.');
backup(appPath);

if (!app.includes('CampaignsAdminPage')) {
  const importPath = relImport(appPath, path.join(srcDir, 'pages/CampaignsAdminPage'));
  const lastImport = app.match(/import[^;]+;\s*/g)?.pop();
  if (lastImport) app = app.replace(lastImport, `${lastImport}import CampaignsAdminPage from '${importPath}';\n`);
  else app = `import CampaignsAdminPage from '${importPath}';\n${app}`;
}

if (!app.includes('/admin/campaigns') && !app.includes('path="campaigns"')) {
  const routeAbs = '<Route path="/admin/campaigns" element={<CampaignsAdminPage />} />';
  const routeNested = '<Route path="campaigns" element={<CampaignsAdminPage />} />';
  if (app.includes('path="quick-links"')) {
    app = app.replace(/<Route\s+path="quick-links"[^\n]*\n?/, (m) => `${m}            ${routeNested}\n`);
  } else if (app.includes('/admin/quick-links')) {
    app = app.replace(/<Route\s+path="\/admin\/quick-links"[^\n]*\n?/, (m) => `${m}        ${routeAbs}\n`);
  } else {
    app = app.replace(/<Routes>/, `<Routes>\n        ${routeAbs}`);
  }
}
write(appPath, app);

// 3) structure-aware quick-links registration
const files = walk(srcDir);
const quickFile = files.find((f) => {
  const c = read(f);
  return c.includes('مرکز مسیرها') && c.includes('تست سلامت مسیرها') && c.includes('/admin/quick-links');
});

if (quickFile) {
  let q = read(quickFile);
  backup(quickFile);
  if (!q.includes('/admin/campaigns')) {
    const item = `\n      { title: 'کمپین‌های فروش', path: '/admin/campaigns', desc: 'مدیریت جشنواره‌ها، بنرهای کمپین و فروش ویژه', icon: '🎯', badge: 'جدید' },`;
    if (q.includes("title: 'تخفیف‌ها و کمپین‌ها'")) {
      q = q.replace(/\{\s*title:\s*['"]تخفیف‌ها و کمپین‌ها['"][\s\S]*?\},/, (m) => `${m}${item}`);
    } else if (q.includes("بازاریابی و محتوا")) {
      q = q.replace(/items:\s*\[/, (m) => m + item);
    } else if (q.includes("title: 'داشبورد مدیریت'")) {
      q = q.replace(/\{\s*title:\s*['"]داشبورد مدیریت['"][\s\S]*?\},/, (m) => `${m}${item}`);
    } else {
      q = q.replace(/items:\s*\[/, (m) => m + item);
    }
  }
  write(quickFile, q);
  console.log('✅ مسیر /admin/campaigns داخل مرکز مسیرها ثبت شد:', path.relative(root, quickFile));
} else {
  console.warn('⚠️ فایل فعال QuickLinks پیدا نشد. مسیر /admin/campaigns در App اضافه شد ولی مرکز مسیرها دستی بررسی شود.');
}

console.log('✅ Campaign Manager patch applied.');
console.log('SQL: docs/sql/2026_campaign_manager.sql');
console.log('Open: /admin/campaigns');
