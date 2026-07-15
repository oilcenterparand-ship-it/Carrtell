import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
let app = read(appPath);
if (app) {
  if (!app.includes('AdminQuickLinks')) {
    app = app.replace(/(import\s+[^;]+;\s*)/, `$1\nimport AdminQuickLinks from "./admin/pages/AdminQuickLinks";\nimport AdminNavigationAudit from "./admin/pages/AdminNavigationAudit";\n`);
  }

  const quickRoute = '<Route path="/admin/quick-links" element={<AdminQuickLinks />} />';
  const auditRoute = '<Route path="/admin/navigation-audit" element={<AdminNavigationAudit />} />';

  if (!app.includes('/admin/quick-links')) {
    app = app.replace(/<Routes>/, `<Routes>\n          ${quickRoute}`);
  }
  if (!app.includes('/admin/navigation-audit')) {
    app = app.replace(/<Routes>/, `<Routes>\n          ${auditRoute}`);
  }

  write(appPath, app);
}

const candidateLayoutFiles = [
  path.join(root, 'src', 'admin', 'AdminLayout.tsx'),
  path.join(root, 'src', 'admin', 'layout', 'AdminLayout.tsx'),
  path.join(root, 'src', 'admin', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'Layout.tsx'),
];

for (const file of candidateLayoutFiles) {
  let content = read(file);
  if (!content || content.includes('/admin/quick-links')) continue;

  const linkBlock = `\n<a href="/admin/quick-links" className="admin-nav-link quick-links-link">مرکز مسیرها</a>\n<a href="/admin/navigation-audit" className="admin-nav-link quick-links-link">ممیزی مسیرها</a>\n`;

  if (content.includes('/admin/orders')) {
    content = content.replace(/(<[^>]+href=["']\/admin\/orders["'][\s\S]*?<\/a>)/, `$1${linkBlock}`);
    write(file, content);
  } else if (content.includes('NavLink') || content.includes('Link')) {
    content = content.replace(/(<\/nav>)/, `${linkBlock}$1`);
    write(file, content);
  }
}

console.log('✅ Carrtell Admin Navigation Sync patch applied.');
console.log('Open: /admin/quick-links');
console.log('Audit: /admin/navigation-audit');
