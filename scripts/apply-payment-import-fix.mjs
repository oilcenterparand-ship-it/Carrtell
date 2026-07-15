import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const appPath = path.join(srcDir, 'App.tsx');

function fail(message) {
  console.error('❌ ' + message);
  process.exit(1);
}

function exists(p) {
  return fs.existsSync(p);
}

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function write(p, content) {
  fs.writeFileSync(p, content, 'utf8');
}

function backup(filePath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.bak-payment-import-${stamp}`;
  fs.copyFileSync(filePath, backupPath);
  console.log('🧷 Backup:', path.relative(root, backupPath));
}

function walk(dir) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '__patch__'].includes(entry.name)) continue;
      out.push(...walk(p));
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

function ensureFallbackPaymentSettings() {
  const fallbackPath = path.join(srcDir, 'pages', 'PaymentSettings.tsx');
  if (exists(fallbackPath)) return fallbackPath;
  fs.mkdirSync(path.dirname(fallbackPath), { recursive: true });
  write(fallbackPath, `import React, { useEffect, useState } from 'react';\nimport { supabase } from '../lib/supabase';\n\ntype PaymentSettingsState = {\n  online_enabled: boolean;\n  card_to_card_enabled: boolean;\n  cash_on_delivery_enabled: boolean;\n  gateway_provider: string;\n  merchant_id: string;\n  sandbox_mode: boolean;\n};\n\nconst defaultSettings: PaymentSettingsState = {\n  online_enabled: true,\n  card_to_card_enabled: false,\n  cash_on_delivery_enabled: false,\n  gateway_provider: 'zarinpal',\n  merchant_id: '',\n  sandbox_mode: true,\n};\n\nexport default function PaymentSettings() {\n  const [settings, setSettings] = useState<PaymentSettingsState>(defaultSettings);\n  const [loading, setLoading] = useState(true);\n  const [saving, setSaving] = useState(false);\n  const [message, setMessage] = useState('');\n\n  useEffect(() => {\n    let alive = true;\n    async function load() {\n      setLoading(true);\n      try {\n        const { data, error } = await supabase\n          .from('payment_settings')\n          .select('*')\n          .limit(1)\n          .maybeSingle();\n        if (!alive) return;\n        if (!error && data) {\n          setSettings({\n            online_enabled: data.online_enabled ?? true,\n            card_to_card_enabled: data.card_to_card_enabled ?? false,\n            cash_on_delivery_enabled: data.cash_on_delivery_enabled ?? false,\n            gateway_provider: data.gateway_provider ?? 'zarinpal',\n            merchant_id: data.merchant_id ?? '',\n            sandbox_mode: data.sandbox_mode ?? true,\n          });\n        }\n      } catch (e) {\n        console.warn('Payment settings load skipped:', e);\n      } finally {\n        if (alive) setLoading(false);\n      }\n    }\n    load();\n    return () => { alive = false; };\n  }, []);\n\n  async function saveSettings() {\n    setSaving(true);\n    setMessage('');\n    try {\n      const payload = { ...settings, updated_at: new Date().toISOString() };\n      const { error } = await supabase.from('payment_settings').upsert(payload);\n      if (error) throw error;\n      setMessage('تنظیمات پرداخت ذخیره شد.');\n    } catch (e: any) {\n      setMessage('ذخیره انجام نشد. اگر جدول payment_settings ساخته نشده، SQL پچ Payment Engine را اجرا کن.');\n      console.error(e);\n    } finally {\n      setSaving(false);\n    }\n  }\n\n  const toggle = (key: keyof PaymentSettingsState) => {\n    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));\n  };\n\n  return (\n    <div dir=\"rtl\" className=\"min-h-screen bg-slate-950 p-4 text-white md:p-8\">\n      <div className=\"mx-auto max-w-5xl space-y-6\">\n        <div className=\"rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-xl\">\n          <h1 className=\"text-2xl font-black\">💳 تنظیمات پرداخت</h1>\n          <p className=\"mt-2 text-sm text-slate-300\">مدیریت روش‌های پرداخت، درگاه و حالت تست/واقعی.</p>\n        </div>\n\n        <div className=\"grid gap-4 md:grid-cols-3\">\n          {[\n            ['online_enabled', 'پرداخت آنلاین'],\n            ['card_to_card_enabled', 'کارت به کارت'],\n            ['cash_on_delivery_enabled', 'پرداخت در محل'],\n          ].map(([key, label]) => (\n            <button\n              key={key}\n              onClick={() => toggle(key as keyof PaymentSettingsState)}\n              className={\`rounded-2xl border p-5 text-right transition \${settings[key as keyof PaymentSettingsState] ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-slate-900'}\`}\n            >\n              <div className=\"text-lg font-bold\">{settings[key as keyof PaymentSettingsState] ? '✅' : '⬜'} {label}</div>\n              <div className=\"mt-2 text-xs text-slate-400\">فعال/غیرفعال در Checkout</div>\n            </button>\n          ))}\n        </div>\n\n        <div className=\"rounded-3xl border border-white/10 bg-slate-900 p-6\">\n          <div className=\"grid gap-4 md:grid-cols-2\">\n            <label className=\"space-y-2\">\n              <span className=\"text-sm text-slate-300\">درگاه پرداخت</span>\n              <select\n                value={settings.gateway_provider}\n                onChange={(e) => setSettings((p) => ({ ...p, gateway_provider: e.target.value }))}\n                className=\"w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-white outline-none\"\n              >\n                <option value=\"zarinpal\">زرین‌پال</option>\n                <option value=\"idpay\">آیدی‌پی</option>\n                <option value=\"manual\">دستی / تستی</option>\n              </select>\n            </label>\n\n            <label className=\"space-y-2\">\n              <span className=\"text-sm text-slate-300\">Merchant ID / API Key</span>\n              <input\n                value={settings.merchant_id}\n                onChange={(e) => setSettings((p) => ({ ...p, merchant_id: e.target.value }))}\n                placeholder=\"فعلاً می‌تواند خالی بماند\"\n                className=\"w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-white outline-none placeholder:text-slate-500\"\n              />\n            </label>\n          </div>\n\n          <button\n            onClick={() => toggle('sandbox_mode')}\n            className=\"mt-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm\"\n          >\n            {settings.sandbox_mode ? '🧪 حالت تست فعال است' : '🚀 حالت واقعی فعال است'}\n          </button>\n\n          <div className=\"mt-6 flex items-center gap-3\">\n            <button\n              onClick={saveSettings}\n              disabled={saving || loading}\n              className=\"rounded-2xl bg-amber-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-50\"\n            >\n              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}\n            </button>\n            {message && <span className=\"text-sm text-slate-300\">{message}</span>}\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n`);
  console.log('✅ Fallback created:', path.relative(root, fallbackPath));
  return fallbackPath;
}

function findPaymentSettingsFile() {
  const candidates = [
    path.join(srcDir, 'pages', 'PaymentSettings.tsx'),
    path.join(srcDir, 'admin', 'pages', 'PaymentSettings.tsx'),
    path.join(srcDir, 'admin', 'PaymentSettings.tsx'),
  ];
  for (const c of candidates) if (exists(c)) return c;
  const found = walk(srcDir).find((p) => {
    const base = path.basename(p).toLowerCase();
    if (!base.includes('payment') || !base.endsWith('.tsx')) return false;
    const content = read(p);
    return /export\s+default\s+function\s+PaymentSettings|const\s+PaymentSettings\s*=|function\s+PaymentSettings/.test(content);
  });
  return found || ensureFallbackPaymentSettings();
}

function relativeImport(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
  rel = rel.replace(/\.tsx?$/, '');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

if (!exists(appPath)) fail('src/App.tsx پیدا نشد. این اسکریپت باید از ریشه پروژه اجرا شود.');

const paymentFile = findPaymentSettingsFile();
console.log('📄 PaymentSettings component:', path.relative(root, paymentFile));

let app = read(appPath);
backup(appPath);

if (!/\bPaymentSettings\b/.test(app)) {
  fail('در App.tsx هیچ Route یا استفاده‌ای از PaymentSettings پیدا نشد. پچ Payment احتمالاً route را اضافه نکرده است.');
}

const hasImport = /import\s+PaymentSettings\s+from\s+['"][^'"]+['"]\s*;?/.test(app);
if (!hasImport) {
  const importPath = relativeImport(appPath, paymentFile);
  const lines = app.split('\n');
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, `import PaymentSettings from '${importPath}';`);
  app = lines.join('\n');
  console.log('✅ Import added:', `import PaymentSettings from '${importPath}';`);
} else {
  console.log('ℹ️ PaymentSettings import already exists.');
}

write(appPath, app);

const verify = read(appPath);
if (!/import\s+PaymentSettings\s+from\s+['"][^'"]+['"]/.test(verify)) {
  fail('Import اضافه نشد. App.tsx را بررسی کن.');
}

console.log('✅ PaymentSettings import fix completed.');
console.log('🔁 Restart Vite: Ctrl+C سپس npm run dev');
