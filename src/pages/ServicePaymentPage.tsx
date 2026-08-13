import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, ReceiptText, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getServiceRequestById,
  payServiceRequestTest,
  type ServiceRequest,
} from '../customer/services/serviceRequestsApi';

const money = (value: number) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

export default function ServicePaymentPage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
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
    setPaying(true);
    setError('');
    try {
      const paid = await payServiceRequestTest(requestId);
      setRequest(paid);
    } catch (err: any) {
      setError(err?.message || 'پرداخت آزمایشی انجام نشد.');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 text-white"><Loader2 className="h-9 w-9 animate-spin text-amber-300" /></main>;
  }

  if (!request) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center text-red-200">{error || 'درخواست سرویس پیدا نشد.'}</div></main>;
  }

  const paid = request.payment_status === 'paid';

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
        <header className="border-b border-white/10 bg-gradient-to-l from-amber-400/20 to-transparent p-6 text-center">
          {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" /> : <CreditCard className="mx-auto h-14 w-14 text-amber-300" />}
          <h1 className="mt-4 text-2xl font-black">{paid ? 'پرداخت سرویس با موفقیت ثبت شد' : 'پرداخت رزرو سرویس'}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            {paid ? 'اکنون شماره درخواست و وضعیت رزرو در پروفایل شما قابل مشاهده است.' : 'شماره درخواست نهایی پس از پرداخت موفق نمایش داده می‌شود.'}
          </p>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-amber-300" /><b>{request.service_title}</b></div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p>خودرو: <b className="text-white">{request.vehicle_title}</b></p>
              <p>زمان: <b className="text-white">{request.preferred_date} - {request.booking_slot_label || request.preferred_time}</b></p>
              <p>مبلغ قابل پرداخت: <b className="text-amber-300">{money(Number(request.estimated_total || 0))}</b></p>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

          {paid ? (
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-center">
              <ReceiptText className="mx-auto h-9 w-9 text-emerald-300" />
              <p className="mt-3 text-sm text-emerald-100">شماره درخواست</p>
              <b className="mt-1 block text-xl text-white">{request.request_number}</b>
              {request.payment_reference && <p className="mt-2 text-xs text-emerald-200">شماره پیگیری پرداخت: {request.payment_reference}</p>}
              <button type="button" onClick={() => navigate('/dashboard#orders', { replace: true })} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-slate-950">
                مشاهده وضعیت سفارش در پروفایل
              </button>
            </div>
          ) : (
            <>
              <button type="button" disabled={paying} onClick={() => void payTest()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 disabled:opacity-60">
                {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {paying ? 'در حال ثبت پرداخت...' : 'پرداخت آزمایشی و ادامه'}
              </button>
              <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                این مرحله فعلاً از درگاه آزمایشی پروژه استفاده می‌کند و بعداً به درگاه اصلی متصل می‌شود.
              </div>
            </>
          )}

          <Link to="/book" className="block text-center text-sm text-slate-400 hover:text-white">بازگشت به رزرو سرویس</Link>
        </div>
      </section>
    </main>
  );
}
