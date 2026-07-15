import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.resolve('carrtell-dashboard-investor-patch');

function copy(srcRel, destRel) {
  const src = path.join(patchRoot, srcRel);
  const dest = path.join(root, destRel);
  if (!fs.existsSync(src)) throw new Error(`Missing patch file: ${srcRel}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied ${destRel}`);
}

copy('src/admin/services/dashboardApi.ts', 'src/admin/services/dashboardApi.ts');
copy('src/admin/pages/AdminDashboard.tsx', 'src/admin/pages/AdminDashboard.tsx');
copy('src/admin/pages/InvestorReport.tsx', 'src/admin/pages/InvestorReport.tsx');
copy('docs/sql/2026_dashboard_investor_report.sql', 'docs/sql/2026_dashboard_investor_report.sql');

const appPath = path.join(root, 'src/App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes("./admin/pages/AdminDashboard")) {
    app = app.replace(/(import .*? from ['"].*?['"];\n)/, `$1import AdminDashboard from './admin/pages/AdminDashboard';\nimport InvestorReport from './admin/pages/InvestorReport';\n`);
  }
  if (!app.includes('path="/admin/dashboard"')) {
    app = app.replace(/<Route path="\/admin\/finance"[^\n]*\/?>/, (m) => `${m}\n          <Route path="/admin/dashboard" element={<AdminDashboard />} />\n          <Route path="/admin/investor-report" element={<InvestorReport />} />`);
    if (!app.includes('path="/admin/dashboard"')) {
      app = app.replace(/<Routes>/, `<Routes>\n          <Route path="/admin/dashboard" element={<AdminDashboard />} />\n          <Route path="/admin/investor-report" element={<InvestorReport />} />`);
    }
  }
  fs.writeFileSync(appPath, app);
  console.log('updated src/App.tsx routes');
}

console.log('\nDone. Run TypeScript check and then execute docs/sql/2026_dashboard_investor_report.sql in Supabase.');
