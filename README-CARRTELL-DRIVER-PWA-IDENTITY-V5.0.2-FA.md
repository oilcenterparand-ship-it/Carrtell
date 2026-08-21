# Carrtell V5.0.2 — Driver PWA Identity

## هدف
رفع مشکل Add to Home Screen سرویس‌کار که بعد از اجرا فروشگاه را باز می‌کرد، و جداسازی هویت نصب Carrtell و Carrtell Driver.

## رفتار جدید
- صفحات `/driver/*` فقط `driver.webmanifest` را معرفی می‌کنند.
- Driver PWA دارای `id=/driver/`, `scope=/driver/`, `start_url=/driver/login?source=driver-pwa` است.
- نام نصب سرویس‌کار `Carrtell Driver` است.
- عنوان و Apple Web App Title در صفحات Driver نیز `Carrtell Driver` می‌شود.
- Apple touch icon در صفحات Driver از آیکون Driver استفاده می‌کند.
- اپ مشتری همچنان `Carrtell` و Manifest عمومی خودش را دارد.
- صفحه عمومی `/download` فقط اپ مشتری را نمایش می‌دهد.
- نصب Driver فقط از داخل پنل سرویس‌کار انجام می‌شود.
- آیکون‌های هر دو اپ با نشان Carrtell بزرگ‌تر و خواناتر ساخته شده‌اند؛ Driver یک Badge سبز مستقل دارد.

## نصب
Patch را در ریشه پروژه Extract/Replace کنید.

SQL: ندارد.
Edge Function: ندارد.

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

بعد از PASS، `dist` را روی `public_html` جایگزین کنید.

## تست موبایل مهم
اگر قبلاً Carrtell Driver یا Carrtell به Home Screen اضافه شده، Shortcut قدیمی را حذف کنید و بعد از انتشار نسخه جدید دوباره از داخل `/driver/` نصب کنید. Shortcut قدیمی start URL قبلی را نگه می‌دارد و با Deploy تغییر نمی‌کند.
