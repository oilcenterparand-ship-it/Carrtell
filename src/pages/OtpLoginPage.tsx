import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, Phone } from 'lucide-react';
import { requestOtp, verifyOtp } from '../services/smsOtpApi';
import { emitAuthChanged } from '../auth/authApi';

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedReturnTo = params.get('returnTo') || '/';
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    const safePhone = phone.replace(/\s/g, '');
    if (!/^09\d{9}$/.test(safePhone)) {
      setMsg('شماره موبایل معتبر وارد کن؛ مانند 09123456789.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const result = await requestOtp(safePhone);
      setSent(true);
      setPhone(result.phone || safePhone);
      setMsg(result.dev_code ? `کد تست: ${result.dev_code}` : 'کد ورود ارسال شد.');
    } catch (error: any) {
      setMsg(error?.message || 'ارسال کد انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function check() {
    if (!code.trim()) {
      setMsg('کد ورود را وارد کن.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const result = await verifyOtp(phone, code.trim());
      if (!result.ok) {
        setMsg('کد نامعتبر یا منقضی است.');
        return;
      }

      localStorage.setItem('carrtell_customer_profile', JSON.stringify({
        id: result.id,
        phone: result.phone || phone,
        fullName: result.full_name || undefined,
      }));
      localStorage.setItem('carrtell_user_role', result.role || 'customer');
      emitAuthChanged();

      // ورود و ثبت‌نام عادی همیشه به صفحه اصلی فروشگاه برمی‌گردد.
      // فقط وقتی کاربر واقعاً از مسیر سبد خرید آمده باشد، ادامه خرید فعال می‌شود.
      const shouldResumeCheckout = requestedReturnTo.startsWith('/cart');

      if (shouldResumeCheckout) {
        sessionStorage.setItem('carrtell_checkout_resume', 'info');
      } else {
        sessionStorage.removeItem('carrtell_checkout_resume');
      }

      setMsg('ورود با موفقیت انجام شد.');
      window.setTimeout(
        () => navigate(shouldResumeCheckout ? '/cart' : '/', { replace: true }),
        250,
      );
    } catch (error: any) {
      setMsg(error?.message || 'تایید کد انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/30">
        <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowRight className="h-4 w-4" /> بازگشت
        </button>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
          {sent ? <KeyRound className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
        </div>
        <h1 className="mt-4 text-center text-2xl font-black">{sent ? 'تایید کد ورود' : 'ورود با شماره موبایل'}</h1>
        <p className="mt-2 text-center text-sm leading-7 text-slate-400">بعد از ورود، وارد صفحه اصلی فروشگاه می‌شوی.</p>

        <div className="mt-6 space-y-4">
          <input
            inputMode="tel"
            placeholder="شماره موبایل؛ 09xxxxxxxxx"
            value={phone}
            disabled={sent || loading}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400 disabled:opacity-70"
          />
          {sent && (
            <input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="کد ۶ رقمی"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-center text-xl tracking-[0.5em] text-white outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-amber-400"
            />
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => void (sent ? check() : send())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {sent ? 'تایید و ورود به فروشگاه' : 'دریافت کد ورود'}
          </button>
          {sent && (
            <button type="button" disabled={loading} onClick={() => { setSent(false); setCode(''); setMsg(''); }} className="w-full rounded-2xl border border-white/10 p-3 text-sm text-slate-300 hover:bg-white/5">
              اصلاح شماره موبایل
            </button>
          )}
          {msg && <p className={`rounded-2xl border px-4 py-3 text-center text-sm ${msg.includes('موفقیت') || msg.includes('کد تست') || msg.includes('ارسال شد') ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>{msg}</p>}
        </div>
      </section>
    </main>
  );
}
