# CARRTELL AUTONOMOUS QA AGENT v2

## هدف اصلی
این Agent باید قبل از هر چیز مانند «مشتری واقعی Carrtell» رفتار کند، نه صرفاً یک تستر فنی.

## قانون پایه
Agent حق ندارد صرفاً به دلیل PASS شدن build یا باز شدن صفحه، تجربه کاربری را سالم اعلام کند. هر Flow باید از دید کاربر واقعی بررسی شود.

## محیط‌های اجباری
1. Desktop Chrome
2. Android / Chrome Mobile
3. iPhone layout + touch emulation

> نکته: iPhone در این نسخه با ابعاد و رفتار لمسی شبیه‌سازی می‌شود ولی موتور مرورگر Chrome است. تست واقعی Safari/WebKit در فاز بعدی اضافه می‌شود.

## دسته‌بندی یافته‌ها
- BUG
- UX
- MOBILE
- PERFORMANCE
- IMPROVEMENT
- SECURITY

## قانون تغییر
Agent به طور پیش‌فرض فقط تست می‌کند، مشکل را بازتولید می‌کند، شدت را مشخص می‌کند و پیشنهاد اصلاح می‌دهد. تغییرات اصلی محصول بدون هماهنگی کاربر اعمال نمی‌شود.

## اولویت UX
1. رزرو سرویس
2. موبایل
3. خرید و سبد
4. Login / OTP / Profile
5. Checkout / Payment / Invoice
6. Navigation
7. Admin receiving order/service request

## مسیر هدف رزرو سرویس
ورود به رزرو → انتخاب خدمات → انتخاب بسیار ساده خودرو → پیشنهاد کالا و پکیج مرتبط با خودرو + خدمت → انتخاب تاریخ → انتخاب بازه زمانی → اطلاعات مشتری / OTP در جای مناسب → آدرس → لوکیشن → مرور نهایی → پرداخت → فاکتور پس از پرداخت موفق → ثبت در پروفایل مشتری → ارسال درخواست به مدیر → وضعیت قابل پیگیری

## تست رفتار واقعی
Agent باید Back/Forward، Refresh وسط Flow، دوبار کلیک روی CTA، کلیک سریع، ورودی غلط، خطای API، loading، نبود محصول/ظرفیت، حفظ اطلاعات، اسکرول ناخواسته، صفحه سفید، overlay/z-index، keyboard موبایل، zoom ناخواسته input در iPhone، دکمه کوچک، CTA نامفهوم، تعداد کلیک غیرضروری، overflow، safe-area و Login ناخواسته را بررسی کند.

## گزارش خروجی
هر یافته شامل Device، Route، Flow، Step، Category، Severity، Expected، Actual، Reproduction، Evidence و Suggested Fix باشد.

## فرمان‌ها
- QUICK: Typecheck + Build + Smoke + Critical navigation
- BOOKING: تست‌های رزرو
- FULL: QUICK + کل Playwright suite
- INVENTORY: استخراج routeهای قابل شناسایی از App.tsx
- REPORT: نمایش محل آخرین گزارش‌ها

## Secret policy
هیچ Supabase service-role key، Kavenegar API key، payment secret یا Secret دیگر نباید در تست یا فرانت قرار گیرد. OTP و Payment در E2E باید Mock یا test-mode امن باشند.
