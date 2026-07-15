import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === '__patch__') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk(srcRoot);
const candidates = files
  .map(file => ({ file, text: fs.readFileSync(file, 'utf8') }))
  .filter(x =>
    x.text.includes('بازاریابی و محتوا') ||
    x.text.includes('سئو و متاتگ') ||
    x.text.includes('تخفیف‌ها و کمپین‌ها') ||
    x.text.includes('/admin/discounts')
  );

if (!candidates.length) {
  console.error('❌ فایل مرکز مسیرها پیدا نشد. متن‌های «بازاریابی و محتوا» یا «سئو و متاتگ» در src پیدا نشدند.');
  process.exit(1);
}

// Prefer actual page over patch/config files.
const chosen = candidates.sort((a, b) => {
  const score = (x) => {
    let s = 0;
    if (x.file.includes(`${path.sep}pages${path.sep}`)) s += 20;
    if (x.file.includes('QuickLinks')) s += 50;
    if (x.text.includes('بازاریابی و محتوا')) s += 20;
    if (x.text.includes('/admin/seo')) s += 10;
    if (x.text.includes('/admin/blog')) s += 10;
    if (x.file.includes(`${path.sep}navigation${path.sep}`)) s -= 5;
    return s;
  };
  return score(b) - score(a);
})[0];

const target = chosen.file;
let text = chosen.text;
console.log('🎯 فایل هدف:', path.relative(root, target));

if (text.includes('/admin/campaigns')) {
  console.log('✅ مسیر /admin/campaigns قبلاً در این فایل وجود دارد. تغییری لازم نیست.');
  process.exit(0);
}

const backup = `${target}.bak-campaign-${Date.now()}`;
fs.copyFileSync(target, backup);
console.log('🛟 بکاپ ساخته شد:', path.relative(root, backup));

const campaignObject = `
      { title: 'مدیریت کمپین‌ها', path: '/admin/campaigns', desc: 'مدیریت جشنواره‌ها، بنرها و فروش ویژه', icon: '🚀', badge: 'جدید' },`;

function insertAfter(pattern, src) {
  const idx = src.indexOf(pattern);
  if (idx < 0) return null;
  const lineEnd = src.indexOf('\n', idx);
  if (lineEnd < 0) return null;
  return src.slice(0, lineEnd + 1) + campaignObject + '\n' + src.slice(lineEnd + 1);
}

let next = null;

// Most common object-array formats.
const linePatterns = [
  "{ title: 'تخفیف‌ها و کمپین‌ها'",
  '{ title: "تخفیف‌ها و کمپین‌ها"',
  "['/admin/discounts'",
  '["/admin/discounts"',
  "path: '/admin/discounts'",
  'path: "/admin/discounts"',
  'href: \'/admin/discounts\'',
  'href: "/admin/discounts"',
];

for (const pat of linePatterns) {
  const maybe = insertAfter(pat, text);
  if (maybe) { next = maybe; break; }
}

// If we found Marketing section but not discounts line, insert after section items start.
if (!next) {
  const marketingIdx = text.indexOf('بازاریابی و محتوا');
  if (marketingIdx >= 0) {
    const itemsIdx = text.indexOf('items', marketingIdx);
    const bracketIdx = text.indexOf('[', itemsIdx >= 0 ? itemsIdx : marketingIdx);
    if (bracketIdx >= 0) {
      next = text.slice(0, bracketIdx + 1) + campaignObject + '\n' + text.slice(bracketIdx + 1);
    }
  }
}

if (!next) {
  console.error('❌ فایل هدف پیدا شد ولی محل امن برای افزودن آیتم کمپین پیدا نشد.');
  console.error('فایل:', path.relative(root, target));
  console.error('بکاپ بدون تغییر باقی ماند:', path.relative(root, backup));
  process.exit(1);
}

fs.writeFileSync(target, next, 'utf8');
const verify = fs.readFileSync(target, 'utf8');
if (!verify.includes('/admin/campaigns')) {
  console.error('❌ تغییر نوشته شد ولی verify ناموفق بود. فایل را از بکاپ برگردان.');
  process.exit(1);
}

console.log('✅ دکمه مدیریت کمپین‌ها به مرکز مسیرها اضافه شد.');
console.log('🔁 حالا Vite را ری‌استارت کن و /admin/quick-links را تست کن.');
