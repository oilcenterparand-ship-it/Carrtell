import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`Patch folder not found: ${src}`);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function patchFile(file, transform) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return false;
  const before = fs.readFileSync(p, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(p, after, 'utf8');
  return true;
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

patchFile('src/App.tsx', (src) => {
  let out = src;
  if (!out.includes('SupportPage')) {
    out = out.replace(/import\s+ProfilePage[^;]*;\n?/, (m) => m + `import SupportPage from "./pages/SupportPage";\n`);
    if (!out.includes('import SupportPage')) out = `import SupportPage from "./pages/SupportPage";\n` + out;
  }
  if (!out.includes('AdminSupport')) {
    out = out.replace(/import\s+.*Admin.*;\n?/, (m) => m);
    out = `import AdminSupport from "./admin/pages/Support";\n` + out;
  }
  if (!out.includes('path="/profile/support"')) {
    out = out.replace(/<Route\s+path="\/profile"[^>]*element=\{<ProfilePage\s*\/>\}\s*\/>/, (m) => `${m}\n          <Route path="/profile/support" element={<SupportPage />} />`);
    if (!out.includes('path="/profile/support"')) {
      out = out.replace(/<Routes>/, `<Routes>\n          <Route path="/profile/support" element={<SupportPage />} />`);
    }
  }
  if (!out.includes('path="/admin/support"')) {
    out = out.replace(/<Routes>/, `<Routes>\n          <Route path="/admin/support" element={<AdminSupport />} />`);
  }
  return out;
});

console.log('✅ Support Tickets patch applied.');
console.log('Run SQL: docs/sql/2026_support_tickets.sql');
