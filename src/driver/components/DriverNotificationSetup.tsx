import { useState } from 'react';
import { BellRing } from 'lucide-react';

declare global {
  interface Window {
    CarrtellAndroid?: {
      notify: (title: string, body: string, url?: string) => void;
      isNative?: () => boolean;
    };
  }
}

export async function showDriverNotification(title: string, body: string, url = '/driver/dashboard') {
  if (window.CarrtellAndroid?.notify) {
    window.CarrtellAndroid.notify(title, body, url);
    return true;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker?.ready.catch(() => null);
  if (registration) {
    await registration.showNotification(title, { body, icon: '/brand/driver-192.png', badge: '/brand/driver-192.png', data: { url }, tag: `carrtell-driver-${url}` });
    return true;
  }
  new Notification(title, { body, icon: '/brand/driver-192.png' });
  return true;
}

export default function DriverNotificationSetup() {
  const nativeAndroid = Boolean(window.CarrtellAndroid?.notify);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => nativeAndroid ? 'granted' : ('Notification' in window ? Notification.permission : 'unsupported'));
  const [message, setMessage] = useState('');

  async function enable() {
    if (nativeAndroid) {
      window.CarrtellAndroid?.notify('اعلان Carrtell فعال شد', 'اعلان مأموریت در اپ اندروید فعال است.', '/driver/dashboard');
      setMessage('اعلان داخل اپ اندروید فعال است. برای مأموریت جدید، پیامک پشتیبان هم مستقل از اپ باقی می‌ماند.');
      return;
    }
    if (!('Notification' in window)) {
      setMessage('اعلان مرورگر روی این دستگاه پشتیبانی نمی‌شود؛ پیامک مأموریت همچنان استفاده می‌شود.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await showDriverNotification('اعلان Carrtell فعال شد', 'از این پس مأموریت‌های جدید در پنل به شما اعلام می‌شود.');
      setMessage('اعلان فعال شد.');
    } else {
      setMessage('اجازه اعلان داده نشد؛ می‌توانی بعداً از تنظیمات مرورگر فعالش کنی.');
    }
  }

  return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
    <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><BellRing className="h-5 w-5" /></div><div><h3 className="font-black">اعلان مأموریت</h3><p className="mt-1 text-xs leading-6 text-slate-500">{nativeAndroid ? 'اعلان داخل اپ اندروید فعال است؛ پیامک مأموریت هم به‌عنوان مسیر پشتیبان استفاده می‌شود.' : 'برای مأموریت جدید اعلان مرورگر فعال می‌شود. پیامک تخصیص هم مستقل از اعلان ثبت می‌شود.'}</p></div></div>
    <button type="button" onClick={() => void enable()} disabled={!nativeAndroid && (permission === 'granted' || permission === 'unsupported')} className="mt-4 w-full rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200 disabled:opacity-50">{nativeAndroid ? 'تست اعلان اپ' : permission === 'granted' ? 'اعلان فعال است' : 'فعال کردن اعلان'}</button>
    {message && <p className="mt-2 text-center text-xs leading-6 text-slate-500">{message}</p>}
  </div>;
}
