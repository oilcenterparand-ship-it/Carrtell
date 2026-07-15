# Carrtell Diagnostics Patch

این پچ صفحه تست سلامت پروژه را اضافه می‌کند.

## روش اعمال

بعد از کپی فایل‌ها داخل ریشه پروژه، این دستور را یک بار اجرا کن:

```bash
node scripts/apply-diagnostics-patch.mjs
```

بعد Vite را رفرش کن یا دوباره اجرا کن:

```bash
npm run dev
```

مسیر صفحه:

```txt
/admin/diagnostics
```

## SQL

این پچ SQL اجباری ندارد. اگر صفحه Diagnostics جدولی را ناقص نشان داد، SQL پیشنهادی همان بخش را از داخل صفحه کپی و در Supabase اجرا کن.
