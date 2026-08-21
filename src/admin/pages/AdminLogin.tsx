import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { signInStaffWithTemporaryPassword } from '../../auth/staffPasswordAuth';

export default function AdminLogin() {
  const { refresh, isAuthenticated, loading } = useAdminAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const returnTo = params.get('returnTo') || '/admin/dashboard';

  useEffect(() => { document.title = 'ورود مدیریت | Carrtell'; }, []);
  if (!loading && isAuthenticated) return <Navigate to={returnTo} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await signInStaffWithTemporaryPassword('admin', username, password); await refresh(); navigate(returnTo, { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : 'ورود ناموفق بود.'); }
    finally { setSubmitting(false); }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center">
        <form onSubmit={submit} className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950"><ShieldCheck className="h-8 w-8" /></div>
            <h1 className="mt-4 text-2xl font-black">ورود به پنل مدیریت</h1>
            <p className="mt-2 text-sm text-slate-400">ورود مدیران با نام کاربری و رمز عبور؛ بدون OTP</p>
          </div>
          <label className="mb-2 block text-sm font-bold">نام کاربری</label>
          <div className="relative mb-5"><UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="مثلاً amin" /></div>
          <label className="mb-2 block text-sm font-bold">رمز عبور</label>
          <div className="relative mb-4"><LockKeyhole className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="رمز عبور" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
          {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          <button disabled={submitting || !username.trim() || !password} className="w-full rounded-2xl bg-amber-400 px-4 py-3.5 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'در حال ورود...' : 'ورود امن'}</button>
          <p className="mt-5 text-center text-xs leading-6 text-slate-500">نام کاربری و رمز موقت از تنظیمات مرکزی مدیریت قابل تغییر است.</p>
        </form>
      </div>
    </main>
  );
}
