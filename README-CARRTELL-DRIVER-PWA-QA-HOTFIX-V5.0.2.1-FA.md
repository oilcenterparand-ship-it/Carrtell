# Carrtell V5.0.2.1 — Driver PWA QA Hotfix

این Hotfix فقط تست Persona سرویس‌کار را با رفتار جدید V5.0.2 هماهنگ می‌کند.

در V5.0.2 عمداً Manifest مستقل Driver روی مسیرهای `/driver/*` اضافه شده است تا Add to Home Screen با نام `Carrtell Driver` و Start URL مستقل Driver ساخته شود. تست قدیمی هنوز انتظار داشت هیچ Manifestای وجود نداشته باشد و در همان فایل چند خط پایین‌تر برعکس، وجود `/driver.webmanifest` را بررسی می‌کرد.

## فایل تغییرکرده
- `tests/e2e/persona-technician.spec.ts`

## SQL / Edge Function
ندارد.

## نصب
ZIP را در ریشه پروژه Extract/Replace کنید و فقط اجرا کنید:

```powershell
.\agent.ps1 PERSONAS
```

Build مجدد برای این Hotfix لازم نیست چون Runtime تغییر نکرده است.
