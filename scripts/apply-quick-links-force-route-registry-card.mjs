import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, '__patch__', 'src', 'admin', 'pages', 'QuickLinks.tsx');
const destDir = path.join(root, 'src', 'admin', 'pages');
const dest = path.join(destDir, 'QuickLinks.tsx');

if (!fs.existsSync(src)) {
  console.error('Patch file not found:', src);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
if (fs.existsSync(dest)) {
  const backup = dest + '.backup-' + Date.now();
  fs.copyFileSync(dest, backup);
  console.log('Backup created:', backup);
}
fs.copyFileSync(src, dest);
console.log('QuickLinks.tsx overwritten successfully. Route Registry card is now inside /admin/quick-links.');
