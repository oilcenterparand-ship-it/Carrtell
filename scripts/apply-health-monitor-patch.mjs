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
  const imports = [
    `import SystemHealth from './admin/pages/SystemHealth';`,
    `import BugReports from './admin/pages/BugReports';`,
    `import ReportBugPage from './pages/ReportBugPage';`,
  ];
  for (const imp of imports) if (!app.includes(imp)) app = imp + '\n' + app;
  const routes = [
    `<Route path="/admin/system-health" element={<SystemHealth />} />`,
    `<Route path="/admin/bug-reports" element={<BugReports />} />`,
    `<Route path="/report-bug" element={<ReportBugPage />} />`,
  ];
  for (const route of routes) {
    if (!app.includes(route)) app = app.replace(/<\/Routes>/, `  ${route}\n</Routes>`);
  }
  fs.writeFileSync(appPath, app);
}

const quickLinksCandidates = [
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
];
for (const q of quickLinksCandidates) {
  if (!fs.existsSync(q)) continue;
  let txt = fs.readFileSync(q, 'utf8');
  const additions = [
    { title: 'تست سلامت سیستم', path: '/admin/system-health', group: 'مدیریت' },
    { title: 'گزارش باگ‌ها', path: '/admin/bug-reports', group: 'مدیریت' },
    { title: 'ثبت گزارش مشکل', path: '/report-bug', group: 'عمومی' },
  ];
  for (const a of additions) {
    if (!txt.includes(a.path)) {
      txt = txt.replace(/\];/, `  ${JSON.stringify(a)},\n];`);
    }
  }
  fs.writeFileSync(q, txt);
}

console.log('Carrtell Health Monitor patch applied.');
