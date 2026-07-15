import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
if (!fs.existsSync(patchRoot)) {
  console.error('پوشه __patch__ پیدا نشد. محتویات ZIP را در ریشه پروژه کپی کن.');
  process.exit(1);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(patchRoot, root);
console.log('✅ Discounts + Campaigns files copied.');
console.log('Next: add route /admin/discounts in App/Admin routes if not added automatically, then run SQL docs/sql/2026_discounts_campaigns.sql');
