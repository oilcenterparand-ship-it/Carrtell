import { useEffect, useState } from 'react';
import { createBrand, deleteBrand, getBrands, updateBrand, type Brand } from '../services/brandsApi';
import ImageUploader from '../components/ImageUploader';

const emptyBrand: Brand = {
  name: '',
  slug: '',
  logo_url: '',
  banner_url: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<Brand>(emptyBrand);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    setBrands(await getBrands());
  }

  useEffect(() => {
    loadData();
  }, []);

  function reset() {
    setForm(emptyBrand);
    setEditingId(null);
  }

  async function saveBrand() {
    if (!form.name.trim()) {
      alert('نام برند الزامی است');
      return;
    }

    try {
      if (editingId) {
        await updateBrand(editingId, form);
        alert('برند ویرایش شد ✅');
      } else {
        await createBrand(form);
        alert('برند اضافه شد ✅');
      }
      reset();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره برند انجام نشد. Console را بررسی کن.');
    }
  }

  async function remove(id?: string) {
    if (!id || !confirm('برند حذف شود؟')) return;
    await deleteBrand(id);
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت برندها</h1>
        <p className="mt-2 text-sm text-slate-400">برندها مثل ایرانول، بهران، نفت پارس و سرکان را اضافه کن تا در محصول و فروشگاه نمایش داده شوند.</p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-slate-900 p-5 md:grid-cols-2">
        <input placeholder="نام برند؛ مثال: ایرانول" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
        <input placeholder="اسلاگ اختیاری؛ مثال: iranol" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
        <ImageUploader label="لوگوی برند" folder="brands" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
        <ImageUploader label="بنر برند" folder="brands" value={form.banner_url} onChange={(url) => setForm({ ...form, banner_url: url })} />
        <input type="number" placeholder="ترتیب نمایش" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
        <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white">
          <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          فعال باشد
        </label>
        <textarea placeholder="توضیحات برند" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded bg-slate-800 p-3 text-white md:col-span-2" rows={3} />
        <div className="flex gap-2 md:col-span-2">
          <button onClick={saveBrand} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">{editingId ? 'ذخیره تغییرات برند' : 'افزودن برند'}</button>
          {editingId && <button onClick={reset} className="rounded bg-slate-700 px-6 py-3 font-bold text-white">لغو</button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div key={brand.id} className="rounded-2xl bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-slate-800">
                {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" /> : <span className="text-xs text-slate-500">لوگو</span>}
              </div>
              <div>
                <b>{brand.name}</b>
                <p className="text-xs text-slate-400">{brand.slug || '-'}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setForm({ ...emptyBrand, ...brand }); setEditingId(brand.id || null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">ویرایش</button>
              <button onClick={() => remove(brand.id)} className="px-3 py-2 text-sm text-red-400">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Brands;
