# Carrtell V4.9.2 — Driver PWA + Checkout Cleanup

این Sprint روی نسخه کامل `project(20260820-121754).zip` به‌علاوه Patchهای V4.9 و V4.9.1 آماده شده است.

## هدف Sprint
- ساده‌سازی صفحه پایان پرداخت رزرو سرویس
- حذف نمایش دوباره جزئیات فاکتور پس از پرداخت و جایگزینی با دانلود فاکتور تصویری PNG
- تلاش برای استفاده مجدد از نشست OTP قبلی هنگام فعال‌سازی حساب و جلوگیری از درخواست بی‌مورد OTP دوم
- حذف Timeline شلوغ از ماموریت سرویس‌کار و نمایش فقط اقدام بعدی
- ساده‌سازی سوابق سرویس‌کار و نمایش کارهای انجام‌شده برای هر مشتری
- اضافه‌کردن Web App فروشگاه و Web App سرویس‌کار
- اضافه‌کردن صفحه `/download` و لینک آن در Footer سایت
- فعال‌سازی اعلان مرورگر برای مأموریت جدید در پنل سرویس‌کار
- ثبت پیامک مأموریت جدید در مسیر SMS Carrtell هنگام تخصیص سرویس‌کار

## نصب
1. ZIP را در ریشه پروژه Extract و Replace کن:
   `D:\carrtell\Carrtell-v0.2-current\project`
2. فایل SQL زیر را یک بار در Supabase SQL Editor اجرا کن:
   `supabase/migrations/202608200003_driver_pwa_notifications.sql`
3. اجرا:
   ```powershell
   npm run typecheck
   npm run build
   ```
4. سپس تست Persona:
   ```powershell
   $env:CARRTELL_ADMIN_USERNAME="admin"
   $env:CARRTELL_ADMIN_PASSWORD="12345678"
   $env:CARRTELL_TECH_USERNAME="service"
   $env:CARRTELL_TECH_PASSWORD="12345678"
   .\agent.ps1 PERSONAS
   ```
5. بعد از PASS شدن، محتوای `dist` را روی `public_html` جایگزین کن.

## تست دستی موبایل
- `https://carrtell.ir/download`
- `https://carrtell.ir/driver/login`
- `https://carrtell.ir/driver/dashboard`
- یک ماموریت واقعی را تا پایان انجام بده و تب «سوابق» را چک کن.
- یک رزرو آزمایشی انجام بده، پرداخت را ثبت کن و دکمه «دریافت فاکتور به‌صورت عکس» را تست کن.

## نکته اعلان‌ها
اعلان مرورگر پس از اجازه کاربر فعال می‌شود و وقتی پنل/Web App در حال اجرا یا Refresh است مأموریت جدید را اطلاع می‌دهد. Push واقعی در حالت کاملاً بسته نیاز به Web Push/VAPID سروری دارد و در این Sprint اضافه نشده است. برای اینکه مأموریت از دست نرود، همزمان پیامک تخصیص در مسیر SMS Carrtell ثبت می‌شود.

## Secretها
هیچ Secret جدیدی به Frontend اضافه نشده است. مسیر پیامک از سیستم فعلی Carrtell استفاده می‌کند.
