import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, UserPlus } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../auth/AdminAuthProvider';

export default function AdminSetup() {
  const navigate = useNavigate();
  const { isAuthenticated, refresh } = useAdminAuth();
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'راه‌اندازی مدیریت | Carrtell';
    void (async () => {
      const { data, error: statusError } = await supabase.rpc('admin_setup_status');
      if (statusError) setError('ابتدا فایل SQL نسخه RC1-03E را اجرا کن.');
      else {
        setSetupRequired(Boolean((data as any)?.setup_required));
        setRecoveryMode(Boolean((data as any)?.recovery_mode));
      }
      setChecking(false);
    })();
  }, []);

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  if (!checking && !setupRequired && !error) return <Navigate to="/admin/login" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('تکرار رمز عبور یکسان نیست.');
    if (password.length < 10) return setError('رمز عبور باید حداقل ۱۰ کاراکتر باشد.');
    setSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const { error: setupError } = await supabase.rpc('bootstrap_first_super_admin', {
        p_username: cleanUsername,
        p_password: password,
        p_full_name: fullName.trim(),
        p_email: null,
      });
      if (setupError) throw new Error(setupError.message || 'ساخت حساب انجام نشد.');

      const email = `${cleanUsername}@admin.carrtell.local`;
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw new Error('حساب ساخته شد اما ورود خودکار انجام نشد؛ از صفحه ورود وارد شو.');
      await refresh();
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'راه‌اندازی ناموفق بود.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-lg place-items-center">
        <form onSubmit={submit} className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950"><UserPlus className="h-8 w-8" /></div>
            <h1 className="mt-4 text-2xl font-black">راه‌اندازی اولیه Carrtell</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{recoveryMode ? 'حساب ناقص قبلی را همین‌جا تعمیر کن و به Super Admin تبدیل کن.' : 'اولین Super Admin را همین‌جا بساز؛ بدون CLI یا Edge Function.'}</p>
          </div>

          {checking ? <div className="py-8 text-center text-slate-400">در حال بررسی وضعیت راه‌اندازی...</div> : (
            <>
              <label className="mb-2 block text-sm font-bold">نام و نام خانوادگی</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 outline-none focus:border-amber-400" placeholder="مثلاً امین اورعی" />

              <label className="mb-2 block text-sm font-bold">نام کاربری انگلیسی</label>
              <div className="relative mb-5"><UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="مثلاً amin" /></div>

              <label className="mb-2 block text-sm font-bold">رمز عبور</label>
              <div className="relative mb-5"><LockKeyhole className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="حداقل ۱۰ کاراکتر" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>

              <label className="mb-2 block text-sm font-bold">تکرار رمز عبور</label>
              <input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mb-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 outline-none focus:border-amber-400" placeholder="رمز را دوباره وارد کن" />

              {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm leading-6 text-red-200">{error}</div>}
              <button disabled={submitting || !username.trim() || !fullName.trim() || password.length < 10} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck className="h-5 w-5" />{submitting ? 'در حال آماده‌سازی حساب...' : recoveryMode ? 'تعمیر Super Admin و ورود' : 'ساخت Super Admin و ورود'}</button>
              <p className="mt-5 text-center text-xs leading-6 text-slate-500">پس از فعال‌شدن یک Super Admin سالم، این صفحه به‌صورت خودکار قفل می‌شود.</p>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
