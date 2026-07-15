import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');
const sqlSource = path.join(root, 'docs', 'sql', '2026_loyalty_wallet_policy_fix.sql');

console.log('Carrtell Loyalty SQL Policy Fix');
if (!fs.existsSync(sqlSource)) {
  console.warn('SQL file not found:', sqlSource);
  console.warn('Make sure you copied docs/sql/2026_loyalty_wallet_policy_fix.sql into the project root.');
} else {
  console.log('SQL fix is ready: docs/sql/2026_loyalty_wallet_policy_fix.sql');
}
console.log('Run this SQL in Supabase SQL Editor. No frontend files are changed by this patch.');
