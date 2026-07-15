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

function replaceOnce(file, search, replacement) {
  if (!fs.existsSync(file)) return false;
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(replacement.trim())) return true;
  if (!text.includes(search)) return false;
  text = text.replace(search, replacement);
  fs.writeFileSync(file, text);
  return true;
}

function injectAfter(file, marker, insertion) {
  if (!fs.existsSync(file)) return false;
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(insertion.trim())) return true;
  const idx = text.indexOf(marker);
  if (idx < 0) return false;
  const pos = idx + marker.length;
  text = text.slice(0, pos) + insertion + text.slice(pos);
  fs.writeFileSync(file, text);
  return true;
}

copyRecursive(path.join(patchRoot, 'src'), path.join(root, 'src'));

const appFile = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  if (!app.includes("NotificationCenterPage")) {
    app = app.replace(/(import .*?;\n)/s, `$1import NotificationCenterPage from './pages/NotificationCenterPage';\nimport NotificationsAdminPage from './admin/pages/Notifications';\n`);
  }
  if (!app.includes('path="/notifications"')) {
    app = app.replace(/<Routes>/, `<Routes>\n          <Route path="/notifications" element={<NotificationCenterPage />} />`);
  }
  if (!app.includes('path="/admin/notifications"')) {
    app = app.replace(/<Routes>/, `<Routes>\n          <Route path="/admin/notifications" element={<NotificationsAdminPage />} />`);
  }
  fs.writeFileSync(appFile, app);
}

const quickLinksCandidates = [
  path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
  path.join(root, 'src', 'admin', 'pages', 'QuickLinksPage.tsx'),
];
for (const file of quickLinksCandidates) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('/admin/notifications')) {
    const entry = `{ title: 'اعلان‌ها', path: '/admin/notifications', group: 'مدیریت' },\n  { title: 'مرکز اعلان‌های مشتری', path: '/notifications', group: 'مشتری' },`;
    text = text.replace(/(const .*?links.*?=\s*\[)/s, `$1\n  ${entry}`);
    fs.writeFileSync(file, text);
  }
}

console.log('✅ Notification Center patch applied. Routes: /notifications and /admin/notifications');
