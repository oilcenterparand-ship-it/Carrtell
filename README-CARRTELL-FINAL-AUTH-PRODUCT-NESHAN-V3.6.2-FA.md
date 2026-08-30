# نصب نهایی Carrtell V3.6.2

این ZIP مستقل و تجمیعی است. نسخه‌های V3.6.0 و V3.6.1 را نصب نکنید.

## موارد اصلاح‌شده

- ورود مدیر روی مرورگر و دستگاه جدید، بدون وابستگی به نشست قبلی Chrome/Google
- Tooltip محصول فقط شامل نام کامل و قیمت
- پس‌زمینه سفید پشت PNG/WebP شفاف محصولات
- محاسبه کرایه سمت سرور از مبدأ آزادگان × بزرگراه ساوه
- Routing با ترافیک به‌عنوان سرویس اصلی
- Distance Matrix با ترافیک به‌عنوان سرویس پشتیبان خودکار
- پیام فارسی دقیق برای خطای SQL، کلید، Whitelist، اعتبار و سرویس نشان

## ۱. سرویس‌های نشان

در کلید `Carrtell Booking Services` با شروع `service.` این موارد فعال بمانند:

- `تبدیل آدرس به نقطه`
- `تبدیل نقطه به آدرس`
- `ماتریس فاصله با در نظر گرفتن ترافیک + تخمین زمان رسیدن`
- `مسیریابی با در نظر گرفتن ترافیک + تخمین زمان رسیدن`

فعال‌بودن `مسیریابی پیش‌بینی بر پایه الگوهای ترافیکی گذشته` مشکلی ندارد، ولی برای مبلغ کرایه لحظه‌ای استفاده نمی‌شود.

## ۲. استخراج پچ

ZIP را داخل ریشه پروژه قرار دهید:

```powershell
cd "D:\carrtell\Carrtell-v0.2-current\project"

Expand-Archive `
  -LiteralPath ".\CARRTELL-FINAL-AUTH-PRODUCT-NESHAN-V3.6.2.zip" `
  -DestinationPath "." `
  -Force
```

## ۳. اجرای SQL

در Supabase Dashboard به `SQL Editor → New query` بروید. محتوای فایل زیر را کامل اجرا کنید:

```text
supabase/manual/CARRTELL_SERVICE_TRAVEL_PRICING_SAFE.sql
```

## ۴. ثبت Service Key

فقط کلید `Carrtell Booking Services` با شروع `service.` را استفاده کنید:

```powershell
npx supabase secrets set NESHAN_SERVICE_API_KEY="کلید کامل service."
```

کلید `web.` فقط برای نمایش نقشه Frontend است و نباید جای Service Key قرار بگیرد.

## ۵. انتشار Edge Functionها

```powershell
npx supabase functions deploy staff-password-login --no-verify-jwt
npx supabase functions deploy service-travel-estimate --no-verify-jwt
```

## ۶. ساخت نسخه سایت

```powershell
npm run typecheck
npm run build
```

## ۷. انتشار و تست

محتویات `dist` را روی `public_html` جایگزین کنید؛ `.htaccess` را حذف نکنید. سپس `Ctrl + Shift + R` بزنید.

تست‌ها:

1. ورود `/admin/login` در Incognito یا دستگاه دوم
2. Tooltip کارت محصول: فقط نام و قیمت
3. عکس شفاف محصول: پس‌زمینه سفید
4. انتخاب موقعیت داخل تهران در `/book`: نمایش فاصله و کرایه

## قانون کرایه

- پایه: ۲۰۰٬۰۰۰ تومان
- هر کیلومتر مسیر: ۱۰٬۰۰۰ تومان
- شعاع مجاز: ۴۰ کیلومتر از مرکز تهران
- مقصد داخل طرح ترافیک: ۳۰٪ افزایش
