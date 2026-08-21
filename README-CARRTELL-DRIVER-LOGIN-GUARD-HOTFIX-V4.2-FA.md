# Carrtell Driver Login Guard Hotfix V4.2

## علت باگ
در نسخه فعلی، `GlobalRouteGuard` مسیر `/driver/login` را نیز جزو مسیرهای محافظت‌شده سرویس‌کار حساب می‌کرد. در نتیجه کاربر ناشناس از `/driver` به `/driver/login` هدایت می‌شد، اما Guard دوباره همان صفحه ورود را به خودش Redirect می‌کرد و `DriverLoginPage` هرگز Mount نمی‌شد.

نشانه باگ در Playwright:
- URL به `/driver/login` می‌رسید.
- Heading «ورود سرویس‌کار» در DOM پیدا نمی‌شد.
- خطا روی Desktop، Android و iPhone تکرار می‌شد.

## اصلاح
مسیر `/driver/login` به‌صورت صریح Public شده است، مشابه `/admin/login` در Guard مدیریت.

رفتار نهایی مورد انتظار:
1. کاربر ناشناس وارد `/driver` می‌شود.
2. به `/driver/login?returnTo=%2Fdriver` هدایت می‌شود.
3. فرم «ورود سرویس‌کار» نمایش داده می‌شود.
4. با `admin / admin` (تا زمان تغییر از تنظیمات) ورود انجام می‌شود.
5. سپس کاربر به `/driver` برمی‌گردد.

## فایل واقعی تغییرکرده
- `src/auth/GlobalRouteGuard.tsx`

## SQL
این Hotfix هیچ SQL جدیدی ندارد.

> توجه: برای کار کردن `admin/admin` باید Migration قبلی `202608190004_staff_login_settings.sql` قبلاً در Supabase اجرا شده باشد.

## نصب
محتویات ZIP را در ریشه پروژه Extract/Merge کنید:

`D:\carrtell\Carrtell-v0.2-current\project`

فایل هم‌نام را Replace کنید.

## تست
```powershell
npm run typecheck
npm run build
.\agent.ps1 BOOKING
```

اگر BOOKING پاس شد:

```powershell
.\agent.ps1 PERSONAS
```

## نتیجه بررسی قبل از تحویل
TypeScript با دستور مستقیم `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` روی سورس تغییرکرده بدون خطا پاس شد.
