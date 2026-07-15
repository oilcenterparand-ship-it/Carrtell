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

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appPath = path.join(root, 'src', 'App.tsx');
let app = read(appPath);
if (!app) {
  console.error('src/App.tsx پیدا نشد. فایل‌ها کپی شدند اما route اضافه نشد.');
  process.exit(1);
}

const importLine = "import AdminRouteRegistry from './admin/pages/AdminRouteRegistry';";
if (!app.includes(importLine)) {
  const lastImport = [...app.matchAll(/^import .*;$/gm)].pop();
  if (lastImport) {
    app = app.slice(0, lastImport.index + lastImport[0].length) + '\n' + importLine + app.slice(lastImport.index + lastImport[0].length);
  } else {
    app = importLine + '\n' + app;
  }
}

function addRouteIfMissing(source, routePath, elementName) {
  if (source.includes(`path=\"${routePath}\"`) || source.includes(`path='${routePath}'`)) return source;
  const route = `\n          <Route path=\"${routePath}\" element={<${elementName} />} />`;
  const routesClose = source.lastIndexOf('</Routes>');
  if (routesClose !== -1) return source.slice(0, routesClose) + route + '\n        ' + source.slice(routesClose);
  return source;
}

app = addRouteIfMissing(app, '/admin/quick-links', 'AdminRouteRegistry');
app = addRouteIfMissing(app, '/admin/route-registry', 'AdminRouteRegistry');

write(appPath, app);

console.log('✅ Admin Auto Route Registry نصب شد.');
console.log('مسیرها: /admin/quick-links و /admin/route-registry');
