import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, RefreshCw, Save, Shield, Trash2, X } from 'lucide-react';
import { ADMIN_PERMISSIONS, ADMIN_PERMISSION_LABELS, type AdminPermission } from '../auth/adminPermissions';
import { listAdminRoles, removeAdminRole, saveAdminRole, type AdminRoleRow } from '../services/adminSecurityApi';
import { useAdminAuth } from '../auth/AdminAuthProvider';

const empty: Partial<AdminRoleRow> = { name: '', title: '', description: '', permissions: [] };

export default function Roles() {
  const { can, admin } = useAdminAuth();
  const [items, setItems] = useState<AdminRoleRow[]>([]);
  const [form, setForm] = useState<Partial<AdminRoleRow>>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canManage = admin?.isSuperAdmin || can('roles.manage');
  const editing = Boolean(form.id);

  async function load() {
    setBusy(true);
    setError('');
    try {
      setItems(await listAdminRoles());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت نقش‌ها');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const selectedPermissions = useMemo(() => form.permissions || [], [form.permissions]);

  function toggle(key: AdminPermission) {
    if (!canManage) return;
    const next = selectedPermissions.includes(key)
      ? selectedPermissions.filter(item => item !== key)
      : [...selectedPermissions, key];
    setForm(current => ({ ...current, permissions: next }));
  }

  function startCreate() {
    setError('');
    setMessage('');
    setForm(empty);
  }

  function startEdit(role: AdminRoleRow) {
    setError('');
    setMessage('');
    setForm({ ...role, permissions: [...(role.permissions || [])] });
  }

  async function save() {
    setError('');
    setMessage('');
    if (!canManage) return setError('مجوز مدیریت نقش‌ها را ندارید.');
    if (!form.title?.trim()) return setError('عنوان نقش را وارد کنید.');

    const name = (form.name?.trim() || form.title.trim().toLowerCase().replace(/\s+/g, '_'))
      .replace(/[^a-z0-9_-]/g, '');
    if (name.length < 2) return setError('کلید نقش باید حداقل دو کاراکتر انگلیسی باشد.');

    setBusy(true);
    try {
      await saveAdminRole({ ...form, name });
      setForm(empty);
      setMessage(editing ? 'نقش با موفقیت ویرایش شد.' : 'نقش جدید ساخته شد.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ذخیره نقش ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(role: AdminRoleRow) {
    if (!canManage || role.is_system) return;
    if (!confirm(`نقش «${role.title}» حذف شود؟ کاربران این نقش بدون نقش خواهند شد.`)) return;
    setBusy(true);
    setError('');
    try {
      await removeAdminRole(role.id);
      if (form.id === role.id) setForm(empty);
      setMessage('نقش حذف شد.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حذف نقش ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">نقش‌ها و سطح دسترسی</h1>
            <p className="mt-1 text-sm text-slate-500">نقش جدید بساز، نقش‌های سفارشی را ویرایش کن و دسترسی هر بخش را مشخص کن.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={startCreate} disabled={!canManage} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black disabled:opacity-40">
              <Plus className="h-4 w-4" /> نقش جدید
            </button>
            <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-200 p-3" title="بارگذاری مجدد">
              <RefreshCw className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>}
      {message && <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-black"><Shield className="h-5 w-5" />{editing ? 'ویرایش نقش' : 'تعریف نقش جدید'}</h2>
            {editing && <button type="button" onClick={startCreate} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
          </div>
          <label className="mb-2 block text-sm font-bold">عنوان نقش</label>
          <input disabled={!canManage || Boolean(form.is_system)} className="mb-3 w-full rounded-xl border p-3 disabled:bg-slate-100" placeholder="مثلاً اپراتور سفارش‌ها" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
          <label className="mb-2 block text-sm font-bold">کلید انگلیسی نقش</label>
          <input disabled={!canManage || Boolean(form.is_system)} dir="ltr" className="mb-3 w-full rounded-xl border p-3 text-left disabled:bg-slate-100" placeholder="order_operator" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value.toLowerCase() })} />
          <label className="mb-2 block text-sm font-bold">توضیحات</label>
          <textarea disabled={!canManage || Boolean(form.is_system)} className="mb-4 min-h-20 w-full rounded-xl border p-3 disabled:bg-slate-100" placeholder="توضیح کوتاه درباره وظایف این نقش" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">مجوزها</span>
            <span className="text-xs text-slate-500">{selectedPermissions.length} مورد انتخاب شده</span>
          </div>
          <div className="grid max-h-[430px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {ADMIN_PERMISSIONS.map(permission => {
              const active = selectedPermissions.includes(permission);
              return (
                <button type="button" key={permission} disabled={!canManage || Boolean(form.is_system)} onClick={() => toggle(permission)} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-right text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  <span>{ADMIN_PERMISSION_LABELS[permission]}</span>{active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
          {form.is_system && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">نقش‌های سیستمی برای جلوگیری از اختلال قابل ویرایش یا حذف نیستند. برای تغییر دسترسی، یک نقش سفارشی بساز.</p>}
          <button disabled={busy || !canManage || Boolean(form.is_system)} onClick={() => void save()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 p-3 font-black disabled:opacity-50">
            <Save className="h-5 w-5" /> {editing ? 'ذخیره تغییرات' : 'ساخت نقش'}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          {items.length === 0 && !busy ? <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">هیچ نقشی دریافت نشد. فایل SQL این پچ را اجرا کن و دوباره بارگذاری را بزن.</div> : null}
          <div className="space-y-3">
            {items.map(role => (
              <div key={role.id} className={`rounded-2xl border p-4 ${form.id === role.id ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{role.title}</h3><code className="rounded bg-slate-100 px-2 py-1 text-[10px]" dir="ltr">{role.name}</code>{role.is_system && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px]">سیستمی</span>}</div>
                    <p className="mt-1 text-sm text-slate-500">{role.description || 'بدون توضیح'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(role)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm"><Pencil className="h-4 w-4" /> مشاهده{role.is_system ? '' : ' / ویرایش'}</button>
                    <button type="button" disabled={role.is_system || !canManage} onClick={() => void remove(role)} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /> حذف</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{(role.permissions || []).map(permission => <span key={permission} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">{String(permission) === '*' ? 'دسترسی کامل' : ADMIN_PERMISSION_LABELS[permission as AdminPermission] || permission}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
