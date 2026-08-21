# Carrtell V5.0 — Driver Android + SMS Reliability

مبنای این Sprint: `project(20260820-162222).zip`

## چرا این Sprint ساخته شد؟

لاگ واقعی OTP نشان داد پاسخ HTTP/API کاوه‌نگار `200` بوده، اما برای شماره تست 0935 وضعیت داخلی پیام `13 / لغو شده` برگشته است. کد قبلی فقط `return.status = 200` را بررسی می‌کرد و بنابراین پیام لغوشده را اشتباهاً `sent` ثبت می‌کرد.

در همان لاگ‌ها شماره‌های 0912 وضعیت `5 / ارسال به مخابرات` گرفته‌اند؛ پس شواهد فعلی خرابی عمومی سرویس کاوه‌نگار را نشان نمی‌دهد و مشکل برای بعضی ارسال‌ها/شماره‌ها بعد از پذیرش API رخ می‌دهد.

## تغییرات

### 1) OTP / SMS
- `status 13` دیگر sent محسوب نمی‌شود.
- وضعیت‌های پایان‌یافته ناموفق `6, 11, 13, 14` به عنوان failure ثبت می‌شوند.
- sms_logs حالا خطای واقعی provider را ثبت می‌کند.
- Failover اختیاری به قاصدک اضافه شده و فقط در صورت وجود Secretهای سرور فعال می‌شود.
- هیچ API Key داخل Frontend قرار نگرفته است.

### 2) جداسازی اپ مشتری و سرویس‌کار
- صفحه `/download` فقط اپ مشتری Carrtell را نشان می‌دهد.
- صفحات `/driver/*` دیگر Manifest اپ مشتری یا Driver PWA را به مرورگر معرفی نمی‌کنند.
- مشکل نمایش همزمان «نصب شده» برای فروشگاه و سرویس‌کار حذف می‌شود.
- Driver PWA از مسیر عمومی حذف شده؛ Driver از این Sprint به بعد Android App مستقل دارد.

### 3) Android App سرویس‌کار
پروژه واقعی Android در پوشه `android-driver/` اضافه شده است.

Package:
`ir.carrtell.driver`

اپ فقط `https://carrtell.ir/driver/*` را داخل WebView خودش باز می‌کند. تماس، نشان و لینک‌های خارج از Driver به اپ مناسب گوشی تحویل می‌شوند. Location Permission و Notification Permission هم در Android تعریف شده‌اند.

> Push واقعی وقتی اپ کاملاً بسته است هنوز FCM می‌خواهد. نسخه فعلی اعلان Native را وقتی Driver UI ماموریت تازه را می‌بیند نمایش می‌دهد و SMS مسیر پشتیبان است. برای FCM باید در Sprint بعد فایل Firebase/`google-services.json` ساخته و فقط در پروژه Android قرار داده شود.

## نصب Patch روی پروژه
ZIP را در ریشه پروژه Extract/Replace کنید:

`D:\carrtell\Carrtell-v0.2-current\project`

### Edge Function
این Function تغییر کرده و باید Deploy شود:

```powershell
npx supabase functions deploy send-sms-hook --no-verify-jwt
```

### SQL
این Sprint SQL ندارد.

### تست Frontend
```powershell
npm run typecheck
npm run build

$env:CARRTELL_ADMIN_USERNAME="admin"
$env:CARRTELL_ADMIN_PASSWORD="12345678"
$env:CARRTELL_TECH_USERNAME="service"
$env:CARRTELL_TECH_PASSWORD="12345678"

.\agent.ps1 PERSONAS
```

بعد از PASS، `dist` جدید را کامل روی `public_html` جایگزین کنید.

## فعال‌کردن Failover قاصدک — اختیاری
فعلاً لازم نیست Provider را عوض کنید. اگر حساب قاصدک تهیه شد و Template OTP ساخته شد، Secretها فقط روی Supabase قرار می‌گیرند:

```powershell
npx supabase secrets set GHASEDAK_API_KEY="<SERVER_SECRET>"
npx supabase secrets set GHASEDAK_TEMPLATE="<OTP_TEMPLATE_NAME>"
npx supabase functions deploy send-sms-hook --no-verify-jwt
```

این مقادیر نباید در `.env` فرانت‌اند یا Vite قرار بگیرند.

اگر Secretهای قاصدک وجود نداشته باشند، سیستم مثل قبل فقط از کاوه‌نگار استفاده می‌کند؛ اما لغو واقعی را دیگر sent گزارش نمی‌کند.

## تست SMS بعد از Deploy
پس از درخواست OTP، این SQL را اجرا کنید:

```sql
select created_at, phone, type, status, provider, template_key, error_message, provider_response
from public.sms_logs
order by created_at desc
limit 20;
```

انتظار:
- `status 5` از Provider => log `sent`
- `status 13` => log `failed`
- در صورت فعال بودن fallback، بعد از failed کـاوه‌نگار باید attempt دوم با `provider = ghasedak` دیده شود.

## Build اپ Android
پوشه زیر را با Android Studio باز کنید:

`android-driver`

نیازها:
- JDK 17
- Android SDK 35
- Android Studio

سپس Gradle Sync و:
`Build > Build APK(s)`

خروجی Debug معمولاً:
`android-driver/app/build/outputs/apk/debug/app-debug.apk`

برای نسخه Production باید Signing Key اختصاصی Carrtell ساخته شود؛ Signing Secret داخل Repo قرار نگیرد.
