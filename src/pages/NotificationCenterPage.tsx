import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { CarrtellNotification, getMyNotifications, markAllNotificationsRead } from '../services/notificationsApi';

export default function NotificationCenterPage() {
  const [items, setItems] = useState<CarrtellNotification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await getMyNotifications());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function readAll() {
    await markAllNotificationsRead(items.filter((item) => !item.is_read).map((item) => item.id));
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-24 text-white" dir="rtl">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-l from-slate-900 to-slate-950 p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-300"><Bell size={20} /> مرکز اعلان‌ها</div>
            <h1 className="text-2xl font-black">اعلان‌های کارتل</h1>
            <p className="mt-2 text-sm text-slate-300">وضعیت سفارش، سرویس، پرداخت، پشتیبانی و امتیازها را اینجا دنبال کن.</p>
          </div>
          <button onClick={readAll} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300">
            <CheckCheck size={18} /> خواندن همه
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">در حال دریافت اعلان‌ها...</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">فعلاً اعلانی نداری.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className={`rounded-3xl border p-5 ${item.is_read ? 'border-white/10 bg-white/[0.03]' : 'border-amber-400/40 bg-amber-400/10'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <strong className="text-lg text-white">{item.title}</strong>
                    {item.body && <p className="mt-2 text-sm leading-7 text-slate-300">{item.body}</p>}
                    <p className="mt-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString('fa-IR')}</p>
                  </div>
                  {item.link && <Link to={item.link} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-amber-300 hover:bg-white/5">مشاهده</Link>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
