import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const stamp = Date.now();

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); }
function backup(p) { if (exists(p)) fs.copyFileSync(p, `${p}.bak-${stamp}`); }
function copy(rel) {
  const src = path.join(patchRoot, rel);
  const dest = path.join(root, rel);
  if (!exists(src)) throw new Error(`Patch file not found: ${src}`);
  backup(dest);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied ${rel}`);
}

function findFile(start, name) {
  const stack = [start];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules','.git','dist','build'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.name === name) return p;
    }
  }
  return null;
}

function patchApp() {
  const appPath = findFile(path.join(root, 'src'), 'App.tsx');
  if (!appPath) throw new Error('src/App.tsx not found');
  backup(appPath);
  let app = read(appPath);

  const importLine = `import PaymentSettings from './admin/pages/PaymentSettings';`;
  if (!app.includes("./admin/pages/PaymentSettings")) {
    const lastImport = [...app.matchAll(/^import .*?;$/gm)].pop();
    if (lastImport) {
      app = app.slice(0, lastImport.index + lastImport[0].length) + `\n${importLine}` + app.slice(lastImport.index + lastImport[0].length);
    } else {
      app = `${importLine}\n${app}`;
    }
  }

  // Replace existing payment-settings route if present.
  let replaced = false;
  app = app.replace(/<Route\s+path=["']\/admin\/payment-settings["'][^>]*element=\{<[^>]+>\}\s*\/>/g, () => {
    replaced = true;
    return '<Route path="/admin/payment-settings" element={<PaymentSettings />} />';
  });
  app = app.replace(/<Route\s+path=["']payment-settings["'][^>]*element=\{<[^>]+>\}\s*\/>/g, () => {
    replaced = true;
    return '<Route path="payment-settings" element={<PaymentSettings />} />';
  });

  if (!app.includes('path="/admin/payment-settings"') && !app.includes("path='/admin/payment-settings'") && !app.includes('path="payment-settings"')) {
    const route = '            <Route path="payment-settings" element={<PaymentSettings />} />';
    if (app.includes('path="quick-links"')) {
      app = app.replace(/(\s*<Route\s+path=["']quick-links["'][^\n]*\n?)/, `$1${route}\n`);
      replaced = true;
    } else if (app.includes('<Routes>')) {
      app = app.replace(/<Routes>/, `<Routes>\n          <Route path="/admin/payment-settings" element={<PaymentSettings />} />`);
      replaced = true;
    }
  }

  write(appPath, app);
  console.log(`patched App route: ${replaced ? 'updated/added' : 'checked'}`);
}

function ensureQuickLinksHasPayment() {
  // The current project already shows /admin/payment-settings. This is a safe verify/add for real QuickLinks file.
  const srcDir = path.join(root, 'src');
  const candidates = [];
  const stack = [srcDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules','.git','dist','build'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (/\.(tsx|ts)$/.test(ent.name)) {
        const s = read(p);
        if (s.includes('مرکز مسیرها') && (s.includes('/admin/quick-links') || s.includes('payment-settings'))) candidates.push(p);
      }
    }
  }
  for (const file of candidates) {
    let s = read(file);
    if (s.includes('/admin/payment-settings')) continue;
    if (s.includes('مالی')) {
      backup(file);
      const card = `{ title: 'تنظیمات پرداخت', path: '/admin/payment-settings', desc: 'مدیریت درگاه، کارت‌به‌کارت و پرداخت در محل', icon: '💳' },`;
      s = s.replace(/(title:\s*['"]مالی['"][\s\S]*?items:\s*\[)/, `$1\n      ${card}`);
      write(file, s);
      console.log(`quick-links payment card added: ${path.relative(root, file)}`);
      break;
    }
  }
}

copy('src/admin/services/paymentEngineApi.ts');
copy('src/admin/pages/PaymentSettings.tsx');
patchApp();
ensureQuickLinksHasPayment();

console.log('✅ Carrtell Payment Engine patch applied.');
console.log('Next: run docs/sql/2026_payment_engine.sql in Supabase.');
console.log('Test: /admin/payment-settings');
