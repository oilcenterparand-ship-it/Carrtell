import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Home,
  Loader2,
  Package,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  XCircle,
  Wallet,
} from 'lucide-react';
import { getOrderPaymentSnapshot, type Order, type OrderItem } from '../admin/services/ordersApi';
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
import { applyWalletToOrder, getOrCreateMyWallet, type CustomerWallet } from '../services/loyaltyApi';

function formatDate(value?: string | null) {
  if (!value) return 'ثبت نشده';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
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
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [settings, setSettings] = useState<PaymentGatewaySettings | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isPaying, setPaying] = useState(false);
  const [isVerifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [setupMessage, setSetupMessage] = useState('');
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [usingWallet, setUsingWallet] = useState(false);

  const isPaid = useMemo(
    () => order?.status === 'paid' || order?.payment_status === 'paid' || payment?.status === 'paid',
    [order, payment],
  );
  const useZarinpal = settings?.activeProvider === 'zarinpal' && settings.zarinpalEnabled;
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0),
    [items],
  );
  const hasValidItems = items.length > 0 && itemCount > 0;

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
        const [snapshot, latestPayment, paymentSettings, customerWallet] = await Promise.all([
          getOrderPaymentSnapshot(orderId),
          getLatestPaymentByOrder(orderId).catch(() => null),
          getPaymentGatewaySettings().catch(() => null),
          getOrCreateMyWallet().catch(() => null),
        ]);
        if (!mounted) return;
        setOrder(snapshot.order);
        setItems(snapshot.items);
        setPayment(latestPayment);
        setSettings(paymentSettings);
        setWallet(customerWallet);
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
        if (mounted) setError(err?.message || 'تأیید پرداخت انجام نشد.');
      } finally {
        if (mounted) setVerifying(false);
      }
    }

    verify();
    return () => { mounted = false; };
  }, [authority, gatewayStatus, isPaid, isVerifying, navigate, orderId, provider]);

  async function payTest() {
    if (!orderId) return;
    if (!hasValidItems) {
      setError('پرداخت متوقف شد؛ این سفارش هیچ کالای معتبر و قابل فاکتوری ندارد. لطفاً به سبد خرید برگردید و سفارش را دوباره ثبت کنید.');
      return;
    }
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
    if (!hasValidItems) {
      setError('پرداخت متوقف شد؛ این سفارش هیچ کالای معتبر و قابل فاکتوری ندارد. لطفاً به سبد خرید برگردید و سفارش را دوباره ثبت کنید.');
      return;
    }
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

  async function useWalletCredit() {
    if (!orderId || !wallet || Number(wallet.credit_toman || 0) <= 0) return;
    try {
      setUsingWallet(true); setError('');
      const result = await applyWalletToOrder(orderId);
      setOrder((current) => current ? { ...current, ...result.order } as Order : current);
      setWallet((current) => current ? { ...current, credit_toman: result.wallet_balance } : current);
      if (result.remaining === 0 || result.order.payment_status === 'paid') {
        clearCart();
        navigate(`/order-success/${orderId}`, { replace: true });
      } else {
        setSetupMessage(`${Number(result.applied).toLocaleString('fa-IR')} تومان از کیف پول کم شد؛ مانده را با درگاه پرداخت کن.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'استفاده از کیف پول انجام نشد.');
    } finally { setUsingWallet(false); }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-3 pb-12 pt-28 text-slate-900 sm:px-5 lg:pt-32">
      <section className="mx-auto max-w-6xl">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> در حال دریافت اطلاعات سفارش...
          </div>
        ) : isVerifying ? (
          <div className="flex items-center justify-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-12 text-amber-800 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> در حال تأیید پرداخت زرین‌پال...
          </div>
        ) : order ? (
          <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-32">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs text-slate-500">خلاصه سفارش شما</p>
                  <h2 className="mt-1 text-lg font-black">{itemCount.toLocaleString('fa-IR')} کالا</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
                  <ShoppingBag className="h-5 w-5" />
                </span>
              </div>

              <div className="space-y-3">
                {items.length ? items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {item.product_image_url ? (
                        <img src={item.product_image_url} alt={item.product_name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <Package className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold leading-6">{item.product_name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {Number(item.quantity || 0).toLocaleString('fa-IR')} عدد × {formatPrice(Number(item.unit_price || 0))} تومان
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-500">
                    این سفارش بدون کالای معتبر ثبت شده و امکان پرداخت ندارد. برای جلوگیری از پرداخت اشتباه، به سبد خرید برگردید و سفارش را دوباره ثبت کنید.
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{itemCount.toLocaleString('fa-IR')} کالا</span>
                </div>
                <b className="mt-2 block text-2xl text-rose-500">{formatPrice(Number(order.total_amount || 0))} تومان</b>
                {Number(order.wallet_used || 0)>0?<p className="mt-1 text-xs text-emerald-600">{formatPrice(Number(order.wallet_used))} تومان قبلاً از کیف پول پرداخت شده</p>:null}
              </div>
            </aside>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-amber-100 bg-gradient-to-l from-amber-50 via-white to-white px-5 py-7 text-center sm:px-8">
                <CreditCard className="mx-auto mb-3 h-11 w-11 text-rose-500" />
                <h1 className="text-2xl font-black sm:text-3xl">پرداخت سفارش</h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  قبل از پرداخت، تعداد و اقلام سفارش را بررسی کنید. پس از پرداخت موفق، رسید و وضعیت سفارش در پروفایل شما ثبت می‌شود.
                </p>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                {wallet && Number(wallet.credit_toman || 0) > 0 && !isPaid ? <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-black text-emerald-900"><Wallet className="h-5 w-5" /> پرداخت از کیف پول</p><p className="mt-1 text-sm text-emerald-700">اعتبار موجود: {formatPrice(Number(wallet.credit_toman || 0))} تومان؛ اگر کافی نباشد فقط باقی مبلغ با درگاه پرداخت می‌شود.</p></div><button type="button" disabled={usingWallet} onClick={() => void useWalletCredit()} className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-50">{usingWallet ? 'در حال اعمال...' : 'استفاده از کیف پول'}</button></div> : null}
                <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="flex items-center gap-2 text-xs text-slate-500"><ShoppingBag className="h-4 w-4" /> تعداد کالا</p>
                    <b className="mt-2 block text-lg">{itemCount.toLocaleString('fa-IR')} عدد</b>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="flex items-center gap-2 text-xs text-slate-500"><CreditCard className="h-4 w-4" /> مبلغ پرداخت</p>
                    <b className="mt-2 block text-lg text-rose-500">{formatPrice(Number(order.total_amount || 0))} تومان</b>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-4 w-4" /> زمان ثبت</p>
                    <b className="mt-2 block text-sm leading-6">{formatDate(order.created_at)}</b>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">شماره سفارش</p>
                    <b className="mt-2 block break-all text-sm">{order.order_number || order.id}</b>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-amber-700">اقلام در حال پرداخت</p>
                      <h3 className="mt-1 font-black">شرح مختصر سفارش</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
                      {itemCount.toLocaleString('fa-IR')} عدد
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.slice(0, 4).map((item) => (
                      <div key={`summary-${item.id}`} className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-white p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          {item.product_image_url ? (
                            <img src={item.product_image_url} alt="" className="h-full w-full object-contain p-1" />
                          ) : <Package className="h-5 w-5 text-slate-400" />}
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-bold">{item.product_name}</p>
                        <span className="text-xs text-slate-500">× {Number(item.quantity || 0).toLocaleString('fa-IR')}</span>
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white p-3 text-sm font-bold text-amber-700">
                        + {(items.length - 4).toLocaleString('fa-IR')} قلم دیگر
                      </div>
                    )}
                    {!items.length && (
                      <p className="text-sm leading-7 text-slate-500">جزئیات کالاها قابل دریافت نبود؛ تعداد سفارش از اطلاعات اصلی سفارش نمایش داده شده است.</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
                    <div className="flex items-start gap-2"><XCircle className="mt-1 h-5 w-5 shrink-0" /><span>{error}</span></div>
                    {error.toLowerCase().includes('permission denied') && (
                      <p className="mt-2 border-t border-red-100 pt-2 text-xs leading-6">
                        این خطا طبیعی نیست و از دسترسی دیتابیس است. فایل SQL همراه همین پچ باید یک‌بار در Supabase اجرا شود.
                      </p>
                    )}
                  </div>
                )}

                {setupMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                    {setupMessage}
                    <Link to="/admin/payment-settings" className="mt-3 inline-flex rounded-xl bg-amber-400 px-4 py-2 font-black text-black">
                      رفتن به تنظیمات پرداخت
                    </Link>
                  </div>
                )}

                {isPaid ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                    <h2 className="text-xl font-black text-emerald-800">پرداخت با موفقیت ثبت شد</h2>
                    {payment?.reference_id && <p className="mt-2 text-sm text-emerald-700">شماره پیگیری: <b>{payment.reference_id}</b></p>}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button onClick={() => navigate(`/invoice/${order.id}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950">
                        <ReceiptText className="h-5 w-5" /> مشاهده فاکتور
                      </button>
                      <Link to="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-800">
                        رفتن به پروفایل
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {useZarinpal && (
                      <button type="button" disabled={isPaying || !hasValidItems} onClick={payZarinpal} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
                        {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ExternalLink className="h-5 w-5" />}
                        {isPaying ? 'در حال اتصال به زرین‌پال...' : 'پرداخت با زرین‌پال'}
                      </button>
                    )}
                    {settings?.testGatewayEnabled !== false && (
                      <button type="button" disabled={isPaying || !hasValidItems} onClick={payTest} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                        {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                        {isPaying ? 'در حال ثبت پرداخت...' : 'پرداخت آزمایشی و ثبت رسید'}
                      </button>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="leading-7">پرداخت فقط برای همین سفارش ثبت می‌شود. در صورت قطع اتصال، دوباره همین صفحه را باز کنید؛ پرداخت موفق تکراری ایجاد نمی‌شود.</p>
                  </div>
                </div>

                {!isPaid && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50">
                      <RotateCcw className="h-4 w-4" /> تلاش مجدد
                    </button>
                    <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50">
                      <Home className="h-4 w-4" /> بازگشت به سبد خرید
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <p className="text-red-700">{error || 'سفارش پیدا نشد.'}</p>
            <Link to="/cart" className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white">بازگشت به سبد خرید</Link>
          </div>
        )}
      </section>
    </main>
  );
}
