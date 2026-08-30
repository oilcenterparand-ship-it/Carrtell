# Carrtell V3.7.2 — فیلدهای پنل و لیست اقلام سرویس‌کار

## تغییرات

- کادر و Focus واضح برای input، select و textarea پنل مدیریت.
- نمایش نام و تعداد تمام اقلام داخل کارت سفارش‌های مدیریت.
- نمایش اقلام در داشبورد و صف تخصیص روزانه سرویس‌کار.
- نمایش «اقلام قابل تحویل از انبار» در کارت مأموریت و جزئیات مأموریت سرویس‌کار.
- دسترسی امن: سرویس‌کار فقط اقلام مأموریتی را می‌بیند که به خودش تخصیص داده شده است.
- اصلاح خواندن `product_name` در صف تخصیص.
- شامل CSS نهایی Mega Menu V3.7.1 نیز هست.

## نصب

ZIP را در ریشه پروژه Extract و Replace کنید:

`D:\carrtell\Carrtell-v0.2-current\project`

## SQL اجباری

محتوای فایل زیر را در Supabase SQL Editor اجرا کنید:

`supabase/migrations/202608290002_driver_order_items_secure.sql`

## تست

```powershell
cd "D:\carrtell\Carrtell-v0.2-current\project"
npm run typecheck
npm run build
.\agent.ps1 ADMIN
.\agent.ps1 TECHNICIAN
```

Deploy مجدد Edge Function لازم نیست.
