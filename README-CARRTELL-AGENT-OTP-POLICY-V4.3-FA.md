# Carrtell Agent OTP Policy Hotfix V4.3

مبنای این پچ: ZIP کامل `project(20260819-201932).zip` به‌علاوه Hotfix V4.2 که بعد از آن روی پروژه اعمال شد.

## علت خطا
تست Critical User Journeys هنوز سیاست قدیمی «OTP اجباری» را enforce می‌کرد و دنبال placeholder قدیمی `کد تأیید ... اجباری` می‌گشت، در حالی که UI فعلی OTP را اختیاری کرده و در خرابی سرویس پیامکی اجازه ادامه بدون OTP می‌دهد.

## تغییر
فقط تست E2E به سیاست جدید هماهنگ شده است:
- درخواست OTP عمداً با خطای 503 شبیه‌سازی می‌شود.
- Agent بررسی می‌کند درخواست OTP واقعاً انجام شده است.
- دکمه «ادامه بدون کد تأیید» باید فوراً ظاهر شود.
- Agent بررسی می‌کند verify OTP انجام نشده است.
- رزرو باید تا صفحه پرداخت و موفقیت پرداخت ادامه پیدا کند.

این تست عمداً سناریوی بدترین حالت پیامک را بررسی می‌کند: خرابی SMS نباید خرید/رزرو را متوقف کند.

## نصب
فایل‌های ZIP را در ریشه پروژه Merge/Replace کنید:
`D:\carrtell\Carrtell-v0.2-current\project`

## SQL / Deploy
ندارد. هیچ Edge Function یا Secret تغییر نکرده است.

## تست
```powershell
npm run typecheck
npm run build
.\agent.ps1 BOOKING
```
اگر BOOKING پاس شد:
```powershell
.\agent.ps1 PERSONAS
```
