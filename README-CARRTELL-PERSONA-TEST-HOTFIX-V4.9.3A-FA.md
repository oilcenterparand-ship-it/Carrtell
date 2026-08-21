# Carrtell V4.9.3A — Hotfix تست Persona سرویس‌کار

این Hotfix فقط خطای Syntax تست Playwright را رفع می‌کند. در فایل `tests/e2e/persona-technician.spec.ts` بلوک بررسی `nextAction` دوبار پشت سر هم قرار گرفته بود و متغیر `const nextAction` دوباره تعریف می‌شد.

## نصب
ZIP را در ریشه پروژه Extract و Replace کنید.

## SQL
ندارد.

## Build
نیازی به Build مجدد برای این Hotfix نیست چون کد Runtime سایت تغییر نکرده است.

## تست
با همان Environment Variables قبلی فقط اجرا کنید:

```powershell
.\agent.ps1 PERSONAS
```

اگر Persona QA پاس شد، همان `dist` قبلی که Build آن موفق بوده معتبر است.
