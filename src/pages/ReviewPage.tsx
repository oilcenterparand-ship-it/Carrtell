import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, MessageSquare, PackageCheck, Star } from 'lucide-react';
import { createCustomerReview } from '../admin/services/customerReviewsApi';
import { getOrderPaymentSnapshot, type OrderItem } from '../admin/services/ordersApi';
import { getProducts } from '../admin/services/productsApi';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReviewableItem = OrderItem & { resolved_product_id: string | null };
type ReviewDraft = { rating: number; comment: string; submitting: boolean; submitted: boolean; error: string };

function normalizeName(value?: string | null) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fa');
}

export default function ReviewPage() {
  const { orderId } = useParams();
  const [customer, setCustomer] = useState({ customer_name: '', customer_phone: '' });
  const [orderNumber, setOrderNumber] = useState('');
  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    Promise.all([getOrderPaymentSnapshot(orderId), getProducts()])
      .then(([snapshot, products]) => {
        const productByName = new Map(products.filter((product) => product.id).map((product) => [normalizeName(product.name), product.id as string]));
        const unique = new Map<string, ReviewableItem>();
        for (const item of snapshot.items) {
          const validId = UUID_PATTERN.test(String(item.product_id || '')) ? String(item.product_id) : null;
          const resolvedId = validId || productByName.get(normalizeName(item.product_name)) || null;
          const key = resolvedId || `${normalizeName(item.product_name)}-${item.id}`;
          if (!unique.has(key)) unique.set(key, { ...item, resolved_product_id: resolvedId });
        }
        const reviewItems = Array.from(unique.values());
        setOrderNumber(snapshot.order.order_number || '');
        setCustomer({ customer_name: snapshot.order.customer_name || '', customer_phone: snapshot.order.customer_phone || '' });
        setItems(reviewItems.length ? reviewItems : [{ id: 'order', order_id: orderId, product_id: '', product_name: 'تجربه کلی سفارش یا سرویس', quantity: 1, unit_price: 0, total_price: 0, resolved_product_id: null }]);
        setDrafts(Object.fromEntries((reviewItems.length ? reviewItems : [{ id: 'order' }]).map((item) => [item.id, { rating: 5, comment: '', submitting: false, submitted: false, error: '' }])));
      })
      .catch((error: any) => setLoadError(error?.message || 'اطلاعات سفارش دریافت نشد.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const submittedCount = useMemo(() => Object.values(drafts).filter((draft) => draft.submitted).length, [drafts]);

  function updateDraft(id: string, patch: Partial<ReviewDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function submitItem(item: ReviewableItem) {
    const draft = drafts[item.id];
    if (!draft?.comment.trim()) return updateDraft(item.id, { error: 'لطفاً نظر این محصول را بنویسید.' });
    updateDraft(item.id, { submitting: true, error: '' });
    try {
      await createCustomerReview({
        order_id: orderId || null,
        product_id: item.resolved_product_id,
        product_name: item.product_name,
        customer_name: customer.customer_name,
        customer_phone: customer.customer_phone,
        rating: draft.rating,
        comment: draft.comment.trim(),
      });
      updateDraft(item.id, { submitting: false, submitted: true });
    } catch (error: any) {
      updateDraft(item.id, { submitting: false, error: error?.message || 'ثبت نظر انجام نشد.' });
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--site-bg,#0b1220)] px-3 pb-24 pt-32 text-[var(--text-primary,#fff)] sm:px-4">
      <section className="mx-auto max-w-2xl">
        <header className="mb-4 rounded-3xl border border-white/10 bg-[var(--card-bg,#111827)] p-5 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[var(--primary,#f5c518)]" /><h1 className="text-xl font-black">نظر درباره محصولات سفارش</h1></div>
          <p className="mt-2 text-xs leading-6 text-[var(--text-muted,#94a3b8)]">برای هر محصول جداگانه امتیاز و نظر ثبت کنید. هر نظر پس از تأیید مدیر نمایش داده می‌شود.</p>
          {orderNumber && <p className="mt-2 text-xs font-bold text-[var(--primary,#f5c518)]">شماره سفارش: {orderNumber}</p>}
        </header>

        {loading && <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">در حال دریافت اقلام سفارش...</div>}
        {loadError && <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{loadError}</div>}

        {!loading && !loadError && <div className="space-y-3">
          {items.map((item) => {
            const draft = drafts[item.id] || { rating: 5, comment: '', submitting: false, submitted: false, error: '' };
            return <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--card-bg,#111827)]">
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5">{item.product_image_url ? <img src={item.product_image_url} alt={item.product_name} className="h-full w-full object-contain p-1" /> : <PackageCheck className="text-emerald-300" />}</div>
                <div className="min-w-0"><b className="line-clamp-2 text-sm leading-6">{item.product_name}</b>{item.quantity > 1 && <span className="mt-1 block text-[11px] text-slate-400">تعداد خرید: {item.quantity.toLocaleString('fa-IR')}</span>}</div>
              </div>
              {draft.submitted ? <div className="flex items-center gap-2 p-5 text-sm font-black text-emerald-300"><CheckCircle2 /> نظر این محصول ثبت شد.</div> : <div className="space-y-4 p-4">
                <div><span className="mb-2 block text-xs font-bold text-slate-400">امتیاز این محصول</span><div className="flex gap-1" dir="ltr">{[1,2,3,4,5].map((rating) => <button type="button" key={rating} onClick={() => updateDraft(item.id, { rating })} aria-label={`${rating} ستاره`} className="p-1"><Star className={`h-7 w-7 ${rating <= draft.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} /></button>)}</div></div>
                <textarea value={draft.comment} onChange={(event) => updateDraft(item.id, { comment: event.target.value, error: '' })} placeholder={`نظر شما درباره ${item.product_name}`} rows={3} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400" />
                {draft.error && <p className="text-xs font-bold text-red-300">{draft.error}</p>}
                <button type="button" disabled={draft.submitting} onClick={() => void submitItem(item)} className="w-full rounded-2xl bg-[var(--primary,#f5c518)] py-3 text-sm font-black text-black disabled:opacity-50">{draft.submitting ? 'در حال ثبت...' : 'ثبت نظر این محصول'}</button>
              </div>}
            </article>;
          })}
          {submittedCount === items.length && <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-center font-black text-emerald-200">همه نظرهای این سفارش ثبت شدند. ممنون از شما.</div>}
        </div>}
      </section>
    </main>
  );
}
