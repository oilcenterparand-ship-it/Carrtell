# Patch Manifest — Carrtell v2.3.22

## فایل‌های تغییرکرده

- `src/pages/BookPage.tsx`
  - جلوگیری از overwrite شدن State موفق OTP پس از Refresh حساب
- `tests/e2e/critical-user-journeys-v23.spec.ts`
  - شمارش درخواست Verify واقعی Mock Supabase
  - کنترل `phoneVerified` از طریق پیام موفقیت و دکمه غیرفعال «تأیید شد»

## دیتابیس

SQL ندارد.

## امنیت

هیچ Secret یا کلید Supabase/Kavenegar به Frontend اضافه نشده است.
