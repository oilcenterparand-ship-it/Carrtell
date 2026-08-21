# Patch Manifest — Carrtell Reliability / Map / Staff V4

## فایل‌های تغییرکرده
- `src/pages/BookPage.tsx`
- `src/pages/OtpLoginPage.tsx`
- `src/components/MapLocationPicker.tsx`
- `src/admin/pages/AdminLogin.tsx`
- `src/admin/pages/SystemSettingsCenter.tsx`
- `src/auth/GlobalRouteGuard.tsx`
- `src/App.tsx`

## فایل‌های جدید
- `src/auth/staffPasswordAuth.ts`
- `src/pages/DriverLoginPage.tsx`
- `supabase/functions/staff-password-login/index.ts`
- `supabase/functions/neshan-search/index.ts`
- `supabase/migrations/202608190004_staff_login_settings.sql`
- `README-CARRTELL-RELIABILITY-MAP-STAFF-V4-FA.md`
- `PATCH-MANIFEST-CARRTELL-RELIABILITY-MAP-STAFF-V4.md`

## Secretها
هیچ Secret جدیدی داخل Frontend قرار نگرفته است. Neshan Service Key از Supabase Secret موجود خوانده می‌شود.

## SQL
یک migration جدید برای تنظیمات ورود موقت کارکنان وجود دارد. هیچ جدول/داده فعلی حذف نمی‌شود.
