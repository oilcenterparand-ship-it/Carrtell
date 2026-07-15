import { useEffect, useState } from 'react';
import { deleteStaffRole, getStaffRoles, PermissionKey, StaffRole, upsertStaffRole } from '../services/staffApi';

const permissions: { key: PermissionKey; label: string }[] = [
  { key: 'dashboard', label: 'داشبورد' },
  { key: 'orders', label: 'سفارش‌ها' },
  { key: 'products', label: 'محصولات' },
  { key: 'inventory', label: 'انبار' },
  { key: 'finance', label: 'مالی' },
  { key: 'customers', label: 'مشتری‌ها' },
  { key: 'support', label: 'پشتیبانی' },
  { key: 'content', label: 'محتوا' },
  { key: 'dispatch', label: 'اعزام سرویس' },
  { key: 'settings', label: 'تنظیمات' },
];

export default function Roles() {
  const [items, setItems] = useState<StaffRole[]>([]);
  const [form, setForm] = useState<Partial<StaffRole>>({ title: '', description: '', permissions: [] });
  const [message, setMessage] = useState('');

  async function load() {
    try { setItems(await getStaffRoles()); } catch (e: any) { setMessage(e.message); }
  }
  useEffect(() => { load(); }, []);

  function togglePermission(key: PermissionKey) {
    const current = form.permissions ?? [];
    setForm({ ...form, permissions: current.includes(key) ? current.filter((p) => p !== key) : [...current, key] });
  }

  async function save() {
    if (!form.title?.trim()) return setMessage('عنوان نقش را وارد کن');
    await upsertStaffRole(form);
    setForm({ title: '', description: '', permissions: [] });
    setMessage('نقش ذخیره شد');
    await load();
  }

  async function remove(id: string) {
    if (!confirm('حذف نقش؟')) return;
    await deleteStaffRole(id);
    await load();
  }

  return (
    <div className="space-y-6 p-4 text-white" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
        <h1 className="text-2xl font-black">نقش‌ها و سطح دسترسی</h1>
        <p className="mt-1 text-sm text-slate-300">تعریف نقش برای مدیر شعبه، انباردار، حسابدار، پشتیبان، سرویس‌کار و تولید محتوا</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="mb-4 font-bold">افزودن / ویرایش نقش</h2>
          <input className="mb-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="عنوان نقش" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="mb-3 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="توضیحات" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            {permissions.map((p) => <button type="button" key={p.key} onClick={() => togglePermission(p.key)} className={`rounded-xl border px-3 py-2 text-sm ${form.permissions?.includes(p.key) ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-slate-950 text-slate-300'}`}>{p.label}</button>)}
          </div>
          <button onClick={save} className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950">ذخیره نقش</button>
          {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="mb-4 font-bold">نقش‌های تعریف‌شده</h2>
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-black">{r.title}</h3><p className="text-sm text-slate-400">{r.description}</p></div>
                  <div><button onClick={() => setForm(r)} className="ml-2 rounded-lg bg-white/10 px-3 py-1 text-sm">ویرایش</button><button onClick={() => remove(r.id)} className="rounded-lg bg-red-500/15 px-3 py-1 text-sm text-red-200">حذف</button></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{(r.permissions ?? []).map((p) => <span key={p} className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-100">{permissions.find((x) => x.key === p)?.label ?? p}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
