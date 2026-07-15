import { useEffect, useMemo, useState } from 'react';
import { getStaffMembers, getStaffRoles, upsertStaffMember, deleteStaffMember, StaffMember, StaffRole } from '../services/staffApi';

const emptyForm: Partial<StaffMember> = {
  full_name: '',
  phone: '',
  email: '',
  position: '',
  role_id: '',
  status: 'active',
  notes: '',
};

export default function Staff() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [form, setForm] = useState<Partial<StaffMember>>(emptyForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [staff, staffRoles] = await Promise.all([getStaffMembers(), getStaffRoles()]);
      setItems(staff);
      setRoles(staffRoles);
    } catch (error: any) {
      setMessage(error.message ?? 'خطا در دریافت کارکنان');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => [i.full_name, i.phone, i.email, i.position, i.role_title].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [items, search]);

  async function save() {
    if (!form.full_name?.trim()) return setMessage('نام پرسنل را وارد کن');
    setLoading(true);
    try {
      await upsertStaffMember(form);
      setForm(emptyForm);
      setMessage('ذخیره شد');
      await load();
    } catch (error: any) {
      setMessage(error.message ?? 'خطا در ذخیره');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف شود؟')) return;
    await deleteStaffMember(id);
    await load();
  }

  return (
    <div className="space-y-6 p-4 text-white" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black">مدیریت کارکنان</h1>
            <p className="mt-1 text-sm text-slate-300">ثبت پرسنل، اتصال به نقش‌ها، شعبه و وضعیت فعالیت</p>
          </div>
          <a href="/admin/roles" className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-amber-200">مدیریت نقش‌ها</a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="mb-4 font-bold">افزودن / ویرایش پرسنل</h2>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="نام و نام خانوادگی" value={form.full_name ?? ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="شماره موبایل" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="ایمیل" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="سمت / عنوان شغلی" value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            <select className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" value={form.role_id ?? ''} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">انتخاب نقش</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <select className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
            <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white" placeholder="توضیحات داخلی" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button onClick={save} disabled={loading} className="w-full rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50">ذخیره پرسنل</button>
            {message && <p className="text-sm text-amber-200">{message}</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-bold">لیست کارکنان</h2>
            <input className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-slate-300"><tr><th className="p-3 text-right">نام</th><th className="p-3 text-right">تماس</th><th className="p-3 text-right">سمت</th><th className="p-3 text-right">نقش</th><th className="p-3 text-right">وضعیت</th><th className="p-3 text-right">عملیات</th></tr></thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t border-white/10">
                    <td className="p-3 font-bold">{i.full_name}</td>
                    <td className="p-3 text-slate-300">{i.phone || i.email || '-'}</td>
                    <td className="p-3 text-slate-300">{i.position || '-'}</td>
                    <td className="p-3 text-slate-300">{i.role_title || '-'}</td>
                    <td className="p-3"><span className={`rounded-full px-3 py-1 text-xs ${i.status === 'active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>{i.status === 'active' ? 'فعال' : 'غیرفعال'}</span></td>
                    <td className="p-3"><button onClick={() => setForm(i)} className="ml-2 rounded-lg bg-white/10 px-3 py-1">ویرایش</button><button onClick={() => remove(i.id)} className="rounded-lg bg-red-500/15 px-3 py-1 text-red-200">حذف</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
