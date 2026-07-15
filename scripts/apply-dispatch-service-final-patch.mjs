import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

function copy(relative) {
  const src = path.join(patchRoot, relative);
  const dest = path.join(root, relative);
  if (!fs.existsSync(src)) throw new Error(`Patch file not found: ${relative}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) fs.copyFileSync(dest, `${dest}.bak-dispatch-final-${stamp}`);
  fs.copyFileSync(src, dest);
  console.log(`updated: ${relative}`);
}

[
  'src/admin/services/dispatchApi.ts',
  'src/admin/pages/Dispatch.tsx',
  'src/driver/services/driverJobsApi.ts',
  'src/driver/pages/DriverJobDetail.tsx',
].forEach(copy);

const appPath = path.join(root, 'src', 'App.tsx');
let app = fs.readFileSync(appPath, 'utf8');
const backup = `${appPath}.bak-dispatch-final-${stamp}`;
fs.copyFileSync(appPath, backup);

if (!app.includes("from './admin/pages/Dispatch'")) {
  const anchor = "import AdminServiceRequests from './admin/pages/ServiceRequests';";
  if (!app.includes(anchor)) throw new Error('App.tsx import anchor not found. No changes applied to App.tsx.');
  app = app.replace(anchor, `${anchor}\nimport AdminDispatch from './admin/pages/Dispatch';`);
}

if (!app.includes('path="dispatch"')) {
  const anchor = '<Route path="service-requests" element={<AdminServiceRequests />} />';
  if (!app.includes(anchor)) throw new Error('App.tsx admin route anchor not found.');
  app = app.replace(anchor, `${anchor}\n            <Route path="dispatch" element={<AdminDispatch />} />`);
}

fs.writeFileSync(appPath, app, 'utf8');
console.log('updated: src/App.tsx');
console.log('✅ Dispatch & Service Final patch applied.');
console.log('Next: run docs/sql/2026_dispatch_service_final.sql in Supabase.');
console.log('Test: /admin/dispatch, /driver/dashboard, /driver/jobs/test');
