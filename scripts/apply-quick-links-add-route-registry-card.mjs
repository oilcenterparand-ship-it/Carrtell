import fs from 'fs';
import path from 'path';

const root = process.cwd();
const candidates = [
  'src/admin/pages/QuickLinks.tsx',
  'src/admin/pages/QuickLinksPage.tsx',
  'src/admin/QuickLinks.tsx',
  'src/pages/admin/QuickLinks.tsx',
];

function exists(p){ return fs.existsSync(path.join(root,p)); }
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function write(p,s){ fs.writeFileSync(path.join(root,p),s,'utf8'); }

const target = candidates.find(exists);
if (!target) {
  console.error('❌ فایل QuickLinks پیدا نشد. یکی از مسیرهای زیر باید وجود داشته باشد:');
  console.error(candidates.join('\n'));
  process.exit(1);
}

let src = read(target);
if (src.includes('/admin/route-registry') || src.includes('مدیریت مسیرها')) {
  console.log('✅ کارت Route Registry قبلاً داخل Quick Links وجود دارد.');
  process.exit(0);
}

const cardJsx = `
        <a
          href="/admin/route-registry"
          className="group rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-slate-800/90 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-white">📍 مدیریت مسیرها</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                مشاهده و مدیریت تمام مسیرهای پنل، صفحات جدید و وضعیت دسترسی Routeها
              </p>
            </div>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
              Route Registry
            </span>
          </div>
          <div className="mt-4 text-sm font-bold text-amber-300 group-hover:text-amber-200">
            ورود به مدیریت مسیرها ←
          </div>
        </a>
`;

// Try to inject into an existing grid/list of quick link cards, before closing of first large grid.
const gridPatterns = [
  /(<div[^>]+className=["'][^"']*(?:grid|quick|links)[^"']*["'][^>]*>)([\s\S]*?)(\n\s*<\/div>)/i,
  /(<section[^>]*>)([\s\S]*?)(\n\s*<\/section>)/i,
];
let changed = false;
for (const pattern of gridPatterns) {
  const m = src.match(pattern);
  if (m) {
    const replacement = m[1] + m[2] + cardJsx + m[3];
    src = src.replace(pattern, replacement);
    changed = true;
    break;
  }
}

if (!changed) {
  // Fallback: insert just after return opening if possible
  src = src.replace(/return\s*\(\s*(<[^>]+>)/, (all, firstTag) => `return (\n    <>\n${cardJsx}\n      ${firstTag}`);
  src = src.replace(/\n\s*\);\s*\n}\s*$/, `\n    </>\n  );\n}\n`);
  changed = src.includes('/admin/route-registry');
}

if (!changed) {
  console.error('❌ نتوانستم کارت را خودکار اضافه کنم. ساختار QuickLinks ناشناخته است:', target);
  process.exit(1);
}

write(target, src);
console.log('✅ کارت «مدیریت مسیرها» به /admin/quick-links اضافه شد:', target);
console.log('🔁 حالا Vite را refresh/restart کن و برو به /admin/quick-links');
