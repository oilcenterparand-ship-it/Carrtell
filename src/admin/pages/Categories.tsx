import { useEffect, useMemo, useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { buildCategoryTree, createProductCategory, deleteProductCategory, getCategoryDescendantIds, getCategoryLabelPath, getProductCategories, ProductCategory, ProductCategoryNode, updateProductCategory } from '../services/categoriesApi';

const emptyCategory: ProductCategory = { title: '', slug: '', description: '', parent_id: null, image_url: '', icon_emoji: '🔧', landing_url: '', sort_order: 0, is_active: true };
const field = 'w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-yellow-400';
const makeSlug = (title: string) => title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-آ-ی]/gi, '');

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="block text-sm font-black text-white">{label}</span>{children}{hint && <span className="block text-[11px] leading-5 text-slate-400">{hint}</span>}</label>;
}

function CategoryRow({ node, depth, categories, onAddChild, onEdit, onRemove }: { node: ProductCategoryNode; depth: number; categories: ProductCategory[]; onAddChild: (item: ProductCategory) => void; onEdit: (item: ProductCategory) => void; onRemove: (id?: string) => void }) {
  return <div>
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-white md:flex-row md:items-center md:justify-between" style={{ marginRight: Math.min(depth * 24, 72) }}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-800 text-xl">{node.image_url ? <img src={node.image_url} alt="" className="h-full w-full object-contain p-1" /> : node.icon_emoji || '🔧'}</div>
        <div className="min-w-0"><b className="block truncate">{depth ? '↳ ' : ''}{node.title}</b><p className="text-xs leading-5 text-slate-400">{getCategoryLabelPath(categories, node.id)}<br />{node.slug} · ترتیب {node.sort_order}{node.children.length ? ` · ${node.children.length.toLocaleString('fa-IR')} زیرشاخه` : ''}</p>{!node.is_active && <span className="mt-1 inline-block rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-200">غیرفعال</span>}</div>
      </div>
      <div className="flex flex-wrap gap-2"><button onClick={() => onAddChild(node)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">+ زیرشاخه</button><button onClick={() => onEdit(node)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold">ویرایش</button><button onClick={() => onRemove(node.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-red-400">حذف</button></div>
    </div>
    <div className="mt-2 space-y-2">{node.children.map((child) => <CategoryRow key={child.id} node={child} depth={depth + 1} categories={categories} onAddChild={onAddChild} onEdit={onEdit} onRemove={onRemove} />)}</div>
  </div>;
}

export default function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState<ProductCategory>(emptyCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'root' | 'child'>('root');
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  async function loadData() { setCategories(await getProductCategories()); }
  useEffect(() => { void loadData(); }, []);
  function resetForm(mode: 'root' | 'child' = 'root') { setForm({ ...emptyCategory, parent_id: mode === 'root' ? null : form.parent_id }); setEditingId(null); setFormMode(mode); }
  function editCategory(category: ProductCategory) { setForm({ ...emptyCategory, ...category }); setEditingId(category.id || null); setFormMode(category.parent_id ? 'child' : 'root'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function addChild(category: ProductCategory) { setForm({ ...emptyCategory, parent_id: category.id || null }); setEditingId(null); setFormMode('child'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function saveCategory() {
    if (!form.title.trim()) return alert('نام دسته یا شاخه الزامی است');
    if (formMode === 'child' && !form.parent_id) return alert('برای زیرشاخه، دسته والد را انتخاب کن');
    if (editingId && form.parent_id === editingId) return alert('یک دسته نمی‌تواند والد خودش باشد');
    try { const payload = { ...form, slug: form.slug.trim() || makeSlug(form.title) }; if (editingId) await updateProductCategory(editingId, payload); else await createProductCategory(payload); alert(editingId ? 'دسته‌بندی ویرایش شد ✅' : 'دسته‌بندی ساخته شد ✅'); resetForm(); await loadData(); }
    catch (error) { console.error(error); alert('ذخیره انجام نشد. ابتدا Migration این Sprint را اجرا کن.'); }
  }
  async function remove(id?: string) {
    if (!id) return;
    if (categories.some((item) => item.parent_id === id)) return alert('این دسته زیرشاخه دارد؛ ابتدا زیرشاخه‌ها را حذف یا منتقل کن.');
    if (!confirm('دسته‌بندی حذف شود؟')) return;
    try { await deleteProductCategory(id); await loadData(); } catch (error) { console.error(error); alert('این دسته به محصول متصل است یا اجازه حذف وجود ندارد.'); }
  }
  const invalidParentIds = useMemo(() => editingId ? new Set(getCategoryDescendantIds(categories, editingId)) : new Set<string>(), [categories, editingId]);
  const parentOptions = categories.filter((item) => item.id && !invalidParentIds.has(item.id));
  return <div className="space-y-6" dir="rtl">
    <div><h1 className="text-2xl font-bold text-white">ساخت دسته و زیرشاخه محصولات</h1><p className="mt-2 text-sm leading-6 text-slate-400">هر تعداد مرحله که لازم داری خودت بساز؛ مثل روغن‌ها ← روغن موتور ← گرید ← 15W-40.</p></div>
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <button type="button" onClick={() => { setForm({ ...emptyCategory, parent_id: null }); setEditingId(null); setFormMode('root'); }} className={`rounded-xl p-4 text-sm font-black ${formMode === 'root' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-white'}`}>+ دسته اصلی جدید</button>
      <button type="button" onClick={() => { setForm({ ...emptyCategory, parent_id: categories[0]?.id || null }); setEditingId(null); setFormMode('child'); }} className={`rounded-xl p-4 text-sm font-black ${formMode === 'child' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-white'}`}>+ زیرشاخه جدید</button>
    </div>
    <div className="grid gap-4 rounded-2xl border-2 border-slate-800 bg-slate-900 p-5 md:grid-cols-2">
      <div className="rounded-xl bg-slate-950/60 p-3 text-sm font-black text-yellow-300 md:col-span-2">{editingId ? 'در حال ویرایش شاخه' : formMode === 'root' ? 'ساخت دسته اصلی جدید' : 'ساخت زیرشاخه جدید'}</div>
      {formMode === 'child' && <Field label="زیرمجموعه کدام مسیر باشد؟" hint="هر مسیری را انتخاب کنی، شاخه جدید دقیقاً زیر همان ساخته می‌شود."><select value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })} className={field}><option value="">انتخاب مسیر والد...</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{getCategoryLabelPath(categories, item.id)}</option>)}</select></Field>}
      <Field label={formMode === 'root' ? 'نام دسته اصلی' : 'نام زیرشاخه جدید'} hint="هر نامی می‌خواهی؛ مثل گرید روغن، 15W-40، برند یا سرکان."><input placeholder="نام را وارد کن" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || makeSlug(e.target.value) })} className={field} /></Field>
      <Field label="آدرس انگلیسی شاخه (Slug)" hint="خودکار ساخته می‌شود؛ در صورت نیاز می‌توانی تغییرش بدهی."><input placeholder="example: 15w40" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={field} /></Field>
      <Field label="صفحه مقصد اختصاصی" hint="اختیاری؛ برای ورود مستقیم این کارت به بخش صنعتی بنویس /industrial. اگر خالی باشد، محصولات همین دسته باز می‌شوند."><input placeholder="مثال: /industrial" value={form.landing_url || ''} onChange={(e) => setForm({ ...form, landing_url: e.target.value })} className={field} dir="ltr" /></Field>
      <Field label="ترتیب نمایش" hint="عدد کمتر، زودتر نمایش داده می‌شود."><input placeholder="مثلاً 1" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={field} /></Field>
      <Field label="آیکون یا ایموجی" hint="مثلاً 🛢️ یا 🚛"><input placeholder="یک ایموجی" value={form.icon_emoji || ''} onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })} className={field} maxLength={8} /></Field>
      <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm font-black text-white"><input className="h-5 w-5" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> این شاخه فعال و قابل‌نمایش باشد</label>
      <div className="md:col-span-2">
        <p className="mb-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-[11px] leading-6 text-yellow-100">این تصویر داخل بخش مربعی کارت دسته‌بندی نمایش داده می‌شود. برای نتیجه بهتر از تصویر مربع یا محصول با پس‌زمینه ساده استفاده کن.</p>
        <ImageUploader label="تصویر داخل کارت دسته‌بندی" folder="categories" value={form.image_url || ''} onChange={(image_url) => setForm({ ...form, image_url })} />
      </div>
      <Field label="توضیح کوتاه برای مشتری" hint="اختیاری است و بالای صفحه این شاخه نمایش داده می‌شود."><textarea placeholder="توضیح این دسته یا شاخه" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} rows={3} /></Field>
      <button onClick={saveCategory} className="rounded-xl bg-yellow-400 p-4 text-base font-black text-slate-950 md:col-span-2">{editingId ? 'ذخیره تغییرات' : formMode === 'root' ? 'ساخت دسته اصلی' : 'ساخت این زیرشاخه'}</button>
      {editingId && <button onClick={() => resetForm('root')} className="rounded-xl bg-slate-700 p-3 font-bold text-white md:col-span-2">لغو ویرایش</button>}
    </div>
    <div><h2 className="mb-3 text-lg font-black text-white">دسته‌ها و شاخه‌های ساخته‌شده</h2><p className="mb-4 text-xs text-slate-400">برای اضافه‌کردن مرحله بعد، کنار همان شاخه روی «+ زیرشاخه» بزن.</p><div className="space-y-2">{tree.map((node) => <CategoryRow key={node.id} node={node} depth={0} categories={categories} onAddChild={addChild} onEdit={editCategory} onRemove={remove} />)}</div></div>
  </div>;
}
