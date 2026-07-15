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

function findAppFile() {
  const candidates = ['src/App.tsx', 'src/App.jsx', 'src/App.ts', 'src/App.js'];
  return candidates.map(p => path.join(root, p)).find(fs.existsSync);
}

function injectIntoApp(appPath) {
  let code = fs.readFileSync(appPath, 'utf8');
  let changed = false;

  if (!code.includes('AdminHealthFloatingButton')) {
    const importLine = "import AdminHealthFloatingButton from './components/AdminHealthFloatingButton';\n";
    const lastImport = [...code.matchAll(/^import .*?;\s*$/gm)].pop();
    if (lastImport) {
      const index = lastImport.index + lastImport[0].length;
      code = code.slice(0, index) + '\n' + importLine + code.slice(index);
    } else {
      code = importLine + code;
    }
    changed = true;
  }

  if (!code.includes('<AdminHealthFloatingButton />')) {
    if (code.includes('<BrowserRouter>')) {
      code = code.replace('<BrowserRouter>', '<BrowserRouter>\n      <AdminHealthFloatingButton />');
      changed = true;
    } else if (code.includes('<Router>')) {
      code = code.replace('<Router>', '<Router>\n      <AdminHealthFloatingButton />');
      changed = true;
    } else if (code.includes('<Routes>')) {
      code = code.replace('<Routes>', '<AdminHealthFloatingButton />\n      <Routes>');
      changed = true;
    } else {
      console.warn('⚠️ نتوانستم محل مناسب برای نمایش دکمه را در App پیدا کنم. فایل کامپوننت کپی شد ولی باید دستی اضافه شود.');
    }
  }

  if (changed) fs.writeFileSync(appPath, code, 'utf8');
  return changed;
}

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));
const appPath = findAppFile();
if (!appPath) {
  console.error('❌ فایل src/App پیدا نشد.');
  process.exit(1);
}
const changed = injectIntoApp(appPath);
console.log(changed ? '✅ دکمه ثابت تست سلامت مسیرها به پنل ادمین اضافه شد.' : '✅ دکمه قبلاً اضافه شده بود یا نیازی به تغییر نبود.');
console.log('مسیر تست: /admin/navigation-audit');
