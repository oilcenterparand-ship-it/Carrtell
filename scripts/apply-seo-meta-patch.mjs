import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function ensureRoute() {
  const appPath = path.join(root, 'src', 'App.tsx');
  if (!fs.existsSync(appPath)) return;
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('SeoSettings')) {
    app = `import SeoSettings from './admin/pages/SeoSettings';\n` + app;
  }
  if (!app.includes('path="/admin/seo"')) {
    app = app.replace(/<Routes>/, '<Routes>\n        <Route path="/admin/seo" element={<SeoSettings />} />');
  }
  fs.writeFileSync(appPath, app);
}

function addQuickLink() {
  const candidates = [
    path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
    path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    let c = fs.readFileSync(file, 'utf8');
    if (c.includes('/admin/seo')) return;
    const linkText = "{ title: 'SEO و متاتگ‌ها', path: '/admin/seo', group: 'محتوا و سایت' },";
    c = c.replace(/const\s+.*links\s*=\s*\[/, (m) => `${m}\n  ${linkText}`);
    fs.writeFileSync(file, c);
    return;
  }
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));
ensureRoute();
addQuickLink();
console.log('✅ Carrtell SEO Meta patch applied.');
