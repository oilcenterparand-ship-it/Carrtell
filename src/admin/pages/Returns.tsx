import { useEffect, useState } from 'react';
import { getAllReturnRequests, updateReturnRequestStatus, ReturnRequest, ReturnStatus } from '../../services/authenticityReturnsApi';

const statuses: { value: ReturnStatus; label: string }[] = [
  { value: 'pending', label: 'در انتظار بررسی' },
  { value: 'reviewing', label: 'در حال بررسی' },
  { value: 'approved', label: 'تایید شده' },
  { value: 'rejected', label: 'رد شده' },
  { value: 'refunded', label: 'مرجوع/بازگشت وجه' },
  { value: 'replaced', label: 'تعویض شده' },
  { value: 'closed', label: 'بسته شده' },
];

export default function AdminReturns() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try { setItems(await getAllReturnRequests()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(id: string, status: ReturnStatus) {
    await updateReturnRequestStatus(id, status, note[id]);
    await load();
  }

  return (
    <main className="space-y-6 p-4 text-white" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-amber-300">پنل مدیریت</p>
        <h1 className="mt-2 text-2xl font-black">مرجوعی و بررسی کالا</h1>
        <p className="mt-2 text-sm text-slate-300">مدیریت درخواست‌های مغایرت، مرجوعی و بررسی اصالت. بخش وارانتی عمداً اضافه نشده.</p>
      </section>
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        {loading ? <p>در حال دریافت...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="text-slate-400"><tr><th className="p-3">محصول</th><th className="p-3">مشتری</th><th className="p-3">موضوع</th><th className="p-3">وضعیت</th><th className="p-3">یادداشت مدیر</th><th className="p-3">عملیات</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.product_name || '-'}</td>
                    <td className="p-3">{item.customer_name || '-'}<br/><span className="text-slate-400">{item.customer_phone}</span></td>
                    <td className="p-3">{item.reason}</td>
                    <td className="p-3"><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{item.status}</span></td>
                    <td className="p-3"><input value={note[item.id] ?? item.admin_note ?? ''} onChange={e => setNote({ ...note, [item.id]: e.target.value })} className="w-56 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></td>
                    <td className="p-3"><select onChange={e => changeStatus(item.id, e.target.value as ReturnStatus)} defaultValue="" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="" disabled>تغییر وضعیت</option>{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
