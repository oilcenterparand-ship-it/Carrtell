import { useEffect, useState } from 'react';
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategories,
  ProductCategory,
  updateProductCategory,
} from '../services/categoriesApi';

const emptyCategory: ProductCategory = {
  title: '',
  slug: '',
  description: '',
  icon_emoji: '🔧',
  sort_order: 0,
  is_active: true,
};

function makeSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-آ-ی]/gi, '');
}

function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState<ProductCategory>(emptyCategory);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    const data = await getProductCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(emptyCategory);
    setEditingId(null);
  }

  function editCategory(category: ProductCategory) {
    setForm({ ...emptyCategory, ...category });
    setEditingId(category.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveCategory() {
    if (!form.title.trim()) {
      alert('نام دسته‌بندی الزامی است');
      return;
    }

    const payload = {
      ...form,
      slug: form.slug.trim() || makeSlug(form.title),
    };

    try {
      if (editingId) {
        await updateProductCategory(editingId, payload);
        alert('دسته‌بندی ویرایش شد ✅');
      } else {
        await createProductCategory(payload);
        alert('دسته‌بندی ساخته شد ✅');
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره دسته‌بندی انجام نشد. Console را بررسی کن.');
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm('دسته‌بندی حذف شود؟ محصولات قبلی فقط مقدار دسته‌شان را نگه می‌دارند.')) return;
    await deleteProductCategory(id);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت دسته‌بندی محصولات</h1>
        <p className="mt-2 text-sm text-slate-400">
          هر دسته‌ای اینجا بسازی، در پنل محصولات، منوی دسته‌بندی و فیلتر فروشگاه به صورت خودکار نمایش داده می‌شود.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-slate-900 p-5 md:grid-cols-2">
        <input
          placeholder="نام دسته‌بندی؛ مثال: روغن موتور"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || makeSlug(e.target.value) })}
          className="rounded bg-slate-800 p-3 text-white"
        />
        <input
          placeholder="شناسه انگلیسی/اسلاگ؛ مثال: engine-oil"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="rounded bg-slate-800 p-3 text-white"
        />
        <input
          placeholder="ترتیب نمایش"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: +e.target.value })}
          className="rounded bg-slate-800 p-3 text-white"
        />
        <input
          placeholder="ایموجی دسته‌بندی؛ مثال: 🛢️"
          value={form.icon_emoji || ''}
          onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })}
          className="rounded bg-slate-800 p-3 text-white"
          maxLength={8}
        />
        <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          فعال باشد
        </label>
        <textarea
          placeholder="توضیحات کوتاه"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded bg-slate-800 p-3 text-white md:col-span-2"
          rows={3}
        />
        <div className="flex flex-col gap-2 md:col-span-2 md:flex-row">
          <button onClick={saveCategory} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">
            {editingId ? 'ذخیره تغییرات دسته' : 'افزودن دسته‌بندی'}
          </button>
          {editingId && <button onClick={resetForm} className="rounded bg-slate-700 px-6 py-3 font-bold text-white">لغو ویرایش</button>}
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id || category.slug} className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <b className="flex items-center gap-2"><span className="text-lg">{category.icon_emoji || '🔧'}</span>{category.title}</b>
              <p className="text-sm text-slate-400">{category.slug} | ترتیب: {category.sort_order}</p>
              {!category.is_active && <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-200">غیرفعال</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => editCategory(category)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">ویرایش</button>
              {category.id && <button onClick={() => remove(category.id)} className="px-3 py-2 text-sm text-red-400">حذف</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;
