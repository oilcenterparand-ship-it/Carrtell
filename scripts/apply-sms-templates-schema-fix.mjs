import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sqlPath = path.join(root, 'docs', 'sql', '2026_sms_templates_schema_fix.sql');

if (!fs.existsSync(sqlPath)) {
  console.error('❌ فایل SQL پیدا نشد:', sqlPath);
  process.exit(1);
}

console.log('✅ SMS Templates Schema Fix آماده است.');
console.log('SQL را در Supabase اجرا کن: docs/sql/2026_sms_templates_schema_fix.sql');
