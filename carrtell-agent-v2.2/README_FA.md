# README فارسی — Carrtell Agent v2.2

این Sprint بر اساس ShopPage و CartPage واقعی ارسالی ساخته شده است.

## هدف
- تست واقعی Shop → Cart
- تست انتخاب خودرو در فروشگاه
- تست دسترسی مهمان به سبد
- تست مسیر لینک محصول داخل Cart
- تست الزام نکردن ورود قبل از پرداخت مطابق تصمیم محصول
- تست overflow موبایل
- UX signal اولیه برای اندازه targetهای لمسی

## نصب
پوشه `carrtell-agent-v2.2` را داخل ریشه project قرار دهید:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
& ".\carrtell-agent-v2.2\install-agent-v2.2.ps1"
.\agent.ps1 SHOP
```

اگر SHOP Fail داشت، خروجی را ارسال کنید. Fail در این Sprint می‌تواند عمداً یک Bug/UX requirement واقعی را آشکار کند.

## سپس
```powershell
.\agent.ps1 UX
```

بعد از بررسی Failها:
```powershell
.\agent.ps1 CUSTOMER
```

## SQL
ندارد.

## فایل محصول
هیچ فایل src تغییر نمی‌کند.

## نکته
تست checkout در v2.2 انتظار دارد کاربر مهمان قبل از payment مجبور به Login/OTP نشود. اگر سورس فعلی redirect کند، تست Fail خواهد شد و به عنوان Gap نسبت به نیاز محصول گزارش می‌شود.
