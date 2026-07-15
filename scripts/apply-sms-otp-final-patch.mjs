import fs from 'fs';
import path from 'path';
const root = process.cwd();
const patch = path.join(root, '__patch__');
function copyDir(src, dest){ if(!fs.existsSync(src)) return; fs.mkdirSync(dest,{recursive:true}); for(const e of fs.readdirSync(src,{withFileTypes:true})){ const s=path.join(src,e.name), d=path.join(dest,e.name); if(e.isDirectory()) copyDir(s,d); else fs.copyFileSync(s,d);} }
function read(p){return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}
function write(p,c){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c)}
copyDir(path.join(patch,'src'), path.join(root,'src'));

const appPath = path.join(root,'src','App.tsx');
let app = read(appPath);
if(app){
  if(!app.includes('SmsSettings')) app = `import SmsSettings from './admin/pages/SmsSettings';\n` + app;
  if(!app.includes('OtpLoginPage')) app = `import OtpLoginPage from './pages/OtpLoginPage';\n` + app;
  if(!app.includes('/admin/sms-settings')) {
    app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/admin/sms-settings" element={<SmsSettings />} />`);
  }
  if(!app.includes('/login-otp')) {
    app = app.replace(/<Routes>/, `<Routes>\n        <Route path="/login-otp" element={<OtpLoginPage />} />`);
  }
  write(appPath, app);
}

// Add quick link structure-aware
const srcRoot = path.join(root,'src');
function walk(dir){let out=[]; if(!fs.existsSync(dir)) return out; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()) out=out.concat(walk(p)); else if(/\.(tsx|ts)$/.test(e.name)) out.push(p)} return out}
for(const file of walk(srcRoot)){
  let c=read(file);
  if(c.includes('/admin/sms-settings')) continue;
  if(c.includes('لاگ پیامک') || c.includes('sms-logs') || c.includes('پیامک')){
    const item = `{ title: 'تنظیمات پیامک و OTP', path: '/admin/sms-settings', desc: 'قالب‌ها، سرویس‌دهنده و ورود با کد پیامکی', icon: '📲' },`;
    if(c.includes('items: [')) c = c.replace(/items:\s*\[/, m=>m+'\n      '+item);
    else c += `\n// SMS Settings route: /admin/sms-settings\n`;
    write(file,c); break;
  }
}
console.log('✅ SMS OTP Final patch applied. Run SQL: docs/sql/2026_sms_otp_final.sql');
