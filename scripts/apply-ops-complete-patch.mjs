import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));
console.log('✅ Ops Complete workflow files copied.');
console.log('Next: run SQL docs/sql/2026_ops_complete_workflow.sql in Supabase.');
console.log('Test: /driver/jobs/test and /admin/dispatch');
