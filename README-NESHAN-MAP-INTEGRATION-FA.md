# اتصال نقشه نشان به Carrtell — Sprint Neshan Map v1

این Patch روی ساختار واقعی ZIP کامل `project(20260819-122809).zip` ساخته شده است.

## هدف Sprint

- حذف Leaflet CDN و fallback مستقیم OpenStreetMap از `MapLocationPicker`.
- استفاده از SDK رسمی MapLibre نشان برای نمایش نقشه وب.
- استفاده فقط از `VITE_NESHAN_WEB_API_KEY` در Frontend.
- حذف استفاده مستقیم از کلید سرویس نشان در مرورگر.
- ساخت Edge Function امن `neshan-reverse-geocode` برای تبدیل مختصات به آدرس.
- نگهداری کلید `NESHAN_SERVICE_API_KEY` فقط در Supabase Edge Function Secrets.
- حفظ خروجی فعلی کامپوننت: `latitude`, `longitude`, `address`.

## فایل‌های واقعی تغییرکرده

1. `src/components/MapLocationPicker.tsx`
2. `supabase/functions/neshan-reverse-geocode/index.ts`
3. `.env.example`

## پیش‌نیازهایی که قبلاً انجام شده

### 1) نصب SDK

```powershell
npm install @neshan-maps-platform/maplibre-sdk@5.24.4
```

### 2) فایل `.env`

در فایل واقعی `.env` باید این مقدار وجود داشته باشد:

```env
VITE_NESHAN_WEB_API_KEY=کلید Carrtell Web Map
```

کلید واقعی را داخل Git یا فایل README قرار ندهید.

### 3) Supabase Secret

در Supabase > Edge Functions > Secrets:

```text
NESHAN_SERVICE_API_KEY
```

باید برابر کلید `Carrtell Booking Services` باشد.

## نصب Patch

محتویات ZIP را در ریشه پروژه Merge کنید:

```text
D:\carrtell\Carrtell-v0.2-current\project
```

فایل‌های هم‌نام را Replace کنید.

## Deploy کردن Edge Function

از ریشه پروژه:

```powershell
npx supabase functions deploy neshan-reverse-geocode --no-verify-jwt
```

دلیل `--no-verify-jwt`: مرحله رزرو Carrtell برای مشتری مهمان نیز قابل استفاده است و Reverse Geocode نباید کاربر را مجبور به ورود کند. کلید Neshan همچنان فقط داخل Secret سمت سرور قرار دارد.

## Build و تست

```powershell
npm run typecheck
npm run build
.\agent.ps1 VISUAL
.\agent.ps1 BOOKING
```

برای تست دستی:

1. `/book` را روی موبایل باز کنید.
2. به مرحله آدرس برسید.
3. نقشه نشان باید نمایش داده شود.
4. نقشه را حرکت دهید؛ نشانگر زرد باید وسط نقشه ثابت بماند.
5. بعد از توقف نقشه، متن «در حال دریافت آدرس...» نمایش داده شود و سپس آدرس نشان ظاهر شود.
6. «موقعیت فعلی من» را بزنید و Permission مرورگر را Allow کنید.
7. «تأیید این موقعیت» را بزنید.
8. ادامه رزرو و Summary را بررسی کنید.

## تست مستقیم Edge Function

بعد از Deploy می‌توانید از داخل سایت تست کنید. برای تست با curl/PowerShell نیازی به ارسال Secret نشان نیست؛ فقط Function را از Frontend فراخوانی کنید.

## SQL

این Sprint **SQL ندارد**.

## امنیت

- `NESHAN_SERVICE_API_KEY` وارد Frontend نشده است.
- `VITE_NESHAN_WEB_API_KEY` کلید مخصوص Web Map است و در Build مرورگر قابل مشاهده خواهد بود؛ این رفتار برای کلید Web SDK طبیعی است و باید در پنل نشان به دامنه‌های Carrtell محدود باشد.
- Originهای Edge Function به `carrtell.ir`, `www.carrtell.ir`, `localhost` و `127.0.0.1` برای Development محدود شده‌اند.
- هیچ کلید Supabase Service Role، Kavenegar یا پرداخت در Frontend اضافه نشده است.

## نکته درباره جستجوی متنی

در این Sprint عمداً Search API اضافه نشده است. کلید سرویس فعلی برای Reverse Geocoding استفاده می‌شود. جستجوی نام خیابان/محله را در Sprint جداگانه اضافه می‌کنیم تا Endpoint و سهمیه آن مستقل تست شود.
