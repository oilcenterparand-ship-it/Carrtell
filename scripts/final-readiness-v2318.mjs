import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

function fail(message) {
  console.error(`FINAL READINESS FAILED: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

if (!fs.existsSync(dist)) {
  fail('dist وجود ندارد؛ ابتدا Production Build بگیر.');
  process.exit(1);
}

const required = [
  'index.html',
  '.htaccess',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  path.join('brand', 'logo.png'),
];

for (const rel of required) {
  const target = path.join(dist, rel);
  if (!fs.existsSync(target)) fail(`فایل الزامی در dist نیست: ${rel}`);
  else pass(`dist/${rel}`);
}

const indexPath = path.join(dist, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const assetRefs = [...indexHtml.matchAll(/(?:src|href)=["']\/?([^"'?#]+)["']/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith('assets/'));

if (!assetRefs.length) {
  fail('index.html هیچ asset build شده‌ای ندارد.');
} else {
  for (const rel of assetRefs) {
    if (!fs.existsSync(path.join(dist, rel))) {
      fail(`asset اشاره‌شده در index.html وجود ندارد: ${rel}`);
    }
  }
  pass(`تمام ${assetRefs.length} asset اشاره‌شده در index.html موجودند`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const bundleFiles = walk(dist).filter((file) => /\.(?:js|css|html|json|webmanifest)$/i.test(file));
const combined = bundleFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

const forbiddenSecretMarkers = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'KAVENEGAR_API_KEY',
  'SEND_SMS_HOOK_SECRET',
  'KAVENEGAR_TEMPLATE=',
  'service_role',
];

for (const marker of forbiddenSecretMarkers) {
  if (combined.includes(marker)) fail(`نشانه Secret در dist پیدا شد: ${marker}`);
}
if (!process.exitCode) pass('هیچ Secret server-side شناخته‌شده‌ای در dist پیدا نشد');

const jsAssets = walk(path.join(dist, 'assets')).filter((file) => file.endsWith('.js'));
const cssAssets = walk(path.join(dist, 'assets')).filter((file) => file.endsWith('.css'));
if (jsAssets.length !== 1) {
  console.warn(`WARN: تعداد JS asset اصلی = ${jsAssets.length}. اگر فایل‌های hash قدیمی جمع شده‌اند، dist را پاک و Build تازه بگیر.`);
} else {
  pass('dist دارای یک JS bundle اصلی تمیز است');
}
if (cssAssets.length !== 1) {
  console.warn(`WARN: تعداد CSS asset اصلی = ${cssAssets.length}.`);
} else {
  pass('dist دارای یک CSS bundle اصلی تمیز است');
}

const htaccess = fs.readFileSync(path.join(dist, '.htaccess'), 'utf8');
if (!/RewriteRule\s+\.\s+\/index\.html\s+\[L\]/i.test(htaccess)) {
  fail('.htaccess fallback برای React Router پیدا نشد.');
} else {
  pass('.htaccess دارای SPA fallback است');
}

if (process.exitCode) process.exit(process.exitCode);

console.log('');
console.log('CARRTELL PRODUCTION SAFETY GATE: PASSED');
