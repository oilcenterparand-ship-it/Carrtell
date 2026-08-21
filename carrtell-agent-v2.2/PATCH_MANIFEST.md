# PATCH MANIFEST — Carrtell Agent v2.2

## فایل‌های اضافه/تغییرشونده
- agent.ps1
- tests/e2e/shop-cart-v22.spec.ts
- tests/e2e/ux-v22.spec.ts
- README_FA.md
- PATCH_MANIFEST.md

## SQL
ندارد.

## Secrets
ندارد.

## فایل‌های محصول
هیچ فایل src تغییر داده نمی‌شود.

## یافته‌های استاتیک قابل تست
- CartPage لینک محصول را به `/product/:id` می‌سازد، در حالی که Router واقعی `/shop/product/:id` است.
- CartPage مهمان را قبل از payment به `/login-otp` هدایت می‌کند.
- Link به `/profile` در CartPage وجود دارد ولی Router اصلی `/profile` مستقیم تعریف نکرده است.
این موارد توسط Agent باید در اجرای واقعی تأیید شوند.
