# Hotfix V4.9.2.1 — تست Persona سرویس‌کار

این Hotfix فقط خطای Syntax تست Playwright را اصلاح می‌کند.

## مشکل
در فایل `tests/e2e/persona-technician.spec.ts` بلوک بررسی «اقدام بعدی» دو بار پشت سر هم کپی شده بود و متغیر `nextAction` دوبار با `const` تعریف می‌شد. در نتیجه Playwright قبل از اجرای تست‌ها با خطای زیر متوقف می‌شد:

`Identifier 'nextAction' has already been declared.`

## تغییر
بلوک تکراری حذف شده است. هیچ فایل Runtime، دیتابیس، Supabase Function یا Frontend تغییر نکرده است.

## نصب
محتویات ZIP را در ریشه پروژه Extract و Replace کنید.

سپس فقط اجرا کنید:

```powershell
.\agent.ps1 PERSONAS
```

نیازی به `npm run build` مجدد نیست، چون فایل تغییرکرده فقط تست E2E است.

## SQL
ندارد.
