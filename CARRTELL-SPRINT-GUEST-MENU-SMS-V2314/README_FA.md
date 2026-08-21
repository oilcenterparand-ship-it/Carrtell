# Carrtell v2.3.14 — منوی مهمان + OTP واقعی کاوه‌نگار

این Sprint مستقیماً بر مبنای ZIP کامل واقعی `carrtell-current-v2313-FINAL.zip` ساخته شده است.

## 1. مشکل منوی همبرگری
در سورس واقعی `Layout.tsx`، Footer منوی همبرگری برای Guest هنوز لینک `ورود / ثبت‌نام` به `/login-otp` داشت. این CTA از Drawer حذف شد و با پیام خنثی «خرید و رزرو بدون ورود» جایگزین شد.

ورود حساب از هدر/پروفایل همچنان امکان‌پذیر است، اما بازکردن یا استفاده از منوی همبرگری هیچ Login Gate یا CTA اجباری ندارد.

## 2. مشکل SMS
فرانت‌اند از `supabase.auth.signInWithOtp()` استفاده می‌کند. ارسال SMS واقعی فقط وقتی به کاوه‌نگار می‌رسد که **Supabase Authentication > Hooks > Send SMS** به Edge Function پروژه متصل و Secretهای سمت Supabase تنظیم شده باشند.

Edge Function موجود `send-sms-hook` سخت‌گیرانه‌تر شد:
- `SEND_SMS_HOOK_SECRET` اجباری است.
- امضای Standard Webhooks قبل از پردازش Payload بررسی می‌شود.
- `KAVENEGAR_API_KEY` اجباری است.
- شماره و OTP قبل از ارسال validate می‌شوند.
- خطای شبکه و خطای Provider جدا گزارش می‌شود.
- نتیجه در `sms_logs` به‌صورت best-effort ثبت می‌شود.
- هیچ API Key یا Secret داخل React/Frontend قرار نگرفته است.

## فایل‌های واقعی تغییرکرده
- `src/components/Layout.tsx`
- `supabase/functions/send-sms-hook/index.ts`
- `tests/e2e/critical-user-journeys-v23.spec.ts`

## فایل کمکی
- `setup-real-sms-v2314.ps1`

این اسکریپت Secretها را از کاربر به‌صورت Secure Prompt می‌گیرد، در فایل موقت سیستم می‌نویسد، با Supabase CLI ثبت می‌کند و فایل موقت را حذف می‌کند. Secret داخل سورس ذخیره نمی‌شود.

## SQL
SQL جدید ندارد. جدول `sms_logs` از migration قبلی پروژه وجود دارد.

## نصب Patch
```powershell
Set-ExecutionPolicy -Scope Process Bypass
& ".\CARRTELL-SPRINT-GUEST-MENU-SMS-V2314\install-sprint-guest-menu-sms-v2314.ps1"
```

## تست Local
```powershell
npm run typecheck
npm run build
.\agent.ps1 CRITICAL
```

تست جدید Drawer الزام می‌کند که:
- Drawer برای مهمان باز شود.
- لینک `/login-otp` داخل Drawer وجود نداشته باشد.
- فروشگاه و سرویس در محل داخل منو عمومی باقی بمانند.

## اتصال SMS واقعی
بعد از PASS تست Local:

```powershell
& ".\CARRTELL-SPRINT-GUEST-MENU-SMS-V2314\setup-real-sms-v2314.ps1"
```

اسکریپت:
1. Project Ref را می‌گیرد.
2. Kavenegar API Key را به‌صورت مخفی دریافت می‌کند.
3. `KAVENEGAR_TEMPLATE=carrtelllogin` را ثبت می‌کند.
4. `send-sms-hook` را Deploy می‌کند.
5. URL تابع را نمایش می‌دهد.
6. شما در Supabase Dashboard به `Authentication > Hooks` می‌روید، **Send SMS / HTTPS** را می‌سازید و همان URL را وارد می‌کنید.
7. Supabase یک Hook Secret تولید می‌کند؛ آن را به اسکریپت می‌دهید تا به‌صورت Supabase Secret ذخیره شود.

## تست واقعی SMS
بعد از پایان Setup:
1. سایت واقعی را باز کنید.
2. رزرو سرویس را تا مرحله شماره موبایل ادامه دهید.
3. «تأیید شماره» را بزنید.
4. SMS الگوی `carrtelllogin` باید برسد.
5. اگر نرسید:
   - Supabase > Edge Functions > `send-sms-hook` > Logs را بررسی کنید.
   - جدول `public.sms_logs` را بررسی کنید.
   - در Kavenegar تأیید کنید Template دقیقاً `carrtelllogin` و فعال است.

## امنیت
- `KAVENEGAR_API_KEY` فقط Supabase Secret است.
- `SEND_SMS_HOOK_SECRET` فقط Supabase Secret است.
- هیچ Secret پرداخت/Supabase Service Role/Kavenegar به Frontend اضافه نشده است.
