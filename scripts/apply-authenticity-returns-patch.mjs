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

function patchFile(file, patches) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return false;
  let text = fs.readFileSync(full, 'utf8');
  let changed = false;
  for (const p of patches) {
    if (p.type === 'append-import' && !text.includes(p.importLine)) {
      const importBlockEnd = text.lastIndexOf('import ');
      const firstNonImport = text.search(/\n(?!import\s)/);
      text = p.importLine + '\n' + text;
      changed = true;
    }
    if (p.type === 'before' && !text.includes(p.markerUnique)) {
      const idx = text.indexOf(p.find);
      if (idx !== -1) {
        text = text.slice(0, idx) + p.insert + '\n' + text.slice(idx);
        changed = true;
      }
    }
    if (p.type === 'replace' && text.includes(p.find) && !text.includes(p.markerUnique)) {
      text = text.replace(p.find, p.replace);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(full, text, 'utf8');
  return changed;
}

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

patchFile('src/App.tsx', [
  { type: 'append-import', importLine: "import ReturnsPage from './pages/profile/ReturnsPage';" },
  { type: 'append-import', importLine: "import AuthenticityCheckPage from './pages/AuthenticityCheckPage';" },
  { type: 'append-import', importLine: "import AdminReturns from './admin/pages/Returns';" },
  { type: 'append-import', importLine: "import AdminAuthenticity from './admin/pages/Authenticity';" },
  { type: 'before', find: '</Routes>', markerUnique: 'path="/profile/returns"', insert: '          <Route path="/profile/returns" element={<ReturnsPage />} />\n          <Route path="/authenticity" element={<AuthenticityCheckPage />} />\n          <Route path="/admin/returns" element={<AdminReturns />} />\n          <Route path="/admin/authenticity" element={<AdminAuthenticity />} />' }
]);

// Add quick links if a quick links page exists.
const quickCandidates = [
  'src/admin/pages/QuickLinks.tsx',
  'src/admin/pages/AdminQuickLinks.tsx',
  'src/admin/pages/QuickLinksPage.tsx'
];
for (const file of quickCandidates) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  let text = fs.readFileSync(full, 'utf8');
  if (!text.includes('/admin/authenticity')) {
    const item = `\n  { title: 'اصالت کالا', path: '/admin/authenticity', group: 'اعتماد و پشتیبانی' },\n  { title: 'مرجوعی و بررسی کالا', path: '/admin/returns', group: 'اعتماد و پشتیبانی' },\n  { title: 'بررسی اصالت عمومی', path: '/authenticity', group: 'مسیرهای عمومی' },\n  { title: 'درخواست مرجوعی مشتری', path: '/profile/returns', group: 'مسیرهای مشتری' },`;
    text = text.replace(/(const\s+.*links\s*=\s*\[)/i, `$1${item}`);
    fs.writeFileSync(full, text, 'utf8');
  }
}

console.log('✅ Authenticity + Returns patch applied. Now run docs/sql/2026_authenticity_returns.sql in Supabase.');
