# Patch Manifest — Carrtell V4.9.2

## فایل‌های تغییرکرده
- `src/App.tsx`
- `src/main.tsx`
- `src/pages/ServicePaymentPage.tsx`
- `src/pages/DownloadsPage.tsx`
- `src/components/Footer.tsx`
- `src/components/PwaInstallButton.tsx`
- `src/customer/services/serviceRequestsApi.ts`
- `src/driver/pages/DriverDashboard.tsx`
- `src/driver/pages/DriverJobDetail.tsx`
- `src/driver/components/DriverNotificationSetup.tsx`
- `src/admin/services/dispatchApi.ts`
- `src/utils/serviceInvoiceImage.ts`
- `public/manifest.webmanifest`
- `public/driver.webmanifest`
- `public/sw.js`
- `public/brand/app-192.png`
- `public/brand/app-512.png`
- `public/brand/driver-192.png`
- `public/brand/driver-512.png`
- `tests/e2e/persona-technician.spec.ts`

## SQL
- `supabase/migrations/202608200003_driver_pwa_notifications.sql`
  - ایجاد/به‌روزرسانی Template پیامک `technician_mission_assigned`

## رفتار جدید
1. پایان پرداخت رزرو: فاکتور دوباره روی صفحه نمایش داده نمی‌شود؛ فقط شماره درخواست، پیگیری و دکمه دانلود PNG.
2. فعال‌سازی حساب: ابتدا نشست OTP قبلی Refresh/Reuse می‌شود؛ OTP دوم فقط اگر نشست واقعاً منقضی شده باشد لازم می‌شود.
3. ماموریت سرویس‌کار: Timeline چندمرحله‌ای حذف شده؛ فقط «اقدام بعدی» و یک CTA مرحله فعلی نشان داده می‌شود.
4. سوابق سرویس‌کار: خلاصه کارهای انجام‌شده، محصول/عملیات و یادداشت نمایش داده می‌شود.
5. PWA: Manifest مستقل برای Store و Driver + آیکون‌های نصب + صفحه `/download`.
6. اعلان: Notification permission داخل حساب سرویس‌کار + اعلان مأموریت جدید در پنل.
7. SMS: بعد از تخصیص مأموریت، پیامک سرویس‌کار در SMS pipeline Carrtell ثبت می‌شود.
