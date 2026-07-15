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
  if (!app.includes("./admin/pages/QuickLinks")) {
    app = app.replace(/(import[^\n]+;\s*)/, `$1\nimport QuickLinks from './admin/pages/QuickLinks';\n`);
  }
  if (!app.includes('path="/admin/quick-links"')) {
    app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/admin/quick-links" element={<QuickLinks />} />`);
  }
  fs.writeFileSync(appPath, app);
}

console.log('✅ Quick Links Merge Patch applied. Test: /admin/quick-links');
