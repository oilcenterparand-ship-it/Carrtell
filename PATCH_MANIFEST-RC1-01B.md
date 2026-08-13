# PATCH MANIFEST — RC1-01B

## افزوده‌شده
- `src/auth/GlobalRouteGuard.tsx`
- `src/pages/UnauthorizedPage.tsx`
- `supabase/functions/send-sms-hook/index.ts`
- `supabase/functions/send-sms-hook/deno.json`
- `supabase/config.toml`
- `supabase/migrations/202607230002_rc1_01b_auth_kavenegar.sql`
- `public/.htaccess`
- `.env.example`
- `README-RC1-01B-FA.md`

## اصلاح‌شده
- `src/auth/authApi.ts`
- `src/services/smsOtpApi.ts`
- `src/pages/OtpLoginPage.tsx`
- `src/lib/supabase.ts`
- `src/App.tsx`

## قابلیت‌ها
OTP واقعی، ثبت‌نام خودکار، Session پایدار، Refresh Token، Logout، نقش‌های customer/technician/admin، محافظت سراسری مسیرها، لاگ پیامک، Edge Function کاوه‌نگار، تنظیم DirectAdmin و SPA rewrite.
