import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.dirname(new URL(import.meta.url).pathname).replace(/\/g, '/').replace('/scripts', '');

const files = [
  ['src/admin/pages/Dispatch.tsx', 'src/admin/pages/Dispatch.tsx'],
  ['src/admin/services/dispatchApi.ts', 'src/admin/services/dispatchApi.ts'],
  ['src/pages/DriverPage.tsx', 'src/pages/DriverPage.tsx'],
];

for (const [from, to] of files) {
  const src = path.join(patchRoot, from);
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('copied', to);
}

const appPath = path.join(root, 'src/App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("./admin/pages/Dispatch")) {
    app = app.replace(/(import .*Admin.*;
)/, `$1import Dispatch from './admin/pages/Dispatch';
`);
    app = app.replace(/(import .*DriverPage.*;
)/, `$1`);
    if (!app.includes("import DriverPage from './pages/DriverPage';")) app = app.replace(/(import .*;
)/, `$1import DriverPage from './pages/DriverPage';
`);
  }
  if (!app.includes('path="/admin/dispatch"')) {
    app = app.replace(/<Route path="\/admin\/service-fleet"[^
]*\/>/, match => `${match}
          <Route path="/admin/dispatch" element={<Dispatch />} />`);
    if (!app.includes('path="/admin/dispatch"')) app = app.replace(/<Route path="\/admin"[^>]*>/, m => `${m}
          <Route path="/admin/dispatch" element={<Dispatch />} />`);
  }
  if (!app.includes('path="/driver"')) {
    app = app.replace(/<Routes>/, '<Routes>
        <Route path="/driver" element={<DriverPage />} />');
  }
  fs.writeFileSync(appPath, app);
  console.log('updated src/App.tsx routes if possible');
}

const layoutCandidates = ['src/admin/AdminLayout.tsx','src/components/AdminLayout.tsx','src/admin/components/AdminLayout.tsx'];
for (const rel of layoutCandidates) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('/admin/dispatch')) {
    s = s.replace(/(<[^>]*to=['"]\/admin\/service-fleet['"][\s\S]*?<\/[^>]+>)/, `$1
          <NavLink to="/admin/dispatch">مرکز عملیات</NavLink>`);
    if (!s.includes('/admin/dispatch')) s += `
{/* Carrtell dispatch route: /admin/dispatch */}
`;
    fs.writeFileSync(p, s);
    console.log('updated admin layout hint', rel);
  }
}

console.log('Dispatch + Driver Ops patch applied. Now run docs/sql/2026_dispatch_driver_ops.sql in Supabase.');