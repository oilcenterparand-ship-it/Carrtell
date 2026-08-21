# Carrtell Driver Auth / Route Audit Hotfix V4.1

این هات‌فیکس برای نسخه‌ای است که Sprint `CARRTELL-RELIABILITY-MAP-STAFF-V4` روی آن نصب شده است.

## مشکل
بعد از اضافه شدن ورود مستقل سرویس‌کار، مسیر `/driver` برای کاربر ناشناس باید به `/driver/login` هدایت شود. تست قدیمی Route Audit هنوز `/driver` را یک صفحه عمومی مستقیم فرض می‌کرد و در زمان Redirect ممکن بود `body` را hidden تشخیص دهد و تست را Fail کند.

## تغییرات
- Route Audit اکنون رفتار صحیح `/driver -> /driver/login` را بررسی می‌کند.
- تست Persona سرویس‌کار مستقیماً از `/driver/login` و فرم جدید استفاده می‌کند.
- تست‌های Admin و Technician به طور پیش‌فرض از `admin/admin` استفاده می‌کنند؛ در صورت تنظیم Environment Variable همان مقدار جایگزین می‌شود.
- صفحه ورود سرویس‌کار هنگام Mount هر Scroll Lock باقی‌مانده از Drawer/Modal قبلی را پاک می‌کند.

## SQL / Edge Function
هیچ SQL یا Deploy جدیدی لازم نیست.

## نصب
محتویات ZIP را در ریشه پروژه Merge/Replace کنید.

## تست
```powershell
npm run typecheck
npm run build
.\agent.ps1 BOOKING
.\agent.ps1 PERSONAS
```

انتظار:
- Route Audit بدون Fail مربوط به `/driver`
- Technician anonymous protection پاس
- Technician authenticated login با admin/admin پاس
- Admin authenticated login با admin/admin پاس
