import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, '__patch__', 'docs', 'sql', '2026_sms_otp_final_sql_fix.sql');
const dest = path.join(root, 'docs', 'sql', '2026_sms_otp_final_sql_fix.sql');

if (!fs.existsSync(src)) {
  console.error('Patch source not found:', src);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('✅ SMS OTP SQL fix copied to docs/sql/2026_sms_otp_final_sql_fix.sql');
console.log('حالا همین فایل SQL را در Supabase اجرا کن.');
