# README فارسی — Carrtell V5.0.1

## هدف
رفع خطای Persona در صفحه `/download` پس از V5.0.

در V5.0 اپ سرویس‌کار از PWA عمومی جدا شده بود، اما یک متن توضیحی با عبارت «اپ سرویس‌کار Carrtell» هنوز در صفحه عمومی دانلود باقی مانده بود. تست Persona عمداً انتظار دارد صفحه عمومی فقط اپ مشتری را نمایش دهد.

## تغییر واقعی
فقط فایل زیر تغییر کرده است:

- `src/pages/DownloadsPage.tsx`

متن مربوط به اپ سرویس‌کار از صفحه عمومی دانلود حذف شده است. پروژه Android سرویس‌کار، مسیرهای Driver، SMS و Backend دست نخورده‌اند.

## SQL
ندارد.

## نصب
ZIP را در ریشه پروژه Extract و Replace کنید.

سپس:

```powershell
npm run typecheck
npm run build

$env:CARRTELL_ADMIN_USERNAME="admin"
$env:CARRTELL_ADMIN_PASSWORD="12345678"
$env:CARRTELL_TECH_USERNAME="service"
$env:CARRTELL_TECH_PASSWORD="12345678"

.\agent.ps1 PERSONAS
```

در صورت PASS شدن، `dist` جدید را روی `public_html` جایگزین کنید.

## تست دستی
- `/download` باید فقط اپ فروشگاه Carrtell را نمایش دهد.
- هیچ کارت یا متن عمومی برای «اپ سرویس‌کار Carrtell» در این صفحه نباشد.
- پنل سرویس‌کار همچنان از `/driver/login` و پروژه Android مستقل استفاده می‌کند.
