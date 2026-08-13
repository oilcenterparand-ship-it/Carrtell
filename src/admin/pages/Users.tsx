import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck, UserCog, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../auth/authApi';

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
  source: 'profiles' | 'user_access';
};

const roleLabels: Record<UserRole, string> = {
  admin: 'مدیر',
  driver: 'سرویس‌کار',
  technician: 'تکنسین',
  customer: 'مشتری',
};

const emptyForm = { full_name: '', phone: '', role: 'customer' as UserRole };

function normalizePhone(input: string) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('98')) return `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits;
}

function Users() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadProfiles = async () => {
    setLoading(true);
    setError('');
    try {
      const [profilesResult, accessResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, phone, role, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_access')
          .select('id, full_name, phone, role, created_at, updated_at')
          .order('created_at', { ascending: false }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (accessResult.error) throw accessResult.error;

      const byPhone = new Map<string, ProfileRow>();
      for (const item of (profilesResult.data || [])) {
        const row = { ...item, source: 'profiles' as const } as ProfileRow;
        byPhone.set(item.phone || item.id, row);
      }
      for (const item of (accessResult.data || [])) {
        const row = { ...item, source: 'user_access' as const } as ProfileRow;
        byPhone.set(item.phone || item.id, row);
      }
      setProfiles(Array.from(byPhone.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((profile) => [profile.full_name, profile.phone, profile.role, profile.id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)));
  }, [profiles, query]);

  const updateRole = async (profile: ProfileRow, role: UserRole) => {
    setSavingId(profile.id);
    setError('');
    setSuccess('');
    try {
      const { error: updateError } = await supabase
        .from(profile.source)
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      setProfiles((prev) => prev.map((item) => item.id === profile.id ? { ...item, role } : item));
      setSuccess('سطح دسترسی کاربر با موفقیت تغییر کرد.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تغییر نقش');
    } finally {
      setSavingId(null);
    }
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    const phone = normalizePhone(form.phone);
    if (!form.full_name.trim()) {
      setError('نام کاربر را وارد کن.');
      return;
    }
    if (!/^09\d{9}$/.test(phone)) {
      setError('شماره موبایل معتبر وارد کن؛ مانند 09123456789.');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const { error: insertError } = await supabase
        .from('user_access')
        .upsert({
          full_name: form.full_name.trim(),
          phone,
          role: form.role,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'phone' });

      if (insertError) throw insertError;
      setSuccess('کاربر جدید ثبت شد و سطح دسترسی او فعال است.');
      setForm(emptyForm);
      setShowAdd(false);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در افزودن کاربر');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
              <ShieldCheck className="h-4 w-4" />
              مدیریت نقش‌ها
            </div>
            <h1 className="text-2xl font-black text-white">کاربران و دسترسی‌ها</h1>
            <p className="mt-2 text-sm text-slate-400">کاربر جدید اضافه کن یا نقش کاربران را به مدیر، سرویس‌کار یا مشتری تغییر بده.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              افزودن کاربر جدید
            </button>
            <button
              type="button"
              onClick={() => void loadProfiles()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={createUser} className="rounded-3xl border border-amber-400/20 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">افزودن کاربر جدید</h2>
              <p className="mt-1 text-sm text-slate-400">کاربر با همین شماره وارد می‌شود و نقش تعیین‌شده را دریافت می‌کند.</p>
            </div>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="بستن">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-300">
              <span>نام و نام خانوادگی</span>
              <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="مثلاً علی رضایی" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>شماره موبایل</span>
              <input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-white outline-none focus:border-amber-400" placeholder="09123456789" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>سطح دسترسی</span>
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400">
                <option value="customer">مشتری</option>
                <option value="driver">سرویس‌کار</option>
                <option value="admin">مدیر</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={creating} className="mt-5 inline-flex min-w-40 items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">
            {creating ? 'در حال ثبت...' : 'ثبت کاربر'}
          </button>
        </form>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو براساس نام، موبایل یا نقش..."
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
        />
      </div>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{success}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-slate-950/80 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-4">کاربر</th>
                <th className="px-4 py-4">موبایل</th>
                <th className="px-4 py-4">نقش فعلی</th>
                <th className="px-4 py-4">تغییر نقش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">در حال دریافت کاربران...</td></tr>
              ) : filteredProfiles.length ? filteredProfiles.map((profile) => (
                <tr key={`${profile.source}-${profile.id}`} className="text-slate-200">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-800 text-amber-200"><UserCog className="h-5 w-5" /></span>
                      <div>
                        <p className="font-bold text-white">{profile.full_name || 'بدون نام'}</p>
                        <p className="mt-1 text-xs text-slate-500">{profile.source === 'user_access' ? 'ثبت‌شده از پنل' : 'کاربر ثبت‌نام‌شده'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{profile.phone || '—'}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">{roleLabels[profile.role] || profile.role}</span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={profile.role}
                      disabled={savingId === profile.id}
                      onChange={(event) => void updateRole(profile, event.target.value as UserRole)}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400 disabled:opacity-60"
                    >
                      <option value="customer">مشتری</option>
                      <option value="driver">سرویس‌کار</option>
                      <option value="admin">مدیر</option>
                    </select>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">کاربری پیدا نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Users;
