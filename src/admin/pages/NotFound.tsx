function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10 text-center text-slate-300">
      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl sm:p-12">
        <h1 className="text-3xl font-bold text-white">صفحه‌ای یافت نشد</h1>
        <p className="text-sm text-slate-400">
          مسیر موردنظر در پنل مدیریت وجود ندارد. لطفاً از نوار کناری یکی از بخش‌ها را انتخاب کنید.
        </p>
      </div>
    </section>
  );
}

export default NotFound;
