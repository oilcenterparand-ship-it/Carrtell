import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText, MessageSquare } from 'lucide-react';
import { getOrderWithItems, type Order, type OrderItem } from '../admin/services/ordersApi';
import { formatPrice } from '../admin/services/ordersUtils';
import { downloadInvoicePdf } from '../utils/invoicePdf';

export default function InvoicePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrderWithItems(orderId)
      .then(({ order, items }) => { setOrder(order); setItems(items); })
      .catch((error) => console.error('Invoice load error:', error))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--site-bg,#0b1220)] px-4 pb-16 pt-32 text-[var(--text-primary,#fff)]">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[var(--card-bg,#111827)] p-6 shadow-2xl shadow-black/20">
        {loading ? <p className="text-center font-bold">در حال دریافت فاکتور...</p> : !order ? (
          <div className="text-center"><FileText className="mx-auto mb-3 text-slate-300" /><h1 className="text-xl font-black">فاکتور پیدا نشد</h1></div>
        ) : (
          <div className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl font-black">فاکتور سفارش</h1>
                <p className="text-sm text-[var(--text-muted,#94a3b8)]">شماره سفارش: {order.order_number}</p>
              </div>
              <button onClick={() => downloadInvoicePdf(order, items)} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black"><Download className="h-4 w-4" /> دانلود PDF</button>
            </header>
            <div className="grid gap-3 rounded-2xl bg-white/5 p-4 text-sm sm:grid-cols-2">
              <p><b>نام مشتری:</b> {order.customer_name || '-'}</p>
              <p><b>موبایل:</b> {order.customer_phone || '-'}</p>
              <p><b>خودرو:</b> {order.customer_car || '-'}</p>
              <p><b>وضعیت:</b> {order.status || '-'}</p>
              <p className="sm:col-span-2"><b>آدرس:</b> {order.customer_address || '-'}</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 p-4 last:border-b-0">
                  <div><b>{item.product_name}</b><p className="mt-1 text-sm text-[var(--text-muted,#94a3b8)]">تعداد: {item.quantity.toLocaleString('fa-IR')}</p></div>
                  <b>{formatPrice(item.total_price)} تومان</b>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-[var(--text-primary,#fff)]"><span>مبلغ کل</span><b>{formatPrice(Number(order.total_amount)+Number(order.wallet_used||0))} تومان</b></div>
            {Number(order.wallet_used||0)>0?<div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 p-4 text-emerald-200"><span>پرداخت از کیف پول</span><b>{formatPrice(Number(order.wallet_used))} تومان</b></div>:null}
            <div className="flex flex-wrap gap-3"><Link to="/dashboard" className="inline-flex rounded-2xl bg-white/10 px-5 py-3 font-bold">رفتن به پروفایل</Link><Link to={`/review/${order.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black"><MessageSquare className="h-4 w-4" /> ثبت نظر</Link></div>
          </div>
        )}
      </section>
    </main>
  );
}
