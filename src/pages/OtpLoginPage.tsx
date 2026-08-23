import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Phone, RefreshCw, UserRound } from 'lucide-react';
import { requestOtpWithRetry, verifyOtp } from '../services/smsOtpApi';
import { getCurrentCarrtellUser, normalizeDigits, saveCustomerDisplayName, setCustomerCredentials, signInWithUsername } from '../auth/authApi';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;
type LoginMode = 'sms' | 'password';

function localDigits(value: string) {
  return normalizeDigits(value).replace(/\D/g, '');
}

function toLocalIranPhone(value: string) {
  const digits = localDigits(value);
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function friendlyAuthError(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : String(error || '');
  const message = raw.toLowerCase();
  if (message.includes('rate limit') || message.includes('too many')) return 'تعداد درخواست‌ها زیاد شده است. کمی صبر کن و دوباره تلاش کن.';
  if (message.includes('expired')) return 'کد تأیید منقضی شده است. یک کد جدید دریافت کن.';
  if (message.includes('invalid') || message.includes('token') || message.includes('otp')) return 'کد واردشده صحیح نیست یا اعتبار آن تمام شده است.';
  if (message.includes('network') || message.includes('fetch')) return 'ارتباط با سرور برقرار نشد. اینترنت را بررسی کن و دوباره تلاش کن.';
  if (message.includes('sms_provider_failed') || message.includes('kavenegar')) return 'ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کن.';
  return raw || fallback;
}

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedReturnTo = params.get('returnTo') || '/';
  const recoveryMode = params.get('recovery') === '1';
  const [mode, setMode] = useState<LoginMode>('sms');
  const [phone, setPhone] = useState(toLocalIranPhone(params.get('phone') || ''));
  const [displayName, setDisplayName] = useState('');
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);
  const localPhone = useMemo(() => toLocalIranPhone(phone), [phone]);

  useEffect(() => {
    if (!sent || resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((current) => (current > 0 ? current - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [sent, resendIn]);

  useEffect(() => {
    if (!sent || showSetup || code.length === OTP_LENGTH) return;
    const nav = navigator as Navigator & { credentials?: CredentialsContainer };
    if (!nav.credentials || typeof AbortController === 'undefined') return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90000);
    (nav.credentials.get as any)({ otp: { transport: ['sms'] }, signal: controller.signal })
      .then((credential: any) => {
        const incoming = localDigits(credential?.code || '').slice(0, OTP_LENGTH);
        if (incoming.length !== OTP_LENGTH) return;
        setDigits(incoming.split(''));
      })
      .catch(() => undefined);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [sent, showSetup, code.length]);

  useEffect(() => {
    if (sent && code.length === OTP_LENGTH && !loading && !showSetup) void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function safeReturnTo() {
    return requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/';
  }

  function focusDigit(index: number) {
    window.requestAnimationFrame(() => inputRefs.current[index]?.focus());
  }

  function resetOtpInputs(focus = true) {
    setDigits(Array(OTP_LENGTH).fill(''));
    if (focus) focusDigit(0);
  }

  async function sendOtp(isResend = false) {
    const safePhone = toLocalIranPhone(phone).replace(/\s/g, '');
    if (!recoveryMode && displayName.trim().length < 2) {
      setNotice({ tone: 'error', text: 'نام و نام خانوادگی را وارد کن تا بعد از ورود با نام خودت نمایش داده شوی.' });
      return;
    }
    if (!/^09\d{9}$/.test(safePhone)) {
      setNotice({ tone: 'error', text: 'شماره موبایل معتبر وارد کن؛ اعداد فارسی و انگلیسی هر دو قابل قبول‌اند.' });
      return;
    }
    setLoading(true); setNotice(null);
    try {
      const result = await requestOtpWithRetry(safePhone);
      setSent(true);
      setPhone(toLocalIranPhone(result.phone || safePhone));
      setResendIn(result.expires_in || RESEND_SECONDS);
      resetOtpInputs(true);
      setNotice({ tone: 'success', text: isResend ? 'کد جدید برایت پیامک شد.' : 'کد ورود پیامک شد؛ اگر گوشی پشتیبانی کند کد به‌صورت خودکار پیشنهاد یا تکمیل می‌شود.' });
    } catch (error) {
      setNotice({ tone: 'error', text: `${friendlyAuthError(error, 'ارسال کد انجام نشد.')} اگر قبلاً رمز ساخته‌ای، از تب «نام کاربری و رمز» وارد شو.` });
    } finally { setLoading(false); }
  }

  async function check() {
    if (code.length !== OTP_LENGTH || loading) return;
    setLoading(true); setNotice(null);
    try {
      const result = await verifyOtp(localPhone, code);
      if (!result.ok) throw new Error('کد نامعتبر یا منقضی است.');
      if (!recoveryMode && displayName.trim()) await saveCustomerDisplayName(displayName.trim());
      const current = await getCurrentCarrtellUser().catch(() => null);
      if (recoveryMode || !current?.username) {
        setUsername(current?.username || toLocalIranPhone(current?.phone || localPhone));
        setShowSetup(true);
        setNotice({ tone: 'info', text: recoveryMode ? 'شماره تأیید شد. حالا نام کاربری و رمز جدیدت را ذخیره کن.' : 'شماره تأیید شد. برای ورودهای بعدی می‌توانی یک نام کاربری و رمز تعیین کنی.' });
        return;
      }
      setNotice({ tone: 'success', text: 'ورود انجام شد.' });
      window.setTimeout(() => navigate(safeReturnTo(), { replace: true }), 180);
    } catch (error) {
      setNotice({ tone: 'error', text: friendlyAuthError(error, 'تأیید کد انجام نشد.') });
      resetOtpInputs(true);
    } finally { setLoading(false); }
  }

  async function saveCredentials(skip = false) {
    if (skip) { navigate(safeReturnTo(), { replace: true }); return; }
    if (password !== passwordConfirm) { setNotice({ tone: 'error', text: 'تکرار رمز عبور با رمز اصلی یکسان نیست.' }); return; }
    setLoading(true); setNotice(null);
    try {
      await setCustomerCredentials(username, password);
      setNotice({ tone: 'success', text: 'نام کاربری و رمز ذخیره شد. از این به بعد بدون پیامک هم می‌توانی وارد شوی.' });
      window.setTimeout(() => navigate(safeReturnTo(), { replace: true }), 300);
    } catch (error) { setNotice({ tone: 'error', text: friendlyAuthError(error, 'ذخیره اطلاعات ورود انجام نشد.') }); }
    finally { setLoading(false); }
  }

  async function passwordLogin() {
    if (loading) return;
    setLoading(true); setNotice(null);
    try {
      await signInWithUsername(loginUsername, loginPassword);
      setNotice({ tone: 'success', text: 'ورود موفق بود.' });
      window.setTimeout(() => navigate(safeReturnTo(), { replace: true }), 180);
    } catch (error) { setNotice({ tone: 'error', text: friendlyAuthError(error, 'نام کاربری یا رمز عبور صحیح نیست.') }); }
    finally { setLoading(false); }
  }

  function handleDigitChange(index: number, value: string) {
    const numeric = localDigits(value);
    if (!numeric) {
      setDigits((current) => current.map((digit, i) => (i === index ? '' : digit)));
      return;
    }
    const incoming = numeric.slice(0, OTP_LENGTH - index).split('');
    setDigits((current) => {
      const next = [...current];
      incoming.forEach((digit, offset) => { next[index + offset] = digit; });
      return next;
    });
    focusDigit(Math.min(index + incoming.length, OTP_LENGTH - 1));
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = localDigits(event.clipboardData.getData('text')).slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => { next[index] = digit; });
    setDigits(next);
  }

  function editPhone() {
    setSent(false); setResendIn(0); resetOtpInputs(false); setNotice(null); setPhone(toLocalIranPhone(phone));
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/30">
        <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowRight className="h-4 w-4" /> بازگشت</button>

        {!showSetup && !sent && (
          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
            <button type="button" onClick={() => { setMode('sms'); setNotice(null); }} className={`rounded-xl px-3 py-2.5 text-sm font-black ${mode === 'sms' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}>ورود پیامکی</button>
            <button type="button" onClick={() => { setMode('password'); setNotice(null); }} className={`rounded-xl px-3 py-2.5 text-sm font-black ${mode === 'password' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}>نام کاربری و رمز</button>
          </div>
        )}

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
          {showSetup ? <UserRound className="h-7 w-7" /> : mode === 'password' ? <LockKeyhole className="h-7 w-7" /> : sent ? <KeyRound className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
        </div>
        <h1 className="mt-4 text-center text-2xl font-black">{showSetup ? 'ساخت ورود سریع' : mode === 'password' ? 'ورود با نام کاربری' : sent ? 'تأیید کد ورود' : 'ورود با شماره موبایل'}</h1>
        <p className="mt-2 text-center text-sm leading-7 text-slate-400">
          {showSetup ? 'نام کاربری به‌صورت خودکار همان شماره موبایل شماست؛ فقط یک رمز عبور تعیین کن.' : mode === 'password' ? 'اگر قبلاً نام کاربری و رمز ساخته‌ای، مستقیم وارد شو.' : sent ? `کد ۶ رقمی ارسال‌شده به ${localPhone} را وارد کن.` : 'اعداد فارسی و انگلیسی هر دو پشتیبانی می‌شوند.'}
        </p>

        <div className="mt-6 space-y-4">
          {showSetup ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3"><span className="block text-xs text-slate-500">نام کاربری شما</span><b dir="ltr" className="mt-1 block text-left tracking-wide text-white">{username || localPhone}</b></div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="رمز عبور؛ حداقل ۸ کاراکتر" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 pl-12 text-left outline-none focus:border-amber-400" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              <input type={showPassword ? 'text' : 'password'} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} autoComplete="new-password" placeholder="تکرار رمز عبور" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left outline-none focus:border-amber-400" />
              <button disabled={loading} onClick={() => void saveCredentials(false)} className="w-full rounded-2xl bg-amber-400 p-3 font-black text-slate-950 disabled:opacity-50">ذخیره رمز عبور</button>
              <button disabled={loading} onClick={() => void saveCredentials(true)} className="w-full rounded-2xl border border-white/10 p-3 text-sm text-slate-300">فعلاً رد شدن</button>
            </>
          ) : mode === 'password' && !sent ? (
            <>
              <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoCapitalize="none" autoComplete="username" placeholder="شماره موبایل / نام کاربری" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left outline-none focus:border-amber-400" />
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" placeholder="رمز عبور" onKeyDown={(e) => { if (e.key === 'Enter') void passwordLogin(); }} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left outline-none focus:border-amber-400" />
              <button disabled={loading} onClick={() => void passwordLogin()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 font-black text-slate-950 disabled:opacity-50">{loading && <Loader2 className="h-5 w-5 animate-spin" />} ورود</button>
              <button type="button" disabled={loading} onClick={() => { setMode('sms'); setPhone(''); setSent(false); setNotice({ tone: 'info', text: 'شماره موبایل حساب را وارد کن؛ بعد از تأیید پیامکی می‌توانی رمز جدید تعیین کنی.' }); navigate(`/login-otp?recovery=1&returnTo=${encodeURIComponent(safeReturnTo())}`, { replace: true }); }} className="w-full rounded-2xl border border-white/10 p-3 text-sm font-bold text-amber-300 disabled:opacity-50">رمز عبور را فراموش کرده‌ام</button>
            </>
          ) : (
            <>
              {!sent && <>
                {!recoveryMode && <input autoComplete="name" placeholder="نام و نام خانوادگی" value={displayName} disabled={loading} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-right text-white outline-none placeholder:text-slate-500 focus:border-amber-400 disabled:opacity-70" />}
                <input inputMode="tel" autoComplete="tel" placeholder="شماره موبایل؛ 09xxxxxxxxx" value={phone} disabled={loading} onChange={(event) => setPhone(toLocalIranPhone(event.target.value))} onKeyDown={(event) => { if (event.key === 'Enter') void sendOtp(false); }} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-white outline-none placeholder:text-right placeholder:text-slate-500 focus:border-amber-400 disabled:opacity-70" />
              </>}

              {sent && <>
                <div dir="ltr" className="mx-auto grid max-w-sm grid-cols-6 gap-2" aria-label="کد تأیید شش رقمی">
                  {digits.map((digit, index) => <input key={index} ref={(node) => { inputRefs.current[index] = node; }} type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={OTP_LENGTH} value={digit} disabled={loading} onFocus={(e) => e.currentTarget.select()} onChange={(e) => handleDigitChange(index, e.target.value)} onPaste={handlePaste} className="aspect-square min-w-0 rounded-xl border border-white/15 bg-slate-950 text-center text-xl font-black tabular-nums outline-none focus:border-amber-400" />)}
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm"><span className="text-slate-400">{resendIn > 0 ? `ارسال مجدد تا ${formatCountdown(resendIn)}` : 'کد را دریافت نکردی؟'}</span><button disabled={loading || resendIn > 0} onClick={() => void sendOtp(true)} className="inline-flex items-center gap-1.5 font-bold text-amber-300 disabled:text-slate-600"><RefreshCw className="h-4 w-4" /> ارسال مجدد</button></div>
              </>}

              <button disabled={loading || (sent && code.length !== OTP_LENGTH)} onClick={() => void (sent ? check() : sendOtp(false))} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 font-black text-slate-950 disabled:opacity-50">{loading && <Loader2 className="h-5 w-5 animate-spin" />}{sent ? 'تأیید و ورود' : 'دریافت کد ورود'}</button>
              {sent && <button disabled={loading} onClick={editPhone} className="w-full rounded-2xl border border-white/10 p-3 text-sm text-slate-300">اصلاح شماره موبایل</button>}
            </>
          )}

          {notice && <p role="status" className={`rounded-2xl border px-4 py-3 text-center text-sm leading-6 ${notice.tone === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : notice.tone === 'info' ? 'border-sky-400/20 bg-sky-500/10 text-sky-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>{notice.text}</p>}
        </div>
      </section>
    </main>
  );
}
