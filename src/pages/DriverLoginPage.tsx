import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Wrench, UserRound } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { signInStaffWithTemporaryPassword } from '../auth/staffPasswordAuth';

export default function DriverLoginPage() {
  const { loading, isAuthenticated, role } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const returnTo = params.get('returnTo') || '/driver';
  useEffect(() => {
    document.title = 'ورود سرویس‌کار | Carrtell';
    // Defensive cleanup: a drawer/modal from a previous route must never keep
    // the technician login page scroll-locked.
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);
  if (!loading && isAuthenticated && (role === 'admin' || role === 'technician')) return <Navigate to={returnTo} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await signInStaffWithTemporaryPassword('technician', username, password); navigate(returnTo, { replace:true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'ورود ناموفق بود.'); }
    finally { setSubmitting(false); }
  }
  return <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-10 text-white"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center"><form onSubmit={submit} className="w-full rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl sm:p-8"><div className="mb-7 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Wrench className="h-8 w-8" /></div><h1 className="mt-4 text-2xl font-black">ورود سرویس‌کار</h1><p className="mt-2 text-sm text-slate-400">ورود با نام کاربری و رمز؛ بدون وابستگی به پیامک</p></div><label className="mb-2 block text-sm font-bold">نام کاربری</label><div className="relative mb-5"><UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="نام کاربری" /></div><label className="mb-2 block text-sm font-bold">رمز عبور</label><div className="relative mb-4"><LockKeyhole className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3.5 outline-none focus:border-amber-400" placeholder="رمز عبور"/><button type="button" onClick={()=>setShow(v=>!v)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400">{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>{error&&<div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}<button disabled={submitting||!username.trim()||!password} className="w-full rounded-2xl bg-amber-400 px-4 py-3.5 font-black text-slate-950 disabled:opacity-50">{submitting?'در حال ورود...':'ورود به پنل سرویس‌کار'}</button></form></div></main>;
}
