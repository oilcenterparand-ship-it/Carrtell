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

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('AdminNavigationAudit')) {
    const importsEnd = app.lastIndexOf("import ");
    // safer: insert after last import line
    const lines = app.split('\n');
    let idx = 0;
    while (idx < lines.length && lines[idx].trim().startsWith('import ')) idx++;
    lines.splice(idx, 0, "import AdminNavigationAudit from './admin/pages/AdminNavigationAudit';");
    app = lines.join('\n');
  } else if (!app.includes("from './admin/pages/AdminNavigationAudit'") && !app.includes('from "./admin/pages/AdminNavigationAudit"')) {
    const lines = app.split('\n');
    let idx = 0;
    while (idx < lines.length && lines[idx].trim().startsWith('import ')) idx++;
    lines.splice(idx, 0, "import AdminNavigationAudit from './admin/pages/AdminNavigationAudit';");
    app = lines.join('\n');
  }
  fs.writeFileSync(appPath, app);
}

console.log('✅ AdminNavigationAudit fix applied. Restart Vite.');
