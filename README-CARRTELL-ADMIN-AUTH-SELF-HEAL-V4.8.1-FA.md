# Carrtell Admin Auth Self-Heal V4.8.1

این Hotfix روی سورس کامل `project(20260820-112230).zip` و بعد از V4.8 ساخته شده است.

## مشکل واقعی
پس از Deploy تابع `staff-password-login`، ورود Admin با 401 رد می‌شد. کد فعلی دو منبع رمز داشت:

1. `public.staff_login_settings.password_hash`
2. رمز واقعی Supabase Auth کاربر مدیر

تغییر رمز از پنل فقط منبع اول را تغییر می‌داد و امکان Drift بین این دو وجود داشت.

## اصلاح
- هنگام تغییر Credential مدیریت، رمز Supabase Auth همان لحظه Sync می‌شود.
- اگر Hash جدول با Auth از هم جدا شده باشند، Login برای username معتبر Admin ابتدا رمز واقعی Supabase Auth را بررسی می‌کند.
- در صورت موفقیت، Hash جدول به‌صورت خودکار Repair می‌شود.
- اگر هیچ‌کدام رمز را تأیید نکنند همچنان 401 برمی‌گردد.
- هیچ Secret یا رمز ثابتی به Frontend اضافه نشده است.

## نصب
فایل `supabase/functions/staff-password-login/index.ts` را جایگزین و سپس اجرا کنید:

```powershell
npx supabase functions deploy staff-password-login --no-verify-jwt
```

بعد تست مستقیم Backend و سپس Persona QA را اجرا کنید.

SQL جدید نیاز نیست.
