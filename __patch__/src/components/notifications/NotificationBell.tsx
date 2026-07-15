import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CarrtellNotification, getMyNotifications, markNotificationRead } from '../../services/notificationsApi';

export default function NotificationBell({ role }: { role?: 'admin' | 'driver' | 'customer' | null }) {
  const [items, setItems] = useState<CarrtellNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getMyNotifications(role).then(setItems).catch(() => setItems([]));
  }, [role]);

  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  async function handleOpenItem(item: CarrtellNotification) {
    if (!item.is_read) {
      await markNotificationRead(item.id).catch(() => undefined);
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-lg hover:border-amber-400/50"
        aria-label="اعلان‌ها"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-black text-slate-950">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <strong className="text-sm text-white">اعلان‌ها</strong>
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-amber-300 hover:text-amber-200">
              مشاهده همه
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">اعلانی وجود ندارد.</p>
            ) : (
              items.slice(0, 7).map((item) => {
                const content = (
                  <div className={`rounded-2xl p-3 text-right transition hover:bg-white/5 ${item.is_read ? 'opacity-70' : 'bg-amber-400/10'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-white">{item.title}</strong>
                      {!item.is_read && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                    </div>
                    {item.body && <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-300">{item.body}</p>}
                  </div>
                );
                return item.link ? (
                  <Link key={item.id} to={item.link} onClick={() => handleOpenItem(item)}>
                    {content}
                  </Link>
                ) : (
                  <button key={item.id} type="button" className="block w-full" onClick={() => handleOpenItem(item)}>
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
