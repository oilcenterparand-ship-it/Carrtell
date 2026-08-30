import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Home, Loader2, MapPin, PackageCheck, ReceiptText, Truck } from 'lucide-react';
import { getOrderWithItems, type Order, type OrderItem } from '../admin/services/ordersApi';
import { formatPrice } from '../admin/services/ordersUtils';
import { downloadInvoicePdf } from '../utils/invoicePdf';

function deliveryLabel(order: Order) {
  const value = String((order as any).delivery_type || '').toLowerCase();
  if (value === 'pickup') return 'تحویل حضوری';
  if (value === 'express') return 'ارسال سریع';
  if (value === 'service') return 'سرویس در محل';
  return 'ارسال عادی';
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('شناسه سفارش موجود نیست.');
      setLoading(false);
      return;
    }

    getOrderWithItems(orderId)
      .then(({ order, items }) => {
        setOrder(order);
        setItems(items);
      })
      .catch((err: any) => setError(err?.message || 'اطلاعات سفارش دریافت نشد.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--site-bg,#0b1220)] px-4 pb-16 pt-32 text-[var(--text-primary,#fff)]">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-[var(--card-bg,#111827)] shadow-2xl shadow-black/20">
        <header className="border-b border-white/10 bg-gradient-to-l from-emerald-500/20 via-emerald-500/10 to-transparent p-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-300" />
          <h1 className="text-2xl font-black sm:text-3xl">سفارش با موفقیت ثبت شد</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted,#94a3b8)]">پرداخت تایید شد و سفارش برای بررسی و آماده‌سازی ارسال شده است.</p>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-[var(--text-muted,#94a3b8)]">
              <Loader2 className="h-5 w-5 animate-spin" /> در حال دریافت رسید سفارش...
            </div>
          ) : error || !order ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm leading-7 text-red-200">{error || 'سفارش پیدا نشد.'}</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="text-xs text-[var(--text-muted,#94a3b8)]">شماره سفارش</span>
                  <b className="mt-2 block text-lg">{order.order_number || order.id}</b>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="text-xs text-[var(--text-muted,#94a3b8)]">مبلغ پرداخت‌شده</span>
                  <b className="mt-2 block text-lg text-emerald-300">{formatPrice(Number(order.total_amount || 0)+Number(order.wallet_used || 0))} تومان</b>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><Truck className="h-4 w-4" /> روش دریافت</span>
                  <b className="mt-2 block">{deliveryLabel(order)}</b>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><PackageCheck className="h-4 w-4" /> وضعیت سفارش</span>
                  <b className="mt-2 block text-amber-200">در انتظار بررسی</b>
                </div>
              </div>

              {order.customer_address && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7">
                  <span className="mb-2 flex items-center gap-2 text-xs text-[var(--text-muted,#94a3b8)]"><MapPin className="h-4 w-4" /> آدرس دریافت</span>
                  {order.customer_address}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-slate-950 hover:bg-emerald-300">
                  <PackageCheck className="h-4 w-4" /> پیگیری سفارش
                </Link>
                <button type="button" onClick={() => downloadInvoicePdf(order, items)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold hover:bg-white/10">
                  <Download className="h-4 w-4" /> دانلود فاکتور
                </button>
                <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold hover:bg-white/10">
                  <Home className="h-4 w-4" /> بازگشت به فروشگاه
                </Link>
              </div>

              <Link to={`/invoice/${order.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-5 py-3 text-sm font-bold text-[var(--text-muted,#94a3b8)] hover:bg-white/5 hover:text-white">
                <ReceiptText className="h-4 w-4" /> مشاهده نسخه کامل فاکتور
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
