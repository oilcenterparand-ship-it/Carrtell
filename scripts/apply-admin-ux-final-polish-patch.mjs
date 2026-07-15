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
copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("AdminQuickLinks")) {
    app = `import AdminQuickLinks from './admin/pages/AdminQuickLinks';\n` + app;
  }
  if (!app.includes("path=\"/admin/quick-links\"")) {
    app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/admin/quick-links" element={<AdminQuickLinks />} />`);
  }
  fs.writeFileSync(appPath, app);
}

const layoutCandidates = [
  path.join(root, 'src', 'admin', 'AdminLayout.tsx'),
  path.join(root, 'src', 'admin', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'AdminLayout.tsx'),
  path.join(root, 'src', 'components', 'Layout.tsx'),
];
for (const file of layoutCandidates) {
  if (!fs.existsSync(file)) continue;
  let txt = fs.readFileSync(file, 'utf8');
  if (!txt.includes('AdminTopBar')) {
    const rel = file.includes(path.join('src','admin','components')) ? './AdminTopBar' : file.includes(path.join('src','admin')) ? './components/AdminTopBar' : '../admin/components/AdminTopBar';
    txt = `import AdminTopBar from '${rel}';\n` + txt;
  }
  if (!txt.includes('<AdminTopBar />')) {
    txt = txt.replace(/(<Outlet\s*\/?>)/, `<AdminTopBar />\n$1`);
    txt = txt.replace(/({children})/, `<AdminTopBar />\n$1`);
  }
  fs.writeFileSync(file, txt);
  break;
}

console.log('✅ Admin UX Final Polish applied. Restart Vite and open /admin/quick-links');
