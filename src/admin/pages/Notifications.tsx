import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { CarrtellNotification, createNotification, deleteNotification, getAdminNotifications, NotificationRole, NotificationType } from '../../services/notificationsApi';

const roles: Array<{ value: NotificationRole; label: string }> = [
  { value: 'admin', label: 'مدیر' },
  { value: 'customer', label: 'مشتری' },
  { value: 'driver', label: 'سرویس‌کار' },
];

const types: Array<{ value: NotificationType; label: string }> = [
  { value: 'info', label: 'اطلاع‌رسانی' },
  { value: 'success', label: 'موفق' },
  { value: 'warning', label: 'هشدار' },
  { value: 'order', label: 'سفارش' },
  { value: 'service', label: 'سرویس' },
  { value: 'payment', label: 'پرداخت' },
  { value: 'support', label: 'پشتیبانی' },
  { value: 'loyalty', label: 'باشگاه مشتریان' },
];

export default function NotificationsAdminPage() {
  const [items, setItems] = useState<CarrtellNotification[]>([]);
  const [form, setForm] = useState({ role: 'admin' as NotificationRole, type: 'info' as NotificationType, title: '', body: '', link: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    setItems(await getAdminNotifications());
  }

  useEffect(() => { load().catch(() => undefined); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await createNotification({ role: form.role, type: form.type, title: form.title, body: form.body, link: form.link });
      setForm({ role: 'admin', type: 'info', title: '', body: '', link: '' });
      await load();
    } finally { setLoading(false); }
  }

  async function remove(id: string) {
    await deleteNotification(id);
    await load();
  }

  return (
    <div className="space-y-6 p-4 text-white" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-l from-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-300"><Bell size={20} /> مرکز اعلان‌ها</div>
        <h1 className="mt-2 text-2xl font-black">مدیریت اعلان‌های کارتل</h1>
        <p className="mt-2 text-sm text-slate-300">اعلان دستی برای مدیر، مشتری یا سرویس‌کار بساز و لاگ اعلان‌ها را ببین.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950 p-5 md:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان اعلان" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400" />
        <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="لینک اختیاری مثل /admin/orders" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as NotificationRole })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400">
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400">
          {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="متن اعلان" rows={3} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400 md:col-span-2" />
        <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 md:col-span-2">
          <Plus size={18} /> ثبت اعلان
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 border-b border-white/10 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div>
              <strong>{item.title}</strong>
              <p className="mt-1 text-sm text-slate-400">{item.body}</p>
              <p className="mt-2 text-xs text-slate-500">{item.role ?? 'کاربر خاص'} · {item.type} · {new Date(item.created_at).toLocaleString('fa-IR')}</p>
            </div>
            <button onClick={() => remove(item.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"><Trash2 size={16} /> حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
