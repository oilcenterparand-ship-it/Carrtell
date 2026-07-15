import fs from 'fs';
import path from 'path';

const root = process.cwd();
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

function patchFile(filePath, patcher) {
  if (!fs.existsSync(filePath)) return false;
  const before = fs.readFileSync(filePath, 'utf8');
  const after = patcher(before);
  if (after !== before) fs.writeFileSync(filePath, after, 'utf8');
  return after !== before;
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

// App route registration
const appPath = path.join(root, 'src', 'App.tsx');
patchFile(appPath, (src) => {
  let out = src;
  if (!out.includes('AuditLogs')) {
    const lastImport = out.match(/import[^;]+;\n/g)?.at(-1);
    if (lastImport) out = out.replace(lastImport, `${lastImport}import AuditLogs from './admin/pages/AuditLogs';\n`);
  }
  if (!out.includes('/admin/audit-logs')) {
    out = out.replace(/<Route\s+path="\/admin\/quick-links"[^\n]*\/>/, (m) => `${m}\n          <Route path="/admin/audit-logs" element={<AuditLogs />} />`);
    if (!out.includes('/admin/audit-logs')) {
      out = out.replace(/<Route\s+path="\/admin\/[^\n]+/, (m) => `${m}\n          <Route path="/admin/audit-logs" element={<AuditLogs />} />`);
    }
  }
  return out;
});

// Quick links enrichment (best effort)
const quickLinksCandidates = [
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
];
for (const qPath of quickLinksCandidates) {
  patchFile(qPath, (src) => {
    if (src.includes('/admin/audit-logs')) return src;
    const item = `{ title: 'گزارش فعالیت‌ها', path: '/admin/audit-logs', group: 'مدیریت', description: 'ردیابی تغییرات کارکنان، سفارش‌ها، انبار و مالی' },`;
    return src.replace(/(const\s+.*links\s*=\s*\[)/i, `$1\n  ${item}`);
  });
}

// Sidebar best effort
const layoutCandidates = [
  path.join(root, 'src', 'admin', 'AdminLayout.tsx'),
  path.join(root, 'src', 'admin', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'AdminLayout.tsx'),
];
for (const lPath of layoutCandidates) {
  patchFile(lPath, (src) => {
    if (src.includes('/admin/audit-logs')) return src;
    return src.replace(/(\/admin\/quick-links['"].*?[}\)],?)/s, `$1\n  { label: 'گزارش فعالیت‌ها', title: 'گزارش فعالیت‌ها', href: '/admin/audit-logs', path: '/admin/audit-logs' },`);
  });
}

console.log('✅ Carrtell Audit Logs patch applied.');
console.log('Next: run docs/sql/2026_audit_logs.sql in Supabase.');
