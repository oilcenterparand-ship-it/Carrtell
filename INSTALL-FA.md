# نصب سریع پچ Carrtell

این پچ مربوط به Sprint زیر است:

- خرید/رزرو بدون ورود اجباری
- Live Search محصولات
- انتخاب خودرو سازنده → مدل
- اصلاح Modal خودرو در موبایل
- چهارستونه شدن منوی پایین
- پیشنهاد اختیاری ساخت حساب بعد از پرداخت

## روش نصب

1. ZIP را در ریشه پروژه Extract کن:

D:\carrtell\Carrtell-v0.2-current\project

2. اگر این تغییرات قبلاً روی همین پروژه اعمال شده‌اند، دوباره اسکریپت را اجرا نکن.

3. برای اعمال روی نسخه تمیز همین Branch:

powershell -ExecutionPolicy Bypass -File .\APPLY-SPRINT-GUEST-CHECKOUT-V2.ps1

4. SQL مورد نیاز:

supabase\migrations\202608140001_guest_checkout_service.sql

اگر SQL قبلاً با پیام Success اجرا شده، دوباره اجرای آن لازم نیست.

5. Build:

npm run typecheck
npm run build

## تست
تست‌های موبایل در README فارسی داخل همین پچ آمده است.
