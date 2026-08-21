# README فارسی — Sprint Guest Checkout / Live Search / Car Picker V2

این نسخه جایگزین Patch قبلی است. Patch قبلی به علت Parser Error در PowerShell هیچ تغییری در سورس اعمال نکرد.

## تغییرات
- Live Search محصولات با رتبه‌بندی مرتبط‌ترین نتیجه
- Live Search خودرو با رتبه‌بندی
- انتخاب خودرو: سازنده سپس مدل
- Modal کوچک‌تر و امن‌تر در موبایل
- Bottom Nav چهار ستون مساوی
- حذف ورود اجباری از BookPage
- حذف Login Gate فرانت‌اند از CartPage
- رزرو سرویس مهمان با guest_token
- مشاهده و پرداخت همان رزرو با id + token
- پیشنهاد اختیاری ساخت حساب بعد از پرداخت
- پرشدن خودکار شماره موبایل در OTP هنگام انتخاب ساخت حساب

## نصب
فایل‌های ZIP را در ریشه پروژه Extract کن و فایل‌های قبلی Patch را Replace کن.

سپس:
powershell -ExecutionPolicy Bypass -File .\APPLY-SPRINT-GUEST-CHECKOUT-V2.ps1

اسکریپت خودش typecheck، build و git diff --check اجرا می‌کند.

## SQL
بعد از پاس شدن Build و قبل از تست واقعی رزرو مهمان:
supabase/migrations/202608140001_guest_checkout_service.sql

را در Supabase SQL Editor اجرا کن.

## نکته امنیتی
guest_token تصادفی فقط در sessionStorage مرورگر همان مهمان نگهداری می‌شود و برای خواندن/پرداخت رزرو مهمان باید id و token هر دو درست باشند.

هیچ Secret جدیدی به فرانت‌اند اضافه نشده است.
