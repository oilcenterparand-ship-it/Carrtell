# Carrtell RC1-03 — Admin Login & RBAC

این پچ ورود پنل مدیریت را از OTP جدا می‌کند و ورود با نام کاربری و رمز عبور، حساب‌های مدیریتی، نقش‌ها و مجوزهای داینامیک را اضافه می‌کند.

## ترتیب نصب

1. ابتدا RC1-02 را نصب کرده باش.
2. محتوای ZIP این پچ را در ریشه پروژه Replace کن.
3. در Supabase SQL Editor فایل زیر را اجرا کن:

`supabase/migrations/202607230004_rc1_03_admin_rbac.sql`

4. Edge Functionها را Deploy کن:

```powershell
supabase functions deploy admin-bootstrap
supabase functions deploy admin-user-management
```

5. یک Secret موقت و قوی برای ساخت اولین Super Admin ثبت کن:

```powershell
supabase secrets set ADMIN_BOOTSTRAP_SECRET="یک-عبارت-خیلی-طولانی-و-تصادفی"
```

6. اولین Super Admin را فقط یک بار بساز. در PowerShell:

```powershell
$projectRef = "PROJECT_REF"
$secret = "همان-عبارت-تصادفی"
$body = @{ username="amin"; password="رمز-قوی-حداقل-10-کاراکتر"; fullName="امین اورعی" } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "https://$projectRef.supabase.co/functions/v1/admin-bootstrap" `
  -Headers @{ "x-bootstrap-secret"=$secret; "Content-Type"="application/json" } `
  -Body $body
```

7. بعد از ساخت حساب، Secret را حذف یا عوض کن و بهتر است Function بوت‌استرپ را حذف کنی:

```powershell
supabase functions delete admin-bootstrap
```

8. پروژه را اجرا کن:

```powershell
npm install
npm run typecheck
npm run dev
```

## ورود

آدرس ورود مدیر:

`/admin/login`

نام کاربری همان مقداری است که در Bootstrap یا بخش «کاربران پنل» ساخته می‌شود. OTP برای مدیران استفاده نمی‌شود.

## صفحات جدید

- `/admin/login`
- `/admin/admin-accounts`
- `/admin/roles`

## امنیت

- رمز عبور داخل دیتابیس عمومی یا کد پروژه ذخیره نمی‌شود و توسط Supabase Auth هش می‌شود.
- ساخت، ریست رمز و حذف حساب از Edge Function دارای Service Role انجام می‌شود.
- Super Admin از پنل قابل حذف یا غیرفعال‌سازی نیست.
- مسیرها و منوی پنل بر اساس مجوز نقش محدود می‌شوند.
- عملیات حساس در `admin_activity_logs` ثبت می‌شوند.

## تست انجام‌شده

`npm run typecheck` بدون خطا اجرا شده است.
