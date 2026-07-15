import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function patchFile(file, updater) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return false;
  const old = fs.readFileSync(full, 'utf8');
  const next = updater(old);
  if (next !== old) fs.writeFileSync(full, next);
  return next !== old;
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

// Patch App routes if possible
patchFile('src/App.tsx', (src) => {
  let out = src;
  if (!out.includes("./admin/pages/Staff")) out = `import Staff from './admin/pages/Staff';\nimport Roles from './admin/pages/Roles';\n` + out;
  if (!out.includes('path="/admin/staff"')) {
    out = out.replace(/<Route\s+path="\/admin\/quick-links"[^>]*\/>/, (m) => `${m}\n          <Route path="/admin/staff" element={<Staff />} />\n          <Route path="/admin/roles" element={<Roles />} />`);
    if (!out.includes('path="/admin/staff"')) {
      out = out.replace(/<\/Routes>/, `          <Route path="/admin/staff" element={<Staff />} />\n          <Route path="/admin/roles" element={<Roles />} />\n        </Routes>`);
    }
  }
  return out;
});

// Patch quick links if a data array exists
const quickFiles = ['src/admin/pages/QuickLinks.tsx', 'src/admin/pages/AdminQuickLinks.tsx'];
for (const file of quickFiles) {
  patchFile(file, (src) => {
    if (src.includes('/admin/staff')) return src;
    const item = `\n  { title: 'مدیریت کارکنان', path: '/admin/staff', group: 'مدیریت', description: 'کارکنان، وضعیت فعالیت و اتصال به نقش‌ها' },\n  { title: 'نقش‌ها و دسترسی‌ها', path: '/admin/roles', group: 'مدیریت', description: 'سطوح دسترسی پرسنل Carrtell' },`;
    return src.replace(/(const\s+.*links\s*=\s*\[)/i, `$1${item}`);
  });
}

// Patch common sidebar layouts with simple links
const layoutFiles = ['src/admin/AdminLayout.tsx', 'src/admin/components/AdminSidebar.tsx', 'src/components/AdminLayout.tsx'];
for (const file of layoutFiles) {
  patchFile(file, (src) => {
    if (src.includes('/admin/staff')) return src;
    const links = `\n        <a href="/admin/staff" className="admin-nav-link">کارکنان</a>\n        <a href="/admin/roles" className="admin-nav-link">نقش‌ها</a>`;
    if (src.includes('/admin/quick-links')) return src.replace(/(<a[^>]+href=["']\/admin\/quick-links["'][\s\S]*?<\/a>)/, `$1${links}`);
    return src;
  });
}

console.log('✅ Carrtell Staff + Roles patch applied. Run SQL: docs/sql/2026_staff_roles_permissions.sql');
