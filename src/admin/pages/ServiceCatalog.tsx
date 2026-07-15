import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Wrench } from 'lucide-react';
import { deleteServiceCatalogItem, getServiceCatalogItems, saveServiceCatalogItem, type ServiceCatalogItem } from '../../customer/services/serviceHistoryApi';

const field = 'rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400';

export default function ServiceCatalog() {
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [form, setForm] = useState<Partial<ServiceCatalogItem>>({ title: '', emoji: '🔧', category: 'سایر', is_active: true, sort_order: 0 });
  const [message, setMessage] = useState('');

  async function load() { setItems(await getServiceCatalogItems(true)); }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!form.title?.trim()) return;
    await saveServiceCatalogItem({ ...form, title: form.title });
    setForm({ title: '', emoji: '🔧', category: 'سایر', is_active: true, sort_order: 0 });
    setMessage('آیتم سرویس ذخیره شد.');
    await load();
  }

  return <div dir="rtl" className="space-y-6 text-white">
    <header className="rounded-3xl border border-amber-400/20 bg-gradient-to-l from-amber-500/15 via-slate-900 to-slate-950 p-5">
      <div className="flex items-center gap-3"><Wrench className="text-amber-300"/><div><h1 className="text-2xl font-black">اقلام قابل ثبت در سرویس</h1><p className="mt-1 text-sm text-slate-400">فهرست روغن‌ها، فیلترها و قطعاتی که سرویس‌کار هنگام پایان سرویس انتخاب می‌کند.</p></div></div>
    </header>
    {message && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-100">{message}</div>}
    <section className="grid gap-3 rounded-3xl border border-slate-700 bg-slate-900/70 p-4 md:grid-cols-[110px_1fr_1fr_120px_120px]">
      <input value={form.emoji || ''} onChange={e=>setForm({...form,emoji:e.target.value})} className={field} placeholder="ایموجی" />
      <input value={form.title || ''} onChange={e=>setForm({...form,title:e.target.value})} className={field} placeholder="عنوان آیتم" />
      <input value={form.category || ''} onChange={e=>setForm({...form,category:e.target.value})} className={field} placeholder="دسته‌بندی" />
      <input type="number" value={form.sort_order || 0} onChange={e=>setForm({...form,sort_order:Number(e.target.value)})} className={field} placeholder="ترتیب" />
      <button onClick={save} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950"><Plus size={18}/> افزودن</button>
    </section>
    <div className="grid gap-3">
      {items.map(item => <article key={item.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 md:grid-cols-[70px_1fr_1fr_120px_110px_100px] md:items-center">
        <input value={item.emoji || ''} onChange={e=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,emoji:e.target.value}:row))} className={field}/>
        <input value={item.title} onChange={e=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,title:e.target.value}:row))} className={field}/>
        <input value={item.category || ''} onChange={e=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,category:e.target.value}:row))} className={field}/>
        <input type="number" value={item.sort_order || 0} onChange={e=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,sort_order:Number(e.target.value)}:row))} className={field}/>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.is_active !== false} onChange={e=>setItems(rows=>rows.map(row=>row.id===item.id?{...row,is_active:e.target.checked}:row))}/> فعال</label>
        <div className="flex gap-2"><button onClick={async()=>{await saveServiceCatalogItem({...item,title:item.title});setMessage('ذخیره شد.');await load();}} className="rounded-xl bg-emerald-500/15 p-3 text-emerald-200"><Save size={17}/></button><button onClick={async()=>{if(confirm('حذف شود؟')){await deleteServiceCatalogItem(item.id);await load();}}} className="rounded-xl bg-red-500/15 p-3 text-red-200"><Trash2 size={17}/></button></div>
      </article>)}
    </div>
  </div>;
}
