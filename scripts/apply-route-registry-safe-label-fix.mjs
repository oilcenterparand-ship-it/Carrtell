import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const backupSuffix = `.bak-route-registry-${Date.now()}`;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '__patch__') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(p);
  }
  return out;
}

function writeBackup(file, content) {
  fs.writeFileSync(file + backupSuffix, content, 'utf8');
}

function addLabelToObject(content) {
  let changed = false;

  // Fix object that has path /admin/route-registry but missing title/label/name.
  content = content.replace(/\{([^{}]*path\s*:\s*['"]\/admin\/route-registry['"][^{}]*)\}/gs, (match, body) => {
    let next = body;
    if (!/(title|label|name)\s*:/.test(next)) {
      next = ` title: 'مدیریت مسیرها',` + next;
      changed = true;
    } else {
      next = next.replace(/(title|label|name)\s*:\s*['"][^'"]*['"]/, (m) => {
        if (m.includes('مدیریت مسیرها') || m.includes('Route Registry')) return m;
        changed = true;
        return m.replace(/['"][^'"]*['"]/, `'مدیریت مسیرها'`);
      });
    }
    if (!/(desc|description)\s*:/.test(next)) {
      next = next.replace(/path\s*:\s*['"]\/admin\/route-registry['"]\s*,?/, (m) => `${m} desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل',`);
      changed = true;
    }
    if (!/icon\s*:/.test(next)) {
      next = ` icon: '📍',` + next;
      changed = true;
    }
    return `{${next}}`;
  });

  // Fix array tuple form: ['/admin/route-registry'] -> ['/admin/route-registry','مدیریت مسیرها']
  content = content.replace(/\[\s*['"]\/admin\/route-registry['"]\s*\]/g, () => {
    changed = true;
    return `[ '/admin/route-registry', 'مدیریت مسیرها' ]`;
  });

  // Fix weird rendered route list object with blank title around route-registry.
  content = content.replace(/title\s*:\s*['"]\s*['"]\s*,\s*path\s*:\s*['"]\/admin\/route-registry['"]/g, () => {
    changed = true;
    return `title: 'مدیریت مسیرها', path: '/admin/route-registry'`;
  });

  return { content, changed };
}

function ensureRouteCardInQuickLinks(content) {
  if (content.includes("path: '/admin/route-registry'") || content.includes('path: "/admin/route-registry"') || content.includes("'/admin/route-registry'")) {
    return { content, changed: false };
  }

  const card = `
      { title: 'مدیریت مسیرها', path: '/admin/route-registry', desc: 'مشاهده و مدیریت تمام مسیرهای ثبت‌شده پنل', icon: '📍', badge: 'جدید' },`;

  // Insert after quick-links card if possible.
  const quickLinksObj = /\{[^{}]*(title|label|name)\s*:\s*['"]مرکز مسیرها['"][^{}]*path\s*:\s*['"]\/admin\/quick-links['"][^{}]*\}\s*,?/s;
  if (quickLinksObj.test(content)) {
    return { content: content.replace(quickLinksObj, (m) => `${m}${card}`), changed: true };
  }

  // Insert after dashboard management card if possible.
  const dashboardObj = /\{[^{}]*(title|label|name)\s*:\s*['"]داشبورد مدیریت['"][^{}]*\}\s*,?/s;
  if (dashboardObj.test(content)) {
    return { content: content.replace(dashboardObj, (m) => `${m}${card}`), changed: true };
  }

  return { content, changed: false };
}

const files = walk(srcDir);
const candidates = files.filter((file) => {
  const c = fs.readFileSync(file, 'utf8');
  return c.includes('/admin/route-registry') || c.includes('مرکز مسیرها') || c.includes('تست سلامت مسیرها') || /QuickLinks/i.test(file);
});

let changedFiles = [];
let routeRegistryFound = false;

for (const file of candidates) {
  const original = fs.readFileSync(file, 'utf8');
  let content = original;

  if (content.includes('/admin/route-registry')) routeRegistryFound = true;

  const fixed = addLabelToObject(content);
  content = fixed.content;

  // Only force add in likely QuickLinks/center page.
  if (/QuickLinks/i.test(file) || content.includes('مرکز مسیرهای پنل مدیریت Carrtell') || content.includes('همه مسیرهای ساخته‌شده پروژه')) {
    const added = ensureRouteCardInQuickLinks(content);
    content = added.content;
  }

  if (content !== original) {
    writeBackup(file, original);
    fs.writeFileSync(file, content, 'utf8');
    changedFiles.push(path.relative(root, file));
  }
}

// Ensure App route exists if App.tsx is present.
const appFile = path.join(srcDir, 'App.tsx');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  const original = app;
  if (!app.includes('/admin/route-registry') && !app.includes('path="route-registry"') && !app.includes("path='route-registry'")) {
    // Add import if file exists; otherwise add simple lazy fallback not needed.
    const routeLine = `<Route path="route-registry" element={<AdminRouteRegistry />} />`;
    if (app.includes('AdminRouteRegistry')) {
      app = app.replace(/<Route\s+path=["']quick-links["'][^\n]*\/?>/, (m) => `${m}\n              ${routeLine}`);
    }
  }
  if (app !== original) {
    writeBackup(appFile, original);
    fs.writeFileSync(appFile, app, 'utf8');
    changedFiles.push(path.relative(root, appFile));
  }
}

console.log('✅ Route Registry label/card fix completed.');
if (changedFiles.length) {
  console.log('Modified files:');
  for (const f of changedFiles) console.log(' - ' + f);
} else {
  console.log('⚠️ No files changed. The card may already be correct, or the active file has a different structure.');
}
console.log('Open: /admin/quick-links');
console.log('Expected visible card: 📍 مدیریت مسیرها -> /admin/route-registry');
