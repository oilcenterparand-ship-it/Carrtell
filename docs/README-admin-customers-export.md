# Carrtell - Admin Customers Export Patch

این پچ صفحه مدیریت کاربران/مشتری‌ها را کامل می‌کند.

## فایل‌ها
- `src/admin/pages/Users.tsx`
- `src/admin/services/customersApi.ts`

## امکانات
- خواندن مشتری‌ها از جدول `orders`
- تکمیل اطلاعات شهر/محله از `customer_addresses` در صورت وجود
- نمایش تعداد سفارش، مجموع خرید، آخرین وضعیت و تعداد آدرس‌ها
- جستجوی نام، موبایل، خودرو، شهر و محله
- خروجی Excel-compatible CSV با BOM فارسی برای شماره تماس مشتری‌ها

## تست
- `npm run typecheck` موفق شد.
- `npm run build` موفق شد.
