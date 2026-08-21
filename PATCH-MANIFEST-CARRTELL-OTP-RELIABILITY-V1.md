# Patch Manifest — Carrtell OTP Reliability V1

## Scope
پایداری OTP در Booking و Login، جلوگیری از duplicate request، و اصلاح logging در Kavenegar hook.

## Changed files
1. `src/auth/authApi.ts`
   - in-flight deduplication برای OTP بر اساس شماره نرمال‌شده.
   - guard کوتاه ۲.۵ ثانیه‌ای بعد از درخواست پذیرفته‌شده.

2. `src/pages/BookPage.tsx`
   - cooldown ۶۰ ثانیه‌ای برای resend.
   - disable کردن دکمه‌ها هنگام ارسال/cooldown.
   - پیام واضح‌تر پس از پذیرفته‌شدن درخواست.
   - reset cooldown با تغییر شماره.

3. `supabase/functions/send-sms-hook/index.ts`
   - ثبت `message` و `type` مطابق schema واقعی `sms_logs`.
   - ذخیره نسخه sanitize شده پاسخ Kavenegar بدون متن OTP.

4. `tests/e2e/auth-account-regression-v2319.spec.ts`
   - regression test برای اینکه double-click فقط یک `/auth/v1/otp` ایجاد کند.

5. `supabase/migrations/202608190003_sms_otp_reliability.sql`
   - تضمین وجود `provider` و `template_key`.
   - index برای مشاهده سریع لاگ‌های شماره/زمان.
   - reload schema cache.

## Database
SQL دارد و idempotent است. حذف داده یا تغییر مخرب ندارد.

## Secrets
هیچ Secretی داخل Frontend یا Patch قرار نگرفته است.

## Verification performed
- `npm run typecheck` روی سورس پچ‌شده: PASS.
- Build در محیط Linux این جلسه به علت `node_modules` ویندوزی با `vite: Permission denied` قابل تأیید نبود؛ Build نهایی باید روی ویندوز پروژه اجرا شود.
