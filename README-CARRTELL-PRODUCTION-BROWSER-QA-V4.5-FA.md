# Carrtell Production Browser QA V4.5

این Sprint برای جلوگیری از صفحه‌ی مشکی/سفید در مرورگر واقعی بعد از Build ساخته شده است.

## علت واقعی
Playwright قبلی Service Worker را Block می‌کرد و `reuseExistingServer` فعال بود. در نتیجه ممکن بود Agent یک Preview قدیمی را بعد از Build جدید دوباره استفاده کند و `index.html` قدیمی به Asset هَش‌دار حذف‌شده اشاره کند. در این حالت Vite برای فایل JS ناموجود، HTML برمی‌گرداند و Chrome با خطای MIME صفحه را خالی نمایش می‌دهد.

## تغییرات
- حالت جدید Agent: `PRODUCTION`
- اجرای Production Preview روی Port جداگانه 4180 با Service Worker واقعی
- عدم reuse کردن Preview قدیمی در Configهای اصلی و Persona
- تست MIME واقعی JS/CSS قبل و بعد از کنترل Service Worker
- اصلاح Service Worker تا هرگز HTML را به‌جای JS/CSS از Cache برنگرداند
- Cache version از `carrtell-technician-v1` به `v2` ارتقا یافت تا Cache قدیمی خودکار پاک شود
- حالت‌های `PERSONAS`، `FINAL` و `FULL` قبل از تست‌های دیگر Production Browser Gate را اجرا می‌کنند

## نصب
فایل‌های Patch را در ریشه پروژه Merge/Replace کنید.

SQL: ندارد.
Edge Function Deploy: ندارد.
Secret جدید: ندارد.

## تست
```powershell
npm run typecheck
npm run build
.\agent.ps1 PRODUCTION
.\agent.ps1 PERSONAS
```

اگر `PRODUCTION` Fail شود، دیگر تست دستی مرورگر از کاربر درخواست نشود تا خطای Production Asset/Service Worker برطرف شود.
