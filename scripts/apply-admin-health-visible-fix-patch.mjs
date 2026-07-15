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
if (!fs.existsSync(appPath)) {
  throw new Error('src/App.tsx پیدا نشد. لطفاً اسکریپت را از ریشه پروژه اجرا کن.');
}

let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes('AdminHealthButton')) {
  const importLine = `import AdminHealthButton from './admin/components/AdminHealthButton';\n`;
  const lastImportMatch = [...app.matchAll(/^import[\s\S]*?;\s*$/gm)].pop();
  if (lastImportMatch) {
    const idx = lastImportMatch.index + lastImportMatch[0].length;
    app = app.slice(0, idx) + '\n' + importLine + app.slice(idx);
  } else {
    app = importLine + app;
  }
}

if (!app.includes('<AdminHealthButton />')) {
  // Prefer inserting inside BrowserRouter/Router so useLocation works.
  if (app.includes('<BrowserRouter>')) {
    app = app.replace('<BrowserRouter>', '<BrowserRouter>\n      <AdminHealthButton />');
  } else if (app.includes('<Router>')) {
    app = app.replace('<Router>', '<Router>\n      <AdminHealthButton />');
  } else {
    // Fallback: insert before Routes if Router wrapper is unusual.
    app = app.replace('<Routes>', '<AdminHealthButton />\n      <Routes>');
  }
}

fs.writeFileSync(appPath, app, 'utf8');

console.log('✅ دکمه ثابت تست سلامت مسیرها به همه صفحات /admin اضافه شد.');
console.log('مسیر تست: /admin/navigation-audit');
