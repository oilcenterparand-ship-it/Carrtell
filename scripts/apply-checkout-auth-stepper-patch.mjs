import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const files = [
  'src/pages/CartPage.tsx',
  'src/pages/OtpLoginPage.tsx',
];

for (const relative of files) {
  const source = path.join(patchRoot, relative);
  const target = path.join(root, relative);
  if (!fs.existsSync(source)) throw new Error(`Patch source missing: ${source}`);
  if (!fs.existsSync(target)) throw new Error(`Project target missing: ${target}`);
  const backup = `${target}.bak-checkout-auth-${Date.now()}`;
  fs.copyFileSync(target, backup);
  fs.copyFileSync(source, target);
  console.log(`✅ Updated ${relative}`);
  console.log(`   Backup: ${backup}`);
}

console.log('\n✅ Checkout Auth Stepper applied.');
console.log('Test: /shop → add product → /cart → login → info → address → payment → invoice');
