import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const patchRoot = path.resolve(here, '..', 'files');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.join(root, '.patch-backups', `baseline-header-category-${stamp}`);

const required = [
  'package.json',
  'src/components/Layout.tsx',
  'src/components/home/SmartCarHomeSections.tsx',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error(`فایل لازم پیدا نشد: ${rel}. پچ را از ریشه پروژه اجرا کن.`);
  }
}

const files = [
  'src/components/Layout.tsx',
  'src/components/home/SmartCarHomeSections.tsx',
];

for (const rel of files) {
  const target = path.join(root, rel);
  const source = path.join(patchRoot, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(target, backup);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`✓ ${rel}`);
}

console.log(`
بکاپ: ${backupRoot}`);
console.log('پچ هدر باریک و نوار دسته‌بندی با موفقیت اعمال شد.');
