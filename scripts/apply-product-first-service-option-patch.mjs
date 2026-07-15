import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const patchRoot = path.join(projectRoot, '__patch__');
const files = [
  'src/pages/BookPage.tsx',
  'src/pages/CartPage.tsx',
];

for (const relativePath of files) {
  const source = path.join(patchRoot, relativePath);
  const target = path.join(projectRoot, relativePath);
  if (!fs.existsSync(source)) throw new Error(`فایل پچ پیدا نشد: ${source}`);
  if (!fs.existsSync(target)) throw new Error(`فایل واقعی پروژه پیدا نشد: ${target}`);

  const backup = `${target}.bak-product-first-service-${Date.now()}`;
  fs.copyFileSync(target, backup);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`✅ ${relativePath}`);
  console.log(`   Backup: ${backup}`);
}

console.log('\n✅ Product First Service Option patch applied.');
console.log('Test flow: /shop → add product → /cart → address step → خرید + سرویس در محل');
console.log('Direct /book without cart now redirects the customer to choose a product first.');
