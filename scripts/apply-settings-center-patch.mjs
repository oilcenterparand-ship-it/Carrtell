import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function patchFile(filePath, transform) {
  if (!fs.existsSync(filePath)) return false;
  const before = fs.readFileSync(filePath, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(filePath, after, 'utf8');
  return after !== before;
}

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
patchFile(appPath, (content) => {
  let next = content;
  if (!next.includes('SystemSettingsCenter')) {
    next = next.replace(/import\s+.*?Settings.*?from.*?;\n/i, (m) => m + "import SystemSettingsCenter from './admin/pages/SystemSettingsCenter';\n");
    if (!next.includes("./admin/pages/SystemSettingsCenter")) {
      next = "import SystemSettingsCenter from './admin/pages/SystemSettingsCenter';\n" + next;
    }
  }
  if (!next.includes('path="/admin/settings"')) {
    next = next.replace(/<Routes>/, '<Routes>\n        <Route path="/admin/settings" element={<SystemSettingsCenter />} />');
  }
  return next;
});

const quickLinksCandidates = [
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'QuickLinksPage.tsx'),
];
for (const quickPath of quickLinksCandidates) {
  patchFile(quickPath, (content) => {
    if (content.includes('/admin/settings')) return content;
    return content.replace(/\[(\s*\{)/, '[\n  { title: \'مرکز تنظیمات\', path: \'/admin/settings\', description: \'تنظیمات فروشگاه، سرویس، سفارش، پیامک، نقشه و ظاهر سایت\' },\n  $1');
  });
}

const layoutCandidates = [
  path.join(root, 'src', 'admin', 'AdminLayout.tsx'),
  path.join(root, 'src', 'admin', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'AdminLayout.tsx'),
];
for (const layoutPath of layoutCandidates) {
  patchFile(layoutPath, (content) => {
    if (content.includes('/admin/settings')) return content;
    return content.replace(/(href|to)=["']\/admin\/quick-links["'][^>]*>[^<]*/,
      (m) => `${m}</a>\n<a href="/admin/settings" className="admin-nav-link">تنظیمات سیستم`);
  });
}

console.log('✅ Carrtell Settings Center patch applied.');
console.log('Next: run docs/sql/2026_admin_settings_center.sql in Supabase.');
