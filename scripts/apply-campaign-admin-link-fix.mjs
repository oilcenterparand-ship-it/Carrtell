import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

function backup(file) {
  const stamp = Date.now();
  const bak = `${file}.bak-campaign-link-${stamp}`;
  fs.copyFileSync(file, bak);
  return bak;
}

function findQuickLinksFile() {
  const files = walk(srcDir);
  const candidates = files
    .map(file => ({ file, text: fs.readFileSync(file, 'utf8') }))
    .filter(x =>
      x.text.includes('/admin/quick-links') &&
      (x.text.includes('مرکز مسیرها') || x.text.includes('تست سلامت مسیرها')) &&
      (x.text.includes('items:') || x.text.includes('routes:') || x.text.includes('sections'))
    );

  candidates.sort((a,b) => {
    const score = (x) =>
      (x.file.includes('QuickLinks') ? 100 : 0) +
      (x.text.includes('داشبورد مدیریت') ? 20 : 0) +
      (x.text.includes('بازاریابی و محتوا') ? 20 : 0) +
      (x.file.includes('__patch__') ? -1000 : 0);
    return score(b) - score(a);
  });

  return candidates[0]?.file;
}

const quickLinksFile = findQuickLinksFile();
if (!quickLinksFile) {
  console.error('❌ فایل واقعی QuickLinks پیدا نشد. داخل VS Code عبارت «مرکز مسیرها» را سرچ کن و مسیر فایل را بررسی کن.');
  process.exit(1);
}

let src = fs.readFileSync(quickLinksFile, 'utf8');
if (src.includes('/admin/campaigns')) {
  console.log('ℹ️ مسیر /admin/campaigns از قبل داخل QuickLinks وجود دارد:', path.relative(root, quickLinksFile));
  process.exit(0);
}

const bak = backup(quickLinksFile);

const campaignObject = `
      { title: 'کمپین‌ها', path: '/admin/campaigns', desc: 'مدیریت جشنواره‌ها، بنرها و فروش ویژه', icon: '🎯', badge: 'جدید' },`;

let patched = false;

// Case 1: Persian sections with title/category and items array
const marketingSectionRegex = /(title\s*:\s*['"]بازاریابی و محتوا['"][\s\S]*?items\s*:\s*\[)([\s\S]*?)(\n\s*\])/m;
if (marketingSectionRegex.test(src)) {
  src = src.replace(marketingSectionRegex, (m, start, body, end) => {
    patched = true;
    return `${start}${campaignObject}${body}${end}`;
  });
}

// Case 2: array of routes in a section named marketing/content
if (!patched) {
  const routesMarketingRegex = /(title\s*:\s*['"]بازاریابی و محتوا['"][\s\S]*?routes\s*:\s*\[)([\s\S]*?)(\n\s*\])/m;
  if (routesMarketingRegex.test(src)) {
    src = src.replace(routesMarketingRegex, (m, start, body, end) => {
      patched = true;
      return `${start}\n      ['/admin/campaigns','کمپین‌ها'],${body}${end}`;
    });
  }
}

// Case 3: no marketing section; inject into first items array after quick-links/dashboard section
if (!patched) {
  const firstItemsRegex = /(items\s*:\s*\[)([\s\S]*?)(\n\s*\])/m;
  if (firstItemsRegex.test(src)) {
    src = src.replace(firstItemsRegex, (m, start, body, end) => {
      patched = true;
      return `${start}${body}${campaignObject}${end}`;
    });
  }
}

if (!patched) {
  fs.copyFileSync(bak, quickLinksFile);
  console.error('❌ ساختار QuickLinks قابل تشخیص نبود؛ فایل تغییر نکرد. بکاپ حفظ شد:', bak);
  process.exit(1);
}

fs.writeFileSync(quickLinksFile, src, 'utf8');

// Ensure route exists in App.tsx if possible
const appFile = path.join(srcDir, 'App.tsx');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  if (!app.includes('/admin/campaigns') && !app.includes('path="campaigns"')) {
    const importLine = `import Campaigns from './admin/pages/Campaigns';\n`;
    if (!app.includes("Campaigns")) {
      const lastImport = [...app.matchAll(/^import .*$/gm)].pop();
      if (lastImport) app = app.slice(0, lastImport.index + lastImport[0].length) + '\n' + importLine + app.slice(lastImport.index + lastImport[0].length);
    }
    const routeLineAbs = `        <Route path="/admin/campaigns" element={<Campaigns />} />\n`;
    const routeLineNested = `            <Route path="campaigns" element={<Campaigns />} />\n`;
    if (app.includes('<Route path="/admin/quick-links"')) {
      app = app.replace(/(\s*<Route path="\/admin\/quick-links"[^\n]*\n)/, `$1${routeLineAbs}`);
    } else if (app.includes('<Route path="quick-links"')) {
      app = app.replace(/(\s*<Route path="quick-links"[^\n]*\n)/, `$1${routeLineNested}`);
    } else {
      app = app.replace(/<Routes>/, `<Routes>\n${routeLineAbs}`);
    }
    fs.writeFileSync(appFile, app, 'utf8');
  }
}

console.log('✅ دکمه کمپین‌ها به مرکز مسیرها اضافه شد.');
console.log('فایل ویرایش‌شده:', path.relative(root, quickLinksFile));
console.log('بکاپ:', path.relative(root, bak));
console.log('تست: /admin/quick-links و /admin/campaigns');
