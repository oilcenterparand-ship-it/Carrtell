import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, CreditCard, ExternalLink, Home, Loader2, ReceiptText, RotateCcw, ShieldCheck, ShoppingBag, XCircle } from 'lucide-react';
import { getOrder, type Order } from '../admin/services/ordersApi';
import { formatPrice } from '../admin/services/ordersUtils';
import {
  createTestPayment,
  getLatestPaymentByOrder,
  getPaymentGatewaySettings,
  startZarinpalPayment,
  verifyZarinpalPayment,
  type Payment,
  type PaymentGatewaySettings,
} from '../admin/services/paymentsApi';
import { clearCart } from '../lib/cart';

function formatDate(value?: string | null) {
  if (!value) return 'ثبت نشده';
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case 'paid': return 'پرداخت شده';
    case 'pending_payment': return 'در انتظار پرداخت';
    case 'processing': return 'در حال آماده‌سازی';
    case 'completed': return 'تکمیل شده';
    case 'cancelled': return 'لغو شده';
    default: return 'در انتظار پرداخت';
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const authority = params.get('Authority') || params.get('authority') || '';
  const gatewayStatus = params.get('Status') || params.get('status') || '';
  const provider = params.get('provider') || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [settings, setSettings] = useState<PaymentGatewaySettings | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isPaying, setPaying] = useState(false);
  const [isVerifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [setupMessage, setSetupMessage] = useState('');

  const isPaid = useMemo(() => order?.status === 'paid' || order?.payment_status === 'paid' || payment?.status === 'paid', [order, payment]);
  const useZarinpal = settings?.activeProvider === 'zarinpal' && settings.zarinpalEnabled;

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!orderId) {
        setError('شناسه سفارش در آدرس صفحه وجود ندارد.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [loadedOrder, latestPayment, paymentSettings] = await Promise.all([
          getOrder(orderId),
          getLatestPaymentByOrder(orderId).catch(() => null),
          getPaymentGatewaySettings().catch(() => null),
        ]);
        if (!mounted) return;
        setOrder(loadedOrder);
        setPayment(latestPayment);
        setSettings(paymentSettings);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'سفارش پیدا نشد.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !authority || provider !== 'zarinpal' || isPaid || isVerifying) return;
    let mounted = true;
    async function verify() {
      setVerifying(true);
      setError('');
      try {
        const result = await verifyZarinpalPayment(orderId, authority, gatewayStatus || 'OK');
        if (!mounted) return;
        setOrder(result.order);
        setPayment(result.payment || null);
        clearCart();
        navigate(`/order-success/${orderId}`, { replace: true });
      } catch (err: any) {
        if (mounted) setError(err?.message || 'تایید پرداخت انجام نشد.');
      } finally {
        if (mounted) setVerifying(false);
      }
    }
    verify();
    return () => { mounted = false; };
  }, [authority, gatewayStatus, isPaid, isVerifying, orderId, provider]);

  async function payTest() {
    if (!orderId) return;
    setPaying(true);
    setError('');
    setSetupMessage('');
    try {
      const result = await createTestPayment(orderId);
      setOrder(result.order);
      setPayment(result.payment || null);
      clearCart();
      navigate(`/order-success/${orderId}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'پرداخت آزمایشی انجام نشد.');
    } finally {
      setPaying(false);
    }
  }

  async function payZarinpal() {
    if (!orderId) return;
    setPaying(true);
    setError('');
    setSetupMessage('');
    try {
      const result = await startZarinpalPayment(orderId);
      setPayment(result.payment || null);
      if (result.setupRequired || !result.redirectUrl) {
        setSetupMessage(result.message || 'درگاه زرین‌پال هنوز کامل تنظیم نشده است.');
        return;
      }
      window.location.href = result.redirectUrl;
    } catch (err: any) {
      setError(err?.message || 'اتصال به زرین‌پال انجام نشد.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--site-bg,#0b1220)] px-4 pb-10 pt-32 text-[var(--text-primary,#fff)]">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--card-bg,#111827)] shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 bg-gradient-to-l from-yellow-500/15 via-amber-500/10 to-transparent p-6 text-center">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-[var(--primary,#f5c518)]" />
          <h1 className="text-2xl font-black">پرداخت سفارش</h1>
          <p className="mt-3 leading-7 text-[var(--text-muted,#94a3b8)]">
            پرداخت آزمایشی حفظ شده و ساختار زرین‌پال هم آماده است. فعال‌سازی کامل از پنل مدیریت انجام می‌شود.
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-[var(--text-muted,#94a3b8)]">
              <Loader2 className="h-5 w-5 animate-spin" /> در حال دریافت اطلاعات سفارش...
            </div>
          ) : isVerifying ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-amber-100">
              <Loader2 className="h-5 w-5 animate-spin" /> در حال تایید پرداخت زرین‌پال...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-7 text-red-200">
              <XCircle className="mb-2 h-5 w-5" /> {error}
            </div>
          ) : order ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted,#94a3b8)]">شماره سفارش</p>
                    <b className="mt-1 block text-xl">{order.order_number || order.id}</b>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${isPaid ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><CreditCard className="h-4 w-4" /> مبلغ قابل پرداخت</p>
                    <b className="mt-2 block text-lg text-[var(--primary,#f5c518)]">{formatPrice(Number(order.total_amount || 0))} تومان</b>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><ShoppingBag className="h-4 w-4" /> تعداد کالا</p>
                    <b className="mt-2 block">{Number(order.items_count || 0).toLocaleString('fa-IR')} عدد</b>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-[var(--text-muted,#94a3b8)]">مشتری</p>
                    <b className="mt-2 block">{order.customer_name || 'ثبت نشده'}</b>
                    {order.customer_phone && <span className="mt-1 block text-xs text-[var(--text-muted,#94a3b8)]">{order.customer_phone}</span>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><Clock3 className="h-4 w-4" /> زمان ثبت سفارش</p>
                    <b className="mt-2 block text-sm">{formatDate(order.created_at)}</b>
                  </div>
                </div>

                {(order.customer_address || order.customer_car) && (
                  <div className="mt-3 grid gap-3">
                    {order.customer_address && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7">
                        <span className="mb-1 block text-xs text-[var(--text-muted,#94a3b8)]">آدرس دریافت</span>
                        {order.customer_address}
                      </div>
                    )}
                    {order.customer_car && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                        <span className="text-[var(--text-muted,#94a3b8)]">خودروی سفارش: </span>{order.customer_car}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {setupMessage && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
                  {setupMessage}
                  <Link to="/admin/payment-settings" className="mt-3 inline-flex rounded-xl bg-amber-400 px-4 py-2 font-black text-black">
                    رفتن به تنظیمات پرداخت
                  </Link>
                </div>
              )}

              {isPaid ? (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-300" />
                  <h2 className="text-xl font-black text-emerald-100">پرداخت با موفقیت ثبت شد</h2>
                  {payment?.reference_id && <p className="mt-2 text-sm text-emerald-200">شماره پیگیری: <b>{payment.reference_id}</b></p>}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => navigate(`/invoice/${order.id}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black">
                      <ReceiptText className="h-5 w-5" /> مشاهده فاکتور
                    </button>
                    <Link to="/dashboard" className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 font-black text-white hover:bg-white/15">
                      رفتن به پروفایل
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {useZarinpal && (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={payZarinpal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ExternalLink className="h-5 w-5" />}
                      {isPaying ? 'در حال اتصال به زرین‌پال...' : 'پرداخت با زرین‌پال'}
                    </button>
                  )}

                  {settings?.testGatewayEnabled !== false && (
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={payTest}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-6 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      {isPaying ? 'در حال ثبت پرداخت...' : 'پرداخت آزمایشی و ثبت رسید'}
                    </button>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start gap-3 text-sm text-[var(--text-muted,#94a3b8)]">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary,#f5c518)]" />
                  <p className="leading-7">پرداخت فقط برای همین سفارش ثبت می‌شود. در صورت قطع اتصال، دوباره همین صفحه را باز کن و از دکمه تلاش مجدد استفاده کن؛ سفارش تکراری ساخته نمی‌شود.</p>
                </div>
              </div>

              {!isPaid && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">
                    <RotateCcw className="h-4 w-4" /> تلاش مجدد
                  </button>
                  <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">
                    <Home className="h-4 w-4" /> بازگشت به فروشگاه
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          {!isPaid && (
            <Link to="/cart" className="mt-5 inline-flex rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-[var(--text-primary,#fff)] hover:bg-white/15">
              بازگشت به سبد خرید
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
