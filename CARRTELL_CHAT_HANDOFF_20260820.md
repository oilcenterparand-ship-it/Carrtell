# CARRTELL — متن انتقال به چت جدید

این متن را در چت جدید داخل Project «Carrtell» قرار بده. چت جدید باید توسعه را از آخرین ZIP کامل واقعی ادامه دهد، نه از نسخه‌های قدیمی یا ساختار حدسی.

---

## 1) قانون اصلی توسعه

این Project فقط برای توسعه Carrtell است.

- همیشه آخرین ZIP کامل آپلودشده را مبنای توسعه قرار بده.
- قبل از تغییر هر فایل، ساختار واقعی سورس و دیتابیس را بررسی کن.
- از نسخه‌های قدیمی، نام فایل حدسی یا Schema فرضی استفاده نکن.
- Patch ساختگی/فرضی نساز.
- اگر فایل لازم وجود ندارد، دقیق اعلام کن.
- کارها را Sprint کامل انجام بده؛ Hotfix بی‌دلیل روی Hotfix نساز.
- اولویت محصول: Mobile UX، خرید ساده، رزرو سرویس ساده، پنل مدیریت روان، پنل سرویس‌کار اپلیکیشنی.
- Secretهای Supabase، Kavenegar، SMS Provider دوم، پرداخت و Neshan Service API هرگز وارد Frontend/Vite نشوند.

### هر تحویل باید داشته باشد
1. فایل‌های واقعی تغییرکرده
2. SQL فقط اگر واقعاً لازم است
3. README فارسی
4. Patch Manifest
5. مراحل نصب
6. مراحل تست
7. نتیجه typecheck/build/Agent تا جایی که محیط اجازه داده

---

## 2) مسیر پروژه کاربر

Windows / PowerShell:

`D:\carrtell\Carrtell-v0.2-current\project`

Node/npm قبلاً روی سیستم کاربر فعال است. Agent اصلی:

`.\agent.ps1`

### Credentialهای فعلی تست Agent
Admin:
- username: `admin`
- password: `12345678`

Technician test:
- username: `service`
- password: `12345678`

این Environment Variableها فقط برای Agent هستند و با بسته‌شدن PowerShell پاک می‌شوند. حساب واقعی Backend دائمی است.

```powershell
$env:CARRTELL_ADMIN_USERNAME="admin"
$env:CARRTELL_ADMIN_PASSWORD="12345678"
$env:CARRTELL_TECH_USERNAME="service"
$env:CARRTELL_TECH_PASSWORD="12345678"
```

### تست معمول هر Patch
```powershell
npm run typecheck
npm run build

$env:CARRTELL_ADMIN_USERNAME="admin"
$env:CARRTELL_ADMIN_PASSWORD="12345678"
$env:CARRTELL_TECH_USERNAME="service"
$env:CARRTELL_TECH_PASSWORD="12345678"

.\agent.ps1 PERSONAS
```

اگر PASS شد، `dist` را روی هاست Deploy کن. محتوای `dist` باید جایگزین `public_html` شود؛ `assets` قدیمی نگه داشته نشود.

---

## 3) وضعیت تست پایدار قبل از V5.0

آخرین Persona QA تاییدشده توسط کاربر:
- TYPECHECK PASS
- BUILD PASS
- Production Browser + Service Worker PASS
- PERSONAS PASS
- Admin / Customer / Technician سالم

Admin Auth در V4.8/V4.8.1 اصلاح شده و Edge Function مستقیم با Origin `https://carrtell.ir` پاسخ `200 / ok:true` داده است.

---

## 4) وضعیت پنل مدیریت

بازطراحی V4.8 انجام شده. ساختار هدف پنل مدیریت:
- کار امروز
- عملیات سرویس
- فروشگاه و کالا
- مشتریان
- بازاریابی و محتوا
- مالی و پرداخت
- تیم و دسترسی‌ها
- تنظیمات و سیستم

عملیات سرویس فعلی:
- `/admin/dispatch` = صف تخصیص سرویس‌کار
- `/admin/service-operations` = مدیریت روند ماموریت‌ها
- `/admin/service-requests` = درخواست‌های سرویس قدیمی/جزئیات
- `/admin/technicians` = تعریف سرویس‌کار واقعی
- `/admin/service-fleet` = خودروهای سرویس

نکته مهم: قبلاً «کاربران پنل» و `service_technicians` دو سیستم جدا بودند. برای تخصیص ماموریت، سرویس‌کار باید در `public.service_technicians` وجود داشته باشد. هدف آینده یکپارچه‌سازی کامل Team/User/Technician است.

چرخه مطلوب CRM:
`پرداخت → در انتظار تخصیص → تخصیص‌شده → قبول ماموریت → در مسیر → رسیدن → شروع سرویس → ثبت اقلام/عملیات → پایان سرویس → فاکتور/SMS → نظرسنجی → گزارش مدیریت`

---

## 5) رزرو و Checkout

V4.9.2:
- پایان پرداخت رزرو دیگر فاکتور کامل را دوباره نمایش نمی‌دهد.
- دکمه «دریافت فاکتور به‌صورت عکس» وجود دارد.
- ساخت حساب بعد از پرداخت باید OTP قبلی را Reuse کند و بی‌دلیل OTP دوم نخواهد.
- اگر نشست OTP واقعاً منقضی شده باشد، پیام واضح نمایش داده می‌شود.

خرید/رزرو سرویس پرداخت‌شده باید خودکار وارد `service_requests` و صف عملیات شود. V4.9 Migration مربوط به paid order -> service CRM قبلاً نصب شده است.

---

## 6) پنل سرویس‌کار

هدف UX: شبیه اپ رانندگان Snapp/Tapsi، نه سایت.

- Header/Footer سایت نباید داخل Driver باشد.
- صفحه اصلی فقط اطلاعات ماموریت بعدی و اقدام لازم را نشان بدهد.
- Timeline بزرگ چندمرحله‌ای حذف شده.
- داخل Job Detail فقط یک CTA «اقدام بعدی» دیده شود:
  `قبول ماموریت → شروع حرکت → رسیدم → شروع سرویس → پایان سرویس`
- «شروع حرکت» باید Neshan را با مقصد مشتری باز کند.
- سوابق فقط مشتری/خودرو/تاریخ و کارهای واقعی انجام‌شده/اقلام/یادداشت را نشان دهد، نه مراحل Workflow.
- Driver باید فقط ماموریت‌های خودش را ببیند.

Routes:
- `/driver/login`
- `/driver/dashboard`
- `/driver/jobs/:id`

---

## 7) PWA و Android

مشکل قبلی: Store PWA و Driver PWA روی یک Origin بودند و صفحه `/download` هر دو را «نصب شده» تشخیص می‌داد.

V5.0 تصمیم معماری:
- `/download` فقط اپ مشتری Carrtell را نمایش می‌دهد.
- صفحات `/driver/*` Manifest PWA عمومی ندارند.
- Driver از سایت عمومی جدا شده و پروژه Android مستقل اضافه شده:
  `android-driver/`
- Android package: `ir.carrtell.driver`
- Android App فقط `https://carrtell.ir/driver/*` را داخل اپ باز می‌کند؛ لینک Neshan/Tel خارج از WebView باز می‌شوند.
- Push واقعی زمانی که اپ کاملاً بسته است هنوز FCM می‌خواهد و نیازمند Firebase config / google-services.json است.
- Native local notification در Android bridge آماده است؛ SMS fallback باید مستقل باشد.

---

## 8) SMS / OTP — وضعیت بسیار مهم

Supabase project ref:
`wvevnnulicakxdphgmlu`

OTP از Supabase Auth Send SMS Hook به:
`supabase/functions/send-sms-hook/index.ts`
می‌رود.

Template Kavenegar قبلاً `carrtelllogin` بوده است.

### لاگ واقعی 2026-08-20
برای شماره `09359609645` چند بار:
- Kavenegar API return status = 200
- entry status = 13
- statustext = `لغو شده`

برای بعضی شماره‌های 0912:
- status = 5
- `ارسال به مخابرات`

پس شواهد خرابی عمومی Kavenegar را نشان نمی‌دهد؛ API درخواست را قبول می‌کند اما بعضی ارسال‌ها بعداً Cancel می‌شوند.

### Bug پیدا شده
کد قبلی فقط `return.status == 200` را sent حساب می‌کرد؛ بنابراین status 13 را اشتباهی `sent` در `sms_logs` ذخیره می‌کرد.

### V5.0
- statusهای 6/11/13/14 failure حساب می‌شوند.
- Kavenegar failure درست log می‌شود.
- Failover اختیاری Ghasedak اضافه شده ولی فقط با Secret سرور فعال می‌شود:
  - `GHASEDAK_API_KEY`
  - `GHASEDAK_TEMPLATE`
- هیچ Secret در Frontend قرار نگیرد.

Deploy Function پس از V5.0:
```powershell
npx supabase functions deploy send-sms-hook --no-verify-jwt
```

SQL بررسی لاگ:
```sql
select created_at, phone, type, status, provider, template_key, error_message, provider_response
from public.sms_logs
order by created_at desc
limit 20;
```

قبل از خرید Provider دوم، اول با Kavenegar Support وضعیت messageidهای status 13 را بررسی کن. اگر مشکل تکراری/route-specific باقی ماند، Failover دوم را فعال کن.

---

## 9) Neshan

Neshan Map قبلاً یکپارچه شده:
- Frontend Web key فقط برای نمایش نقشه
- Service API secret فقط Supabase server-side
- Edge Functions: `neshan-reverse-geocode`, `neshan-search`
- Driver start movement باید Neshan routing را باز کند.

Secret Service نباید Frontend برود.

---

## 10) فایل‌ها/نسخه‌های مهم

تاریخچه مهم:
- V4.7 Service Operations
- V4.8 Admin Redesign
- V4.8.1 Admin Auth self-heal
- V4.9 Paid Service CRM + Driver App UI
- V4.9.1 Driver app service ops
- V4.9.2 Checkout/PWA simplification
- V4.9.2.1 Persona technician test hotfix
- V5.0 Driver Android + SMS reliability / PWA separation

**مهم:** بعد از نصب و PASS شدن V5.0، کاربر باید یک ZIP کامل تازه از پوشه پروژه بسازد و در چت جدید بفرستد. آن ZIP مبنای قطعی توسعه بعدی باشد؛ نه ZIPهای قبلی.

---

## 11) اولویت Sprint بعدی بعد از V5.0

1. تست واقعی OTP روی 2-3 اپراتور/شماره و بررسی sms_logs
2. تصمیم درباره فعال‌کردن Provider دوم
3. Build و Signing APK Android Driver
4. FCM Push واقعی برای Driver در حالت app closed
5. SMS واقعی برای «ماموریت جدید» (نه فقط pending log)
6. CRM automation کامل SLA / Timeline / invoice / review / reports
7. یکپارچه‌کردن Admin users + service_technicians
8. نوشتن راهنمای نهایی مدیریت روزانه و آموزش استخدام/Onboarding سرویس‌کار بعد از تثبیت UI

---

## 12) رفتار مورد انتظار Assistant در چت جدید

- از کاربر نخواه دوباره همه چیز را توضیح دهد؛ این فایل Context را بخوان.
- برای هر تغییر سورس، اول آخرین ZIP کامل جدید را inspect کن.
- اگر ZIP بعد از آخرین Patch نیست، Patch جدید نساز تا ZIP تازه گرفته شود.
- تست‌های Agent را به جای تست دستی تکراری توسعه بده.
- هیچ‌وقت صرف PASS بودن Agent ادعا نکن UI واقعاً خوب است؛ برای تغییرات موبایل screenshot واقعی هم معیار است.
- وقتی Error داریم، ابتدا Root Cause را از log/source مشخص کن، بعد Patch بساز.
- هدف نهایی: کار روزانه مدیر و سرویس‌کار باید بدون دانش فنی قابل انجام باشد.
