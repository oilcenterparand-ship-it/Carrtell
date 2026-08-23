import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Download, Loader2, ShieldCheck, UserRoundPlus, Wrench } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getServiceRequestById,
  payServiceRequestTest,
  claimGuestServiceRequest,
  type ServiceRequest,
} from '../customer/services/serviceRequestsApi';
import { downloadServiceInvoiceImage } from '../utils/serviceInvoiceImage';
import { setCustomerCredentials } from '../auth/authApi';

const money = (value: number) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

function accountUsernameFromPhone(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
}

export default function ServicePaymentPage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [accountSetupOpen, setAccountSetupOpen] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requestId) {
      setError('شناسه درخواست سرویس موجود نیست.');
      setLoading(false);
      return;
    }
    getServiceRequestById(requestId)
      .then(setRequest)
      .catch((err: any) => setError(err?.message || 'درخواست سرویس پیدا نشد.'))
      .finally(() => setLoading(false));
  }, [requestId]);

  async function payTest() {
    if (!requestId) return;
    setPaying(true); setError('');
    try { setRequest(await payServiceRequestTest(requestId)); }
    catch (err: any) { setError(err?.message || 'پرداخت آزمایشی انجام نشد.'); }
    finally { setPaying(false); }
  }

  async function acceptAccount() {
    if (!requestId || !request) return;
    if (!accountSetupOpen) {
      setAccountSetupOpen(true);
      setError('');
      return;
    }

    if (accountPassword.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (accountPassword !== accountPasswordConfirm) {
      setError('تکرار رمز عبور با رمز اصلی یکسان نیست.');
      return;
    }

    const username = accountUsernameFromPhone(request.customer_phone);
    if (!/^09\d{9}$/.test(username)) {
      setError('شماره موبایل رزرو برای ساخت حساب معتبر نیست.');
      return;
    }

    setClaiming(true); setError('');
    try {
      await setCustomerCredentials(username, accountPassword);
      const claimed = await claimGuestServiceRequest(requestId);
      setRequest(claimed);
      navigate('/dashboard#orders', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'فعال‌سازی حساب و اتصال رزرو انجام نشد.');
    } finally { setClaiming(false); }
  }

  if (loading) return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 text-white"><Loader2 className="h-9 w-9 animate-spin text-amber-300" /></main>;
  if (!request) return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center text-red-200">{error || 'درخواست سرویس پیدا نشد.'}</div></main>;

  const paid = request.payment_status === 'paid';
  const accountUsername = accountUsernameFromPhone(request.customer_phone);

  return <main dir="rtl" className="min-h-screen bg-slate-950 px-4 pb-28 pt-8 text-white">
    <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
      <header className="border-b border-white/10 bg-gradient-to-l from-amber-400/20 to-transparent p-6 text-center">
        {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" /> : <CreditCard className="mx-auto h-14 w-14 text-amber-300" />}
        <h1 className="mt-4 text-2xl font-black">{paid ? 'پرداخت سرویس با موفقیت ثبت شد' : 'پرداخت رزرو سرویس'}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-400">{paid ? 'رزرو شما ثبت شد و وارد صف عملیات سرویس Carrtell می‌شود.' : 'شماره درخواست نهایی پس از پرداخت موفق نمایش داده می‌شود.'}</p>
      </header>

      <div className="space-y-4 p-5">
        {!paid && <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-amber-300" /><b>{request.service_title}</b></div>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <p>خودرو: <b className="text-white">{request.vehicle_title}</b></p>
            <p>زمان: <b className="text-white">{request.preferred_date} - {request.booking_slot_label || request.preferred_time}</b></p>
            <p>مبلغ قابل پرداخت: <b className="text-amber-300">{money(Number(request.estimated_total || 0))}</b></p>
          </div>
        </div>}

        {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-7 text-red-200">{error}</div>}

        {paid ? <>
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-center">
            <p className="text-sm font-bold text-emerald-100">شماره درخواست</p>
            <b className="mt-1 block text-2xl text-white">{request.request_number}</b>
            {request.payment_reference && <p className="mt-2 text-xs text-emerald-200">پیگیری پرداخت: {request.payment_reference}</p>}
          </div>

          <button type="button" onClick={() => downloadServiceInvoiceImage(request)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950">
            <Download className="h-5 w-5" /> دریافت فاکتور به‌صورت عکس
          </button>

          {request.customer_user_id ? <button type="button" onClick={() => navigate('/dashboard#orders', { replace: true })} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 font-black text-white">مشاهده وضعیت سفارش در پروفایل</button> : <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-start gap-3"><UserRoundPlus className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><div><p className="text-sm font-bold text-white">مایل هستید حساب کاربری شما فعال شود؟</p><p className="mt-1 text-xs leading-6 text-slate-400">شماره موبایل تأییدشده همین رزرو، نام کاربری شما خواهد بود و تأیید پیامکی دوباره لازم نیست.</p></div></div>

            {accountSetupOpen && <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>نام کاربری</span>
                <input aria-label="نام کاربری" value={accountUsername} readOnly className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-white outline-none" dir="ltr" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>رمز عبور</span>
                <input aria-label="رمز عبور" type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder="حداقل ۸ کاراکتر" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-emerald-400" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>تکرار رمز عبور</span>
                <input aria-label="تکرار رمز عبور" type="password" value={accountPasswordConfirm} onChange={(event) => setAccountPasswordConfirm(event.target.value)} placeholder="تکرار رمز عبور" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-emerald-400" />
              </label>
            </div>}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={claiming} onClick={() => void acceptAccount()} className="rounded-xl bg-emerald-400 px-3 py-3 text-center text-sm font-black text-slate-950 disabled:opacity-60">{claiming ? 'در حال فعال‌سازی...' : accountSetupOpen ? 'ساخت حساب و ورود' : 'بله، حسابم را فعال کن'}</button>
              <Link to="/" className="rounded-xl border border-white/10 px-3 py-3 text-center text-sm font-bold text-slate-300">نه، ممنون</Link>
            </div>
          </div>}
        </> : <>
          <button type="button" disabled={paying} onClick={() => void payTest()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 disabled:opacity-60">{paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}{paying ? 'در حال ثبت پرداخت...' : 'پرداخت آزمایشی و ادامه'}</button>
          <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />این مرحله فعلاً از درگاه آزمایشی پروژه استفاده می‌کند و بعداً به درگاه اصلی متصل می‌شود.</div>
        </>}

        <Link to="/book" className="block text-center text-sm text-slate-400 hover:text-white">بازگشت به رزرو سرویس</Link>
      </div>
    </section>
  </main>;
}
