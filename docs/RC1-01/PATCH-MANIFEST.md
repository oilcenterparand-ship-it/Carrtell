# PATCH MANIFEST — Carrtell RC1-01

## فایل‌های جدید

- `src/auth/AuthLoadingScreen.tsx`
- `src/pages/UnauthorizedPage.tsx`
- `supabase/migrations/202607230001_rc1_01_authentication.sql`
- `docs/RC1-01/README-FA.md`
- `docs/RC1-01/PATCH-MANIFEST.md`
- `.env.example`

## فایل‌های تغییرکرده

- `src/auth/authApi.ts`
- `src/auth/AuthProvider.tsx`
- `src/auth/ProtectedRoute.tsx`
- `src/pages/OtpLoginPage.tsx`
- `src/lib/supabase.ts`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/admin/pages/Users.tsx`

## تغییرات ناسازگار کنترل‌شده

- نقش قدیمی `driver` به `technician` تبدیل شده است.
- ورود OTP سفارشی مبتنی بر جدول `otp_codes` دیگر در صفحه ورود استفاده نمی‌شود.
- حالت مدیر محلی و نقش ذخیره‌شده در `localStorage` حذف شده است.
- همه مسیرهای ادمین اکنون نیازمند Session معتبر و نقش `admin` هستند.
