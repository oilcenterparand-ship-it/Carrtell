import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function patchAppTsx() {
  const appPath = path.join(root, 'src', 'App.tsx');
  if (!fs.existsSync(appPath)) return console.warn('App.tsx not found; route patch skipped.');
  let src = fs.readFileSync(appPath, 'utf8');
  if (!src.includes('WalletPage')) {
    src = src.replace(/(import\s+[^\n]*ProfilePage[^\n]*;\n)/, `$1import WalletPage from './pages/WalletPage';\n`);
    if (!src.includes("./pages/WalletPage")) src = `import WalletPage from './pages/WalletPage';\n` + src;
  }
  if (!src.includes('LoyaltyAdminPage')) {
    const marker = "import";
    src = `import LoyaltyAdminPage from './admin/pages/Loyalty';\n` + src;
  }
  if (!src.includes('path="/profile/wallet"')) {
    src = src.replace(/<Route\s+path="\/profile"[^\n]*\/>/, (m) => `${m}\n          <Route path="/profile/wallet" element={<WalletPage />} />`);
    if (!src.includes('path="/profile/wallet"')) {
      src = src.replace(/<Routes>/, `<Routes>\n          <Route path="/profile/wallet" element={<WalletPage />} />`);
    }
  }
  if (!src.includes('path="/admin/loyalty"')) {
    src = src.replace(/<Routes>/, `<Routes>\n          <Route path="/admin/loyalty" element={<LoyaltyAdminPage />} />`);
  }
  fs.writeFileSync(appPath, src, 'utf8');
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));
patchAppTsx();
console.log('Carrtell Loyalty + Wallet patch applied.');
console.log('Run SQL: docs/sql/2026_loyalty_wallet.sql');
