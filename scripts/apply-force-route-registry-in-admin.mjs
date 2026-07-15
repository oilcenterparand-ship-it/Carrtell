import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const qSrc = path.join(patchRoot, 'src/admin/pages/QuickLinks.tsx');
const qDest = path.join(root, 'src/admin/pages/QuickLinks.tsx');
const rSrc = path.join(patchRoot, 'src/admin/pages/AdminRouteRegistry.tsx');
const rDest = path.join(root, 'src/admin/pages/AdminRouteRegistry.tsx');
const appPath = path.join(root, 'src/App.tsx');

if (!fs.existsSync(qSrc)) throw new Error('Patch QuickLinks.tsx not found. Copy __patch__ to project root first.');
if (!fs.existsSync(qDest)) throw new Error('Active QuickLinks.tsx not found at src/admin/pages/QuickLinks.tsx');

fs.copyFileSync(qDest, qDest + `.bak-${Date.now()}`);
fs.copyFileSync(qSrc, qDest);
fs.copyFileSync(rSrc, rDest);

if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('AdminRouteRegistry')) {
    const importAnchor = app.match(/import\s+[^;]+from\s+['"]\.\/src\/admin\/pages\/QuickLinks['"];?/);
    if (importAnchor) {
      app = app.replace(importAnchor[0], `${importAnchor[0]}\nimport AdminRouteRegistry from './src/admin/pages/AdminRouteRegistry';`);
    } else {
      const lastImport = [...app.matchAll(/^import .*;$/gm)].pop();
      if (lastImport) {
        app = app.slice(0, lastImport.index + lastImport[0].length) + `\nimport AdminRouteRegistry from './admin/pages/AdminRouteRegistry';` + app.slice(lastImport.index + lastImport[0].length);
      }
    }
  }
  if (!app.includes('route-registry')) {
    app = app.replace(/<Route\s+path="quick-links"\s+element=\{<AdminQuickLinks\s*\/>\}\s*\/>/, (m) => `${m}\n            <Route path="route-registry" element={<AdminRouteRegistry />} />`);
    if (!app.includes('route-registry')) {
      app = app.replace(/<Route\s+path="\/admin\/quick-links"\s+element=\{<AdminQuickLinks\s*\/>\}\s*\/>/, (m) => `${m}\n        <Route path="/admin/route-registry" element={<AdminRouteRegistry />} />`);
    }
  }
  fs.writeFileSync(appPath, app, 'utf8');
}

console.log('✅ QuickLinks.tsx به‌صورت کامل جایگزین شد.');
console.log('✅ کارت Route Registry حتماً داخل /admin/quick-links قرار گرفت.');
console.log('🔁 Vite را کامل ریستارت کن: Ctrl+C سپس npm run dev');
