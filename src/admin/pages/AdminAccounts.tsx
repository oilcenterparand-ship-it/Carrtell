import { FormEvent, useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, RefreshCw, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { listAdminAccounts, listAdminRoles, manageAdminAccount, type AdminAccountRow, type AdminRoleRow } from '../services/adminSecurityApi';
import { useAdminAuth } from '../auth/AdminAuthProvider';

const initialForm = { username: '', password: '', fullName: '', roleId: '', isActive: true };

export default function AdminAccounts() {
  const { can, admin } = useAdminAuth();
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canManage = admin?.isSuperAdmin || can('staff.manage');

  async function load() {
    setBusy(true);
    setError('');
    try {
      const [accountRows, roleRows] = await Promise.all([listAdminAccounts(), listAdminRoles()]);
      setAccounts(accountRows);
      setRoles(roleRows);
      if (!form.roleId && roleRows.length > 0) {
        const preferred = roleRows.find(role => role.name === 'manager') || roleRows.find(role => !role.is_system) || roleRows[0];
        setForm(current => ({ ...current, roleId: preferred?.id || '' }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت اطلاعات');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => accounts.filter(account => `${account.username} ${account.full_name} ${account.role_title || ''}`.toLowerCase().includes(query.toLowerCase())), [accounts, query]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!canManage) return setError('مجوز ساخت کاربر مدیریت را ندارید.');
    if (!form.roleId) return setError('ابتدا یک نقش برای کاربر انتخاب کنید.');
    setBusy(true);
    try {
      await manageAdminAccount({ action: 'create', username: form.username, password: form.password, fullName: form.fullName, roleId: form.roleId, isActive: form.isActive });
      setForm({ ...initialForm, roleId: roles[0]?.id || '' });
      setMessage('حساب مدیریتی با موفقیت ساخته شد.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ساخت حساب ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(account: AdminAccountRow) {
    if (!canManage || account.is_super_admin) return;
    setBusy(true);
    try {
      await manageAdminAccount({ action: 'update', userId: account.id, isActive: !account.is_active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تغییر وضعیت ناموفق بود.');
    } finally { setBusy(false); }
  }

  async function changeRole(account: AdminAccountRow, roleId: string) {
    if (!canManage || account.is_super_admin || !roleId) return;
    setBusy(true);
    try {
      await manageAdminAccount({ action: 'update', userId: account.id, roleId });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تغییر نقش ناموفق بود.');
    } finally { setBusy(false); }
  }

  async function resetPassword(account: AdminAccountRow) {
    if (!canManage) return;
    const password = prompt(`رمز جدید برای ${account.username} را وارد کنید (حداقل ۱۰ کاراکتر):`);
    if (!password) return;
    setBusy(true);
    try {
      await manageAdminAccount({ action: 'reset_password', userId: account.id, password });
      setMessage('رمز عبور تغییر کرد.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تغییر رمز ناموفق بود.');
    } finally { setBusy(false); }
  }

  async function remove(account: AdminAccountRow) {
    if (!canManage || account.is_super_admin) return;
    if (!confirm(`حساب ${account.username} حذف شود؟`)) return;
    setBusy(true);
    try {
      await manageAdminAccount({ action: 'delete', userId: account.id });
      setMessage('حساب حذف شد.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حذف حساب ناموفق بود.');
    } finally { setBusy(false); }
  }

  return (
    <section dir="rtl" className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400"><ShieldCheck /></div><div><h1 className="text-2xl font-black">کاربران پنل مدیریت</h1><p className="text-sm text-slate-500">ساخت کاربر، انتخاب نقش، فعال‌سازی و تغییر رمز بدون Edge Function و ابزار جانبی</p></div></div>
      </div>
      {error && <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>}
      {message && <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">{message}</div>}
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={create} className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-black"><Plus className="h-5 w-5" /> ساخت حساب جدید</h2>
          <input required placeholder="نام و نام خانوادگی" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mb-3 w-full rounded-xl border p-3" />
          <input required dir="ltr" pattern="[a-zA-Z0-9_.-]{3,40}" placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} className="mb-3 w-full rounded-xl border p-3 text-left" />
          <input required minLength={10} type="password" placeholder="رمز عبور حداقل ۱۰ کاراکتر" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mb-3 w-full rounded-xl border p-3" />
          <label className="mb-2 block text-sm font-bold">نقش کاربر</label>
          <select required disabled={busy || roles.length === 0} value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="mb-2 w-full rounded-xl border p-3 disabled:bg-slate-100">
            <option value="">انتخاب نقش...</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.title}{role.is_system ? ' (سیستمی)' : ''}</option>)}
          </select>
          {roles.length === 0 && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">هیچ نقشی بارگذاری نشده است. ابتدا SQL این پچ را اجرا کن، سپس دکمه بارگذاری مجدد را بزن.</p>}
          <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> حساب فعال باشد</label>
          <button disabled={busy || !canManage || roles.length === 0} className="w-full rounded-xl bg-amber-400 p-3 font-black disabled:opacity-50">ایجاد حساب</button>
        </form>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex gap-2"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی مدیر..." className="min-w-0 flex-1 rounded-xl border p-3" /><button type="button" onClick={() => void load()} className="rounded-xl border p-3"><RefreshCw className={busy ? 'animate-spin' : ''} /></button></div>
          <div className="space-y-3">
            {filtered.map(account => (
              <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><UserCog className="h-5 w-5" /></div><div><b>{account.full_name}</b><p dir="ltr" className="text-left text-xs text-slate-500">{account.username}</p></div>{account.is_super_admin && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-700">Super Admin</span>}</div>
                  <div className="flex flex-wrap gap-2">
                    <select disabled={account.is_super_admin || !canManage || roles.length === 0} value={account.role_id || ''} onChange={e => void changeRole(account, e.target.value)} className="rounded-xl border px-3 py-2 text-sm disabled:bg-slate-100"><option value="">بدون نقش</option>{roles.map(role => <option key={role.id} value={role.id}>{role.title}</option>)}</select>
                    <button type="button" disabled={account.is_super_admin || !canManage} onClick={() => void toggle(account)} className={`rounded-xl px-3 py-2 text-sm ${account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} disabled:opacity-40`}>{account.is_active ? 'فعال' : 'غیرفعال'}</button>
                    <button type="button" disabled={!canManage} onClick={() => void resetPassword(account)} className="rounded-xl border px-3 py-2 disabled:opacity-40"><KeyRound className="h-4 w-4" /></button>
                    <button type="button" disabled={account.is_super_admin || !canManage} onClick={() => void remove(account)} className="rounded-xl bg-red-50 px-3 py-2 text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
