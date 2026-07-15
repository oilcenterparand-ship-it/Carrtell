import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) copyRecursive(path.join(src, item), path.join(dest, item));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("./admin/pages/SmartSales")) {
    app = app.replace(/(import\s+.*?from\s+['\"]\.\/admin\/pages\/.*?['\"];\s*)/s, `$1\nimport SmartSales from './admin/pages/SmartSales';\n`);
    if (!app.includes("./admin/pages/SmartSales")) app = `import SmartSales from './admin/pages/SmartSales';\n${app}`;
  }
  if (!app.includes('path="/admin/smart-sales"')) {
    app = app.replace(/<Route\s+path=['\"]\/admin\/quick-links['\"][^>]*>/, `<Route path="/admin/smart-sales" element={<SmartSales />} />\n        $&`);
    if (!app.includes('path="/admin/smart-sales"')) {
      app = app.replace(/<\/Routes>/, `  <Route path="/admin/smart-sales" element={<SmartSales />} />\n</Routes>`);
    }
  }
  fs.writeFileSync(appPath, app);
}

console.log('✅ Smart Sales Engine patch applied. Run SQL: docs/sql/2026_smart_sales_engine.sql');
