import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patch = path.join(root, '__patch__');
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
copyDir(path.join(patch, 'src'), path.join(root, 'src'));

const app = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(app)) {
  let code = fs.readFileSync(app, 'utf8');
  if (!code.includes('CustomersCRM')) {
    code = `import CustomersCRM from './admin/pages/CustomersCRM';\n` + code;
  }
  if (!code.includes('/admin/customers-crm')) {
    code = code.replace(/<\/Routes>/, `  <Route path="/admin/customers-crm" element={<CustomersCRM />} />\n</Routes>`);
  }
  fs.writeFileSync(app, code);
}

const quickCandidates = [
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx')
];
for (const q of quickCandidates) {
  if (fs.existsSync(q)) {
    let code = fs.readFileSync(q, 'utf8');
    if (!code.includes('/admin/customers-crm')) {
      code = code.replace(/(\[\s*)/, `$1{ title: 'CRM مشتریان', path: '/admin/customers-crm', group: 'مدیریت' },\n`);
    }
    fs.writeFileSync(q, code);
  }
}
console.log('✅ Carrtell CRM patch applied. Run docs/sql/2026_customer_crm.sql in Supabase.');
