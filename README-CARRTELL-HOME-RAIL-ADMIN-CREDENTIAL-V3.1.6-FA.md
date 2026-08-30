# اصلاح نوار دسته‌بندی خانه و ورود واقعی Agent ادمین — V3.1.6

این Patch بر پایه Commit `c368391` از Branch `sprint/guest-checkout-search-car-picker` آماده شده است.

## تغییرات

- نوار دسته‌بندی جمع‌وجور فقط در صفحه اصلی `/` نمایش داده می‌شود.
- صفحه `/shop` همچنان Mega Menu داینامیک خودش را استفاده می‌کند.
- نوار عمومی در فروشگاه، پرداخت و جزئیات محصول نمایش داده نمی‌شود.
- Agentهای اصلی و دسته‌بندی برای اجرای Persona Admin نام کاربری واقعی را دریافت می‌کنند.
- رمز با `Read-Host -AsSecureString` دریافت و فقط به Environment همان اجرای Agent منتقل می‌شود.
- نام کاربری و رمز در `finally` پاک می‌شوند.
- fallback فرضی `admin/admin` در تست Persona Admin وجود ندارد.
- Regression دسکتاپ و موبایل برای نوار دسته‌بندی اضافه شده است.

## نصب

1. از پروژه نسخه پشتیبان بگیرید.
2. ZIP را مستقیماً در ریشه پروژه Extract کنید و Replace را تأیید کنید.
3. مسیر ریشه همان پوشه‌ای است که `package.json` و `agent.ps1` در آن قرار دارند.
4. SQL و Deploy مجدد Edge Function برای این Patch لازم نیست.

## تست در PowerShell

```powershell
cd "D:\carrtell\Carrtell-v0.2-current\project"
npm run typecheck
npm run build
.\agent-category.ps1
```

در شروع `agent-category.ps1` نام کاربری واقعی ادمین و سپس رمز مخفی درخواست می‌شود. رمز را داخل ChatGPT، فایل یا Command History وارد نکنید.

برای تست مستقیم Agent اصلی:

```powershell
.\agent.ps1 ADMIN
```

## انتشار روی هاست

پس از Build فقط خروجی جدید `dist` را منتشر کنید. محتوای جدید `assets` و `index.html` جایگزین شود؛ `.htaccess`، `cgi-bin`، فایل اینماد و فایل‌های اختصاصی هاست حذف نشوند.
