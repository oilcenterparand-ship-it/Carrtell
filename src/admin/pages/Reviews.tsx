import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw, Star, Trash2, XCircle } from 'lucide-react';
import { deleteCustomerReview, getCustomerReviews, updateCustomerReviewApproval, type CustomerReview } from '../services/customerReviewsApi';

export default function Reviews() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setLoading(true); setReviews(await getCustomerReviews()); }
    catch (error) { console.error(error); alert('خطا در دریافت نظرات'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setApproval(review: CustomerReview, approved: boolean) {
    const updated = await updateCustomerReviewApproval(review.id, approved);
    setReviews((current) => current.map((item) => item.id === review.id ? updated : item));
  }
  async function remove(id: string) {
    if (!confirm('نظر حذف شود؟')) return;
    await deleteCustomerReview(id);
    setReviews((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black text-white">نظرات مشتریان</h1><p className="mt-1 text-sm text-slate-400">نظرات ثبت‌شده از لینک پیامکی بعد از تحویل سفارش</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> بروزرسانی</button>
      </div>
      <div className="rounded-3xl bg-slate-900 p-4">
        {loading ? <div className="py-10 text-center text-slate-400">در حال دریافت...</div> : !reviews.length ? <div className="py-10 text-center text-slate-400">نظری ثبت نشده.</div> : <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-3xl bg-slate-950 p-4 ring-1 ring-slate-800">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2"><b className="text-white">{review.customer_name || 'مشتری Carrtell'}</b><span className={review.is_approved ? 'rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300' : 'rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300'}>{review.is_approved ? 'تأیید شده' : 'در انتظار تأیید'}</span></div>
                  <div className="mt-2 flex gap-1 text-amber-300">{Array.from({ length: review.rating || 0 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{review.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">موبایل: {review.customer_phone || '-'} | سفارش: {review.order_id || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setApproval(review, true)} className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300"><CheckCircle /></button>
                  <button onClick={() => setApproval(review, false)} className="rounded-2xl bg-amber-500/15 p-3 text-amber-300"><XCircle /></button>
                  <button onClick={() => remove(review.id)} className="rounded-2xl bg-red-500/15 p-3 text-red-300"><Trash2 /></button>
                </div>
              </div>
            </article>
          ))}
        </div>}
      </div>
    </div>
  );
}
