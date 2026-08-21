# Carrtell OTP Reliability Sprint V1

این پچ بر اساس آخرین ZIP کامل آپلودشده پروژه و ساختار واقعی جدول `public.sms_logs` که در Supabase بررسی شد ساخته شده است.

## هدف
- جلوگیری از درخواست تکراری OTP با دوبار کلیک یا event هم‌زمان.
- اضافه کردن cooldown واقعی ۶۰ ثانیه‌ای در OTP رزرو سرویس.
- ثبت قابل اعتماد نتیجه Kavenegar در `sms_logs` بدون ذخیره خود کد OTP.
- هماهنگ کردن `send-sms-hook` با ستون `message` که در دیتابیس Production اجباری (`NOT NULL`) است.
- نگهداری پاسخ امن Provider برای عیب‌یابی تحویل پیامک.

## فایل‌های تغییرکرده
- `src/auth/authApi.ts`
- `src/pages/BookPage.tsx`
- `supabase/functions/send-sms-hook/index.ts`
- `tests/e2e/auth-account-regression-v2319.spec.ts`
- `supabase/migrations/202608190003_sms_otp_reliability.sql`

## SQL
فایل SQL پچ idempotent است. چون ستون‌های `provider` و `template_key` قبلاً روی Production اضافه شده‌اند، اجرای دوباره آن خطری ندارد.

در SQL Editor فایل زیر را اجرا کنید:
`supabase/migrations/202608190003_sms_otp_reliability.sql`

## Deploy Edge Function
بعد از جایگزینی فایل‌ها:

```powershell
npx supabase functions deploy send-sms-hook --no-verify-jwt
```

> Secretهای `KAVENEGAR_API_KEY`، `KAVENEGAR_TEMPLATE` و `SEND_SMS_HOOK_SECRET` نباید داخل Frontend قرار بگیرند و این پچ هیچ Secretی را به سورس اضافه نمی‌کند.

## Build و Test

```powershell
npm run typecheck
npm run build
npx playwright test tests/e2e/auth-account-regression-v2319.spec.ts --workers=1
.\agent.ps1 BOOKING
```

برای تست واقعی SMS/OTP نیز در صورت آماده بودن شماره تست:

```powershell
.\agent.ps1 SMS
```

و برای Verify/Login واقعی:

```powershell
.\agent.ps1 SMSLOGIN
```

## تست دستی پیشنهادی
1. در `/book` تا مرحله اطلاعات و آدرس بروید.
2. شماره موبایل را وارد کنید و فقط یک بار «تأیید شماره» را بزنید.
3. دکمه باید در حالت ارسال قفل شود.
4. پس از موفقیت، countdown ۶۰ ثانیه‌ای برای ارسال مجدد دیده شود.
5. در Network فقط یک درخواست `POST /auth/v1/otp` برای یک کلیک مشاهده شود.
6. در Supabase > Edge Functions > `send-sms-hook` خطای `sms_logs insert failed` نباید دیده شود.
7. Query زیر باید ردیف جدید `sent` یا `failed` با `provider_response` داشته باشد:

```sql
select phone, status, provider, template_key, provider_response, created_at
from public.sms_logs
order by created_at desc
limit 10;
```

## نکته مهم
`200 OK` از Supabase Auth یعنی درخواست OTP پذیرفته شده است. این پچ با ثبت پاسخ Kavenegar کمک می‌کند مشخص شود درخواست Provider پذیرفته شده یا رد شده؛ تحویل نهایی توسط اپراتور موبایل مرحله جداگانه‌ای است.
