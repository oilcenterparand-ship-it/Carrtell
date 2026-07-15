import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const pageSrc = path.join(patchRoot, 'src', 'pages', 'AdminDiscountsCampaignsPage.tsx');
const pageDest = path.join(root, 'src', 'pages', 'AdminDiscountsCampaignsPage.tsx');
const appPath = path.join(root, 'src', 'App.tsx');

function backup(file) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.bak-${Date.now()}`);
  }
}

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }

if (!fs.existsSync(pageSrc)) {
  console.error('❌ فایل پچ پیدا نشد:', pageSrc);
  process.exit(1);
}
if (!fs.existsSync(appPath)) {
  console.error('❌ src/App.tsx پیدا نشد. این پچ باید از ریشه پروژه اجرا شود.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(pageDest), { recursive: true });
backup(pageDest);
fs.copyFileSync(pageSrc, pageDest);
console.log('✅ صفحه مدیریت تخفیف‌ها و کمپین‌ها کپی شد:', pageDest);

backup(appPath);
let app = read(appPath);

if (!app.includes("AdminDiscountsCampaignsPage")) {
  const importLine = "import AdminDiscountsCampaignsPage from './pages/AdminDiscountsCampaignsPage';\n";
  const lastImportMatch = [...app.matchAll(/^import .*;\s*$/gm)].pop();
  if (lastImportMatch) {
    const idx = lastImportMatch.index + lastImportMatch[0].length;
    app = app.slice(0, idx) + '\n' + importLine + app.slice(idx);
  } else {
    app = importLine + app;
  }
}

const before = app;
app = app.replace(/<Route\s+path=["']\/admin\/discounts["'][^>]*element=\{<[^>]+\/>\}\s*\/>/g, '<Route path="/admin/discounts" element={<AdminDiscountsCampaignsPage />} />');
app = app.replace(/<Route\s+path=["']discounts["'][^>]*element=\{<[^>]+\/>\}\s*\/>/g, '<Route path="discounts" element={<AdminDiscountsCampaignsPage />} />');

if (!app.includes('path="/admin/discounts"') && !app.includes('path="discounts"')) {
  const route = '          <Route path="/admin/discounts" element={<AdminDiscountsCampaignsPage />} />\n';
  const marker = app.indexOf('<Routes>');
  if (marker !== -1) {
    app = app.replace('<Routes>', `<Routes>\n${route}`);
  } else {
    console.warn('⚠️ نتوانستم Route را خودکار اضافه کنم. صفحه ساخته شد اما App.tsx را دستی بررسی کن.');
  }
}

if (app === before) {
  console.log('ℹ️ Route قبلاً وجود داشت یا ساختار App متفاوت بود؛ import/page همچنان اعمال شد.');
}

write(appPath, app);
console.log('✅ مسیر /admin/discounts به صفحه جدید وصل شد.');
console.log('🔁 حالا Vite را ریستارت کن و برو به /admin/discounts');
