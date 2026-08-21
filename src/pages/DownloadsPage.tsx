import { ShoppingBag, Smartphone } from 'lucide-react';
import PwaInstallButton from '../components/PwaInstallButton';

export default function DownloadsPage() {
  return <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-10 text-white">
    <section className="mx-auto max-w-3xl">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-400 text-slate-950"><Smartphone className="h-8 w-8" /></div>
        <h1 className="mt-5 text-3xl font-black">دانلود و نصب Carrtell</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">نسخه مشتری Carrtell به‌صورت Web App نصب می‌شود و فروشگاه، رزرو سرویس، پروفایل، پیگیری سفارش و فاکتور را در یک برنامه در اختیار شما می‌گذارد.</p>
      </div>

      <article className="mx-auto mt-8 max-w-xl rounded-[2rem] border border-white/10 bg-slate-900 p-6">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><ShoppingBag className="h-7 w-7" /></div>
        <h2 className="mt-4 text-xl font-black">اپ فروشگاه Carrtell</h2>
        <p className="mt-2 text-sm leading-7 text-slate-400">فروشگاه، رزرو سرویس، پروفایل، پیگیری سفارش و دریافت فاکتور در یک وب‌اپ.</p>
        <div className="mt-5"><PwaInstallButton label="نصب اپ فروشگاه" manifestHref="/manifest.webmanifest" className="bg-amber-400 text-slate-950" /></div>
      </article>

    </section>
  </main>;
}
