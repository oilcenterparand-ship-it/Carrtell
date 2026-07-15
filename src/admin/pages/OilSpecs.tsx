import { useEffect, useMemo, useState } from 'react';
import { createOilSpec, deleteOilSpec, getOilSpecs, updateOilSpec, type OilSpec, type OilSpecType } from '../services/oilSpecsApi';

const emptyForm: OilSpec = {
  type: 'grade',
  title: '',
  sort_order: 100,
  is_active: true,
};

function typeLabel(type: OilSpecType) {
  return type === 'grade' ? 'گرید روغن / ویسکوزیته' : 'سطح کیفی';
}

function OilSpecs() {
  const [items, setItems] = useState<OilSpec[]>([]);
  const [form, setForm] = useState<OilSpec>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    const data = await getOilSpecs();
    setItems(data);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const grouped = useMemo(() => {
    return items.reduce<Record<OilSpecType, OilSpec[]>>(
      (acc, item) => {
        acc[item.type].push(item);
        return acc;
      },
      { grade: [], quality: [] }
    );
  }, [items]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editItem(item: OilSpec) {
    setForm({ ...emptyForm, ...item });
    setEditingId(item.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveItem() {
    if (!form.title.trim()) {
      alert('عنوان الزامی است');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateOilSpec(editingId, form);
        alert('تغییرات ذخیره شد ✅');
      } else {
        await createOilSpec(form);
        alert('مورد جدید اضافه شد ✅');
      }
      resetForm();
      await loadItems();
    } catch (error) {
      console.error(error);
      alert('ذخیره انجام نشد. Console را بررسی کن.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: OilSpec) {
    if (!item.id) return;
    await updateOilSpec(item.id, { is_active: !item.is_active });
    loadItems();
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm('حذف شود؟')) return;
    await deleteOilSpec(id);
    loadItems();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت گرید و سطح کیفی روغن</h1>
        <p className="mt-2 text-sm text-slate-400">
          هر گرید یا سطح کیفی که اینجا بسازی، خودکار در فرم محصولات و فرم خودروها نمایش داده می‌شود.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-5">
        <h2 className="mb-4 font-bold text-white">{editingId ? 'ویرایش مورد' : 'افزودن مورد جدید'}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as OilSpecType })}
            className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-yellow-400/40"
          >
            <option value="grade">گرید روغن / ویسکوزیته</option>
            <option value="quality">سطح کیفی</option>
          </select>

          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={form.type === 'grade' ? 'مثال: 10W-40' : 'مثال: API SN Plus'}
            className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-yellow-400/40 md:col-span-2"
          />

          <input
            type="number"
            value={form.sort_order || 0}
            onChange={(e) => setForm({ ...form, sort_order: +e.target.value })}
            placeholder="ترتیب نمایش"
            className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-yellow-400/40"
          />

          <label className="flex items-center gap-2 rounded-xl bg-slate-800 p-3 text-white">
            <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            فعال باشد
          </label>

          <div className="flex gap-3 md:col-span-3">
            {editingId && (
              <button onClick={resetForm} className="rounded-xl bg-slate-700 px-5 py-3 font-bold text-white">
                لغو ویرایش
              </button>
            )}
            <button onClick={saveItem} disabled={loading} className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">
              {loading ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'افزودن'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {(['grade', 'quality'] as OilSpecType[]).map((type) => (
          <div key={type} className="rounded-2xl bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">{typeLabel(type)}</h2>
              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">{grouped[type].length} مورد</span>
            </div>

            <div className="space-y-2">
              {grouped[type].map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-800 p-3">
                  <div>
                    <b className="text-white">{item.title}</b>
                    <p className="text-xs text-slate-400">ترتیب: {item.sort_order ?? 100} | {item.is_active === false ? 'غیرفعال' : 'فعال'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editItem(item)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">ویرایش</button>
                    <button onClick={() => toggleActive(item)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white">{item.is_active === false ? 'فعال' : 'غیرفعال'}</button>
                    <button onClick={() => remove(item.id)} className="px-2 text-xs font-bold text-red-400">حذف</button>
                  </div>
                </div>
              ))}

              {!grouped[type].length && <p className="rounded-xl bg-slate-800 p-4 text-sm text-slate-400">هنوز موردی ثبت نشده است.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OilSpecs;
