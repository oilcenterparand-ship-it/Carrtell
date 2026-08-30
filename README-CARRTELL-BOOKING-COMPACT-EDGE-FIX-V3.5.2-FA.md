# Carrtell V3.5.2 — رزرو جمع‌وجور و اتصال محاسبه کرایه

## تغییرات

- تمام شش مرحله رزرو در موبایل و دسکتاپ حدود ۱۰ تا ۱۲ درصد جمع‌وجورتر شده‌اند.
- حداقل اندازه قابل لمس دکمه‌ها حفظ شده است.
- پیام خام انگلیسی Edge Function با پیام فارسی مناسب جایگزین شده است.
- تابع `service-travel-estimate` برای Deploy مجدد داخل پچ قرار دارد.

## نصب

ZIP را در ریشه پروژه Extract و Replace کنید، سپس:

```powershell
npx supabase functions deploy service-travel-estimate --no-verify-jwt
npm run typecheck
npm run build
.\agent.ps1 BOOKING
```

Secret زیر باید قبلاً روی Supabase تنظیم شده باشد:

```text
NESHAN_SERVICE_API_KEY
```

Secret را داخل Frontend، ZIP، GitHub یا چت قرار ندهید. این هات‌فیکس SQL جدید ندارد.
