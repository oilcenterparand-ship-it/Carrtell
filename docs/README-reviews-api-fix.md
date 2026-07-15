# Carrtell Reviews API Fix

این پچ خطای زیر را رفع می‌کند:

`does not provide an export named 'getApprovedCustomerReviews'`

فایل اصلاح‌شده:

- `src/admin/services/customerReviewsApi.ts`

تابع اضافه‌شده:

- `getApprovedCustomerReviews(limit = 6)`

این تابع فقط نظراتی را برمی‌گرداند که `is_approved = true` هستند تا صفحه اصلی فقط نظرات تأییدشده مدیر را نمایش دهد.

تست انجام‌شده:

- `npm run build` موفق شد.
