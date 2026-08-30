# هات‌فیکس Carrtell V3.4.3

## اصلاحات

- عنوان دسته مادر در موبایل `9.5px` است.
- عنوان زیرشاخه در موبایل `8.5px` است.
- دسته مادر همچنان کوچک، اما واضح‌تر از زیرشاخه است.
- تست اندازه فونت ضعیف یا حذف نشده و سقف اندازه‌ها را نیز کنترل می‌کند.
- پیام ابتدای Agent به ASCII تغییر کرده تا در Windows PowerShell خراب نمایش داده نشود.
- SQL امن و مستقل برای چهار بنر صفحه خانه اضافه شده است.

## علت خطای دیتابیس

خطای زیر مربوط به تکراری‌بودن شماره نسخه Migrationهای قدیمی پروژه است:

```text
duplicate key value violates unique constraint schema_migrations_pkey
Key (version)=(20260712) already exists
```

در این مرحله `npx supabase db push` را دوباره اجرا نکن و تاریخچه Migration را Repair نکن.

## اجرای امن SQL موردنیاز

بعد از Extract فایل، این فایل را باز کن:

```powershell
notepad ".\supabase\manual\CARRTELL_HOME_PROMO_TILES_SAFE.sql"
```

تمام متن را Copy کن و در مسیر زیر اجرا کن:

```text
Supabase Dashboard ← SQL Editor ← New query ← Paste ← Run
```

SQL کاملاً idempotent است؛ اگر جدول یا داده‌ها قبلاً ساخته شده باشند دوباره‌کاری مخرب انجام نمی‌دهد.

## تست

```powershell
cd "D:\carrtell\Carrtell-v0.2-current\project"

npm run typecheck
npm run build
.\agent-category.ps1
```

