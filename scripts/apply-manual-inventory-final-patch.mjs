import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const now = Date.now();

function exists(p){ return fs.existsSync(p); }
function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p,c){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p,c,'utf8'); }
function backup(p){ if (exists(p)) fs.copyFileSync(p, `${p}.bak-${now}`); }
function walk(dir){
  const out=[];
  if(!exists(dir)) return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir, ent.name);
    if(ent.isDirectory() && !['node_modules','.git','dist'].includes(ent.name)) out.push(...walk(p));
    else if(ent.isFile() && /\.(tsx|ts|jsx|js)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = walk(srcDir);

function findFileByAny(needles){
  for(const f of files){
    const c = read(f);
    if(needles.some(n=>c.includes(n))) return f;
  }
  return null;
}

function detectImportsAlias(app){
  const c = read(app);
  const m = c.match(/import\s+(\w+)\s+from\s+['"][^'"]*(Inventory|inventory)[^'"]*['"]/);
  return m?.[1] || null;
}

const inventoryComponent = `import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Product = {
  id: string;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  stock_quantity?: number | null;
  min_stock_quantity?: number | null;
  is_active?: boolean | null;
  is_out_of_stock?: boolean | null;
};

function stockStatus(p: Product) {
  const qty = Number(p.stock_quantity ?? 0);
  const min = Number(p.min_stock_quantity ?? 0);
  if (p.is_out_of_stock || qty <= 0) return { label: 'ناموجود', cls: 'bg-rose-500/15 text-rose-200 border-rose-400/30' };
  if (min > 0 && qty <= min) return { label: 'رو به اتمام', cls: 'bg-amber-500/15 text-amber-200 border-amber-400/30' };
  return { label: 'موجود', cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' };
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase
      .from('products')
      .select('id,name,brand,category,price,stock_quantity,min_stock_quantity,is_active,is_out_of_stock')
      .order('name', { ascending: true });
    if (error) setMessage('خطا در دریافت محصولات: ' + error.message);
    setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const out = products.filter(p => p.is_out_of_stock || Number(p.stock_quantity ?? 0) <= 0).length;
    const low = products.filter(p => {
      const qty = Number(p.stock_quantity ?? 0);
      const min = Number(p.min_stock_quantity ?? 0);
      return qty > 0 && min > 0 && qty <= min;
    }).length;
    return { total, out, low, ok: total - out - low };
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    const text = [p.name, p.brand, p.category].filter(Boolean).join(' ').toLowerCase();
    const matches = text.includes(query.trim().toLowerCase());
    const status = stockStatus(p).label;
    if (filter === 'low' && status !== 'رو به اتمام') return false;
    if (filter === 'out' && status !== 'ناموجود') return false;
    return matches;
  }), [products, query, filter]);

  function patchLocal(id: string, patch: Partial<Product>) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function save(p: Product) {
    setSavingId(p.id);
    setMessage('');
    const qty = Number(p.stock_quantity ?? 0);
    const payload = {
      stock_quantity: qty,
      min_stock_quantity: Number(p.min_stock_quantity ?? 0),
      is_out_of_stock: qty <= 0 || Boolean(p.is_out_of_stock),
      is_active: Boolean(p.is_active ?? true),
    };
    const { error } = await supabase.from('products').update(payload).eq('id', p.id);
    if (error) setMessage('خطا در ذخیره موجودی: ' + error.message);
    else {
      setMessage('موجودی ذخیره شد.');
      patchLocal(p.id, payload);
      await supabase.from('manual_inventory_logs').insert({
        product_id: p.id,
        new_quantity: payload.stock_quantity,
        min_stock_quantity: payload.min_stock_quantity,
        note: 'ویرایش دستی موجودی از پنل'
      });
    }
    setSavingId(null);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
          <p className="text-sm text-amber-300">کنترل دستی موجودی</p>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">انبار Carrtell</h1>
          <p className="mt-2 text-sm text-slate-400">موجودی را دستی وارد کن؛ محصولات ناموجود در فروش و پیشنهاد هوشمند قابل نمایش/خرید نیستند.</p>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {[['کل محصولات', stats.total], ['موجود', stats.ok], ['رو به اتمام', stats.low], ['ناموجود', stats.out]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">{label}</p>
              <strong className="mt-2 block text-2xl">{value}</strong>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو محصول، برند، دسته..." className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-amber-400 md:max-w-md" />
            <div className="flex gap-2 overflow-x-auto">
              {([['all','همه'], ['low','کم‌موجود'], ['out','ناموجود']] as const).map(([k,l]) => (
                <button key={k} onClick={()=>setFilter(k)} className={
                  'rounded-2xl px-4 py-2 text-sm font-bold ' + (filter===k ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200')
                }>{l}</button>
              ))}
              <button onClick={load} className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200">بارگذاری مجدد</button>
            </div>
          </div>
          {message && <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{message}</div>}
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
          {loading ? <div className="p-6 text-slate-300">در حال بارگذاری...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-slate-950/80 text-slate-300">
                  <tr>
                    <th className="p-3">محصول</th><th className="p-3">برند/دسته</th><th className="p-3">موجودی</th><th className="p-3">حد هشدار</th><th className="p-3">وضعیت</th><th className="p-3">فعال</th><th className="p-3">ذخیره</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const s = stockStatus(p);
                    return <tr key={p.id} className="border-t border-white/10">
                      <td className="p-3 font-bold text-slate-100">{p.name || 'بدون نام'}</td>
                      <td className="p-3 text-slate-300">{p.brand || '-'} <span className="text-slate-500">/</span> {p.category || '-'}</td>
                      <td className="p-3"><input type="number" value={p.stock_quantity ?? 0} onChange={e=>patchLocal(p.id,{stock_quantity:Number(e.target.value), is_out_of_stock:Number(e.target.value)<=0})} className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-slate-100" /></td>
                      <td className="p-3"><input type="number" value={p.min_stock_quantity ?? 0} onChange={e=>patchLocal(p.id,{min_stock_quantity:Number(e.target.value)})} className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-slate-100" /></td>
                      <td className="p-3"><span className={'inline-flex rounded-full border px-3 py-1 text-xs font-bold ' + s.cls}>{s.label}</span></td>
                      <td className="p-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(p.is_active ?? true)} onChange={e=>patchLocal(p.id,{is_active:e.target.checked})} /> فعال</label></td>
                      <td className="p-3"><button onClick={()=>save(p)} disabled={savingId===p.id} className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-60">{savingId===p.id ? '...' : 'ذخیره'}</button></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
`;

// locate existing inventory page or create under src/pages/admin-ish fallback
let inventoryFile = findFileByAny(['/admin/inventory', 'انبار Carrtell', 'کنترل دستی موجودی']);
if (!inventoryFile) {
  const candidates = files.filter(f => /inventory/i.test(path.basename(f)) || /انبار/.test(read(f)));
  inventoryFile = candidates[0] || path.join(srcDir, 'pages', 'Inventory.tsx');
}
backup(inventoryFile);
write(inventoryFile, inventoryComponent);
console.log('✅ Inventory page updated:', path.relative(root, inventoryFile));

// Try to ensure App.tsx route imports this file if no inventory route exists
const appPath = path.join(srcDir, 'App.tsx');
if (exists(appPath)) {
  let app = read(appPath);
  const rel = './' + path.relative(srcDir, inventoryFile).replace(/\\/g,'/').replace(/\.tsx?$/,'');
  if (!app.includes('/admin/inventory') && !app.includes('path="inventory"')) {
    const name = 'InventoryManualPage';
    if (!app.includes(`import ${name}`)) app = `import ${name} from '${rel}';\n` + app;
    if (app.includes('<Routes>')) app = app.replace('<Routes>', `<Routes>\n        <Route path="/admin/inventory" element={<${name} />} />`);
    write(appPath, app);
    console.log('✅ /admin/inventory route injected in App.tsx');
  }
}

// Add quick link if possible
const ql = findFileByAny(['مرکز مسیرها', 'تست سلامت مسیرها', 'داشبورد مدیریت']);
if (ql && !read(ql).includes('/admin/inventory')) {
  backup(ql);
  let c = read(ql);
  const item = `{ title: 'انبار', path: '/admin/inventory', desc: 'کنترل دستی موجودی، هشدار کم‌موجودی و وضعیت محصولات', icon: '📦' },`;
  c = c.replace(/items\s*:\s*\[/, m => `${m}\n      ${item}`);
  write(ql,c);
  console.log('✅ Inventory link added to quick links:', path.relative(root, ql));
}

console.log('✅ Manual Inventory Final patch applied. Run SQL: docs/sql/2026_manual_inventory_final.sql');
