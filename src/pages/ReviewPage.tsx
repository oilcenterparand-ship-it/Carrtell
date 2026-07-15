import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { createCustomerReview } from '../admin/services/customerReviewsApi';
import { getOrder, getOrderItems, type OrderItem } from '../admin/services/ordersApi';

export default function ReviewPage() {
  const { orderId } = useParams();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', rating: 5, comment: '' });
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([getOrder(orderId), getOrderItems(orderId)])
      .then(([order, items]) => {
        setOrderNumber(order.order_number || '');
        setOrderItems(items);
        if (items.length === 1) setSelectedProductId(items[0].product_id);
        setForm((current) => ({
          ...current,
          customer_name: current.customer_name || order.customer_name || '',
          customer_phone: current.customer_phone || order.customer_phone || '',
        }));
      })
      .catch(() => undefined);
  }, [orderId]);

  async function submit() {
    if (!form.comment.trim()) return alert('لطفاً نظر خود را بنویسید.');
    setSubmitting(true);
    try {
      if (orderItems.length > 0 && !selectedProductId) return alert('لطفاً محصول موردنظر را انتخاب کنید.');
      await createCustomerReview({ order_id: orderId || null, product_id: selectedProductId || null, ...form });
      setDone(true);
    } catch (error: any) {
      alert(error?.message || 'ثبت نظر انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--site-bg,#0b1220)] px-4 pb-10 pt-32 text-[var(--text-primary,#fff)]">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[var(--card-bg,#111827)] p-6 shadow-2xl shadow-black/20">
        {done ? (
          <div className="py-10 text-center"><Star className="mx-auto mb-4 h-12 w-12 fill-[var(--primary,#f5c518)] text-[var(--primary,#f5c518)]" /><h1 className="text-2xl font-black">نظر شما ثبت شد</h1><p className="mt-3 text-[var(--text-muted,#94a3b8)]">بعد از تایید مدیر در سایت نمایش داده می‌شود.</p></div>
        ) : (
          <div className="space-y-4">
            <header className="rounded-2xl bg-white/5 p-4"><div className="mb-2 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[var(--primary,#f5c518)]" /><h1 className="text-2xl font-black">ثبت نظر مشتری</h1></div><p className="text-sm text-[var(--text-muted,#94a3b8)]">نظرها فقط بعد از تایید مدیر در سایت نمایش داده می‌شوند.</p>{orderNumber && <p className="mt-2 text-xs text-[var(--primary,#f5c518)]">شماره سفارش: {orderNumber}</p>}</header>
            <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="نام شما" className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[var(--text-primary,#fff)] placeholder:text-[var(--text-muted,#94a3b8)] outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20" />
            <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="شماره موبایل" className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[var(--text-primary,#fff)] placeholder:text-[var(--text-muted,#94a3b8)] outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20" />
            {orderItems.length > 0 && <label className="block text-sm font-bold text-[var(--text-muted,#94a3b8)]">محصول
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[var(--text-primary,#fff)] outline-none transition focus:border-[var(--primary,#f5c518)]">
                <option value="" className="bg-slate-900 text-white">انتخاب محصول</option>
                {orderItems.map((item) => <option key={item.id} value={item.product_id} className="bg-slate-900 text-white">{item.product_name}</option>)}
              </select>
            </label>}
            <label className="block text-sm font-bold text-[var(--text-muted,#94a3b8)]">امتیاز
              <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[var(--text-primary,#fff)] placeholder:text-[var(--text-muted,#94a3b8)] outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20">
                {[5,4,3,2,1].map((rating) => <option key={rating} value={rating} className="bg-slate-900 text-white">{rating} ستاره</option>)}
              </select>
            </label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="نظر شما درباره خرید یا سرویس" rows={5} className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[var(--text-primary,#fff)] placeholder:text-[var(--text-muted,#94a3b8)] outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20" />
            <button disabled={submitting} onClick={submit} className="w-full rounded-2xl bg-[var(--primary,#f5c518)] py-4 font-black text-black disabled:opacity-50">{submitting ? 'در حال ثبت...' : 'ثبت نظر'}</button>
          </div>
        )}
      </section>
    </main>
  );
}
