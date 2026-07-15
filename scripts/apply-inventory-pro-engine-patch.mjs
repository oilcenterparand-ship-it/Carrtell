import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copy(srcRel, destRel) {
  const src = path.join(patchRoot, srcRel);
  const dest = path.join(root, destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('copied', destRel);
}

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }

copy('src/admin/pages/InventoryPro.tsx', 'src/admin/pages/InventoryPro.tsx');
copy('src/admin/services/inventoryProApi.ts', 'src/admin/services/inventoryProApi.ts');

const appPath = path.join(root, 'src/App.tsx');
let app = read(appPath);
if (app) {
  if (!app.includes('InventoryPro')) {
    const importLine = "import InventoryPro from './admin/pages/InventoryPro';\n";
    app = importLine + app;
  }
  const routePatterns = [
    /<Route\s+path=["']inventory["'][^>]*\/>/,
    /<Route\s+path=["']\/admin\/inventory["'][^>]*\/>/,
  ];
  let replaced = false;
  for (const pattern of routePatterns) {
    if (pattern.test(app)) {
      app = app.replace(pattern, '<Route path="inventory" element={<InventoryPro />} />');
      replaced = true;
      break;
    }
  }
  if (!replaced && app.includes('<Route path="quick-links"')) {
    app = app.replace(/<Route path="quick-links"[^\n]*\n/, (m) => `${m}            <Route path="inventory" element={<InventoryPro />} />\n`);
  }
  write(appPath, app);
}

const quickCandidates = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
      const c = read(p);
      if (c.includes('/admin/inventory') && (c.includes('انبار') || c.includes('موجودی'))) quickCandidates.push(p);
    }
  }
}
walk(path.join(root, 'src'));

for (const file of quickCandidates) {
  let c = read(file);
  if (c.includes('انبار حرفه‌ای')) continue;
  c = c.replace(/title:\s*['"]انبار['"]/g, "title: 'انبار حرفه‌ای'");
  c = c.replace(/desc:\s*['"][^'"]*['"](?=[^\n]*path:\s*['"]\/admin\/inventory['"])/g, "desc: 'کنترل موجودی، هشدار کمبود و گردش کالا'");
  write(file, c);
  console.log('updated quick link:', path.relative(root, file));
}

console.log('✅ Inventory Pro Engine applied. Run SQL: docs/sql/2026_inventory_pro_engine.sql');
