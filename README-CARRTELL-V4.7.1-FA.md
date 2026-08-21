# Carrtell V4.7.1 — تثبیت ورود مدیریت بعد از Service Ops

این Hotfix فقط رگرسیون ورود مدیریت بعد از نصب V4.7 را رفع می‌کند.

## علت
V4.7 منطق چند سرویس‌کار را داخل همان Edge Function ورود اضافه کرد. ورود سرویس‌کار سالم بود، اما مسیر مدیریت دوباره روی `/admin/login` می‌ماند. مسیر مدیریت در V4.7.1 از منطق سرویس‌کار جدا شده و همان الگوی پایدار V4.6 را به‌صورت مستقل اجرا می‌کند.

## فایل تغییرکرده
- `supabase/functions/staff-password-login/index.ts`

## SQL
ندارد.

## نصب
فایل را در ریشه پروژه Extract/Replace کنید و سپس:

```powershell
npx supabase functions deploy staff-password-login --no-verify-jwt
```

Credentials تست فعلی:
- Admin: `admin / 12345678`
- Technician: `service / 12345678`

سپس در همان PowerShell:

```powershell
$env:CARRTELL_ADMIN_USERNAME="admin"
$env:CARRTELL_ADMIN_PASSWORD="12345678"
$env:CARRTELL_TECH_USERNAME="service"
$env:CARRTELL_TECH_PASSWORD="12345678"
.\agent.ps1 PERSONAS
```
