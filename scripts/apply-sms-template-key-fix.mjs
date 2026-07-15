import fs from 'fs';
import path from 'path';

const root = process.cwd();
const sqlSrc = path.join(root, '__patch__', 'docs', 'sql', '2026_sms_template_key_fix.sql');
const sqlDestDir = path.join(root, 'docs', 'sql');
const sqlDest = path.join(sqlDestDir, '2026_sms_template_key_fix.sql');

if (!fs.existsSync(sqlSrc)) {
  console.error('❌ فایل SQL داخل __patch__ پیدا نشد:', sqlSrc);
  process.exit(1);
}

fs.mkdirSync(sqlDestDir, { recursive: true });
fs.copyFileSync(sqlSrc, sqlDest);
console.log('✅ SMS Template Key Fix آماده شد.');
console.log('حالا این SQL را در Supabase اجرا کن:');
console.log('docs/sql/2026_sms_template_key_fix.sql');
