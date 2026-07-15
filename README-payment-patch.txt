Carrtell Payment Test Gateway Patch

کارهای پچ:
- صفحه PaymentPage پرداخت آزمایشی واقعی‌تر دارد.
- جدول payments اضافه می‌شود.
- سفارش بعد از پرداخت موفق به status='paid' و payment_status='paid' تغییر می‌کند.
- سبد خرید بعد از پرداخت موفق پاک می‌شود.
- رسید پرداخت و لینک فاکتور نمایش داده می‌شود.
- پنل سفارش‌ها وضعیت پرداخت را نشان می‌دهد.

قبل از تست:
1) فایل docs/sql/2026_payments_test_gateway.sql را در Supabase اجرا کن.
2) فایل‌های src را داخل پروژه کپی کن.
3) Vite را refresh کن یا npm run dev را دوباره اجرا کن.
