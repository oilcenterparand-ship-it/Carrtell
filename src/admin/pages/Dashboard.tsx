import Card from '../components/Card';

function Dashboard() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">وضعیت کلی</p>
            <h1 className="mt-2 text-3xl font-bold text-white">داشبورد مدیریت</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              یک نمای کلی از عملیات پنل مدیریت و نکات کلیدی مربوط به سیستم.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="سفارشات امروز" value="۱۲۳" accent="sky" />
        <Card title="کاربران فعال" value="۴۵۶" accent="emerald" />
        <Card title="بازدید ماهانه" value="۸۹۷۶" accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">فعالیت‌های اخیر</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-300">
            {[
              'ثبت سفارش جدید توسط مشتری',
              'آپدیت محصول جدید در فروشگاه',
              'بررسی گزارش عملکرد ماهانه',
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">اطلاعات سامانه</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <span>اتصال Supabase</span>
              <span className="text-sky-300">آماده</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <span>نسخه API</span>
              <span className="text-emerald-300">۲.۰</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
