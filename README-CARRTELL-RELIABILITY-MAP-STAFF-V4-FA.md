# Sprint Carrtell V4 — پایداری OTP، نقشه نشان، ورود مدیریت و سرویس‌کار

این Patch فقط بر اساس ZIP کامل `project(20260819-191922).zip` ساخته شده است.

## تغییرات

### 1) رزرو سرویس و OTP
- OTP دیگر گلوگاه رزرو و پرداخت نیست.
- پس از درخواست موفق، اگر تا ۲۰ ثانیه کد نرسد گزینه «ادامه بدون کد تأیید» ظاهر می‌شود.
- اگر ارسال OTP خطا بدهد، گزینه ادامه بدون OTP بلافاصله فعال می‌شود.
- وضعیت تأیید شماره داخل Note درخواست سرویس ثبت می‌شود.
- ارسال مجدد ۶۰ ثانیه‌ای باقی مانده و دوبارکلیک مهار می‌شود.

### 2) حساب کاربری
- ورود پیامکی حفظ شده است.
- زمان ارسال مجدد از ۱۲۰ به ۶۰ ثانیه کاهش یافت.
- در خطای SMS کاربر صریحاً به مسیر «نام کاربری و رمز» هدایت می‌شود تا پیامک مانع ورود نشود.

### 3) نقشه نشان
- Reverse geocode با debounce 450ms اجرا می‌شود تا با حرکت نقشه درخواست‌های تکراری کم شود.
- جستجوی مکان/فروشگاه/خیابان/POI اضافه شد.
- Search از Edge Function `neshan-search` و Secret موجود `NESHAN_SERVICE_API_KEY` استفاده می‌کند.
- اگر Search در حساب نشان فعال نباشد، نقشه و انتخاب دستی همچنان کار می‌کنند.

### 4) مدیریت و سرویس‌کار
- مسیر `/admin/login` و `/driver/login` با نام کاربری/رمز مستقل از SMS کار می‌کنند.
- مقدار اولیه هر دو نقش: `admin / admin`.
- رمز در Frontend ذخیره نمی‌شود؛ فقط SHA-256 آن در جدول `staff_login_settings` ذخیره می‌شود.
- از `/admin/settings` می‌توان نام کاربری و رمز هر دو نقش را تغییر داد.

> `admin/admin` فقط برای راه‌اندازی موقت است و باید بعد از تأیید تست تغییر کند.

## نصب
1. محتویات Patch را در ریشه پروژه Merge/Replace کنید.
2. SQL زیر را در Supabase SQL Editor اجرا کنید:
   `supabase/migrations/202608190004_staff_login_settings.sql`
3. Edge Functionها را Deploy کنید:

```powershell
npx supabase functions deploy staff-password-login --no-verify-jwt
npx supabase functions deploy neshan-search --no-verify-jwt
npx supabase functions deploy neshan-reverse-geocode --no-verify-jwt
npx supabase functions deploy send-sms-hook --no-verify-jwt
```

4. اگر جستجوی نشان در پنل Neshan برای کلید `Carrtell Booking Services` قابل فعال شدن است، Search/جستجو را فعال کنید. در غیر این صورت قابلیت انتخاب دستی نقشه بدون مشکل باقی می‌ماند.

## تست

```powershell
npm run typecheck
npm run build
.\agent.ps1 VISUAL
.\agent.ps1 BOOKING
.\agent.ps1 PERSONAS
```

تست دستی:
- رزرو: OTP را درخواست کن و بدون وارد کردن کد ۲۰ ثانیه صبر کن؛ باید ادامه بدون OTP ممکن باشد.
- حساب کاربری: خطای SMS نباید مسیر ورود با نام کاربری/رمز را ببندد.
- نقشه: نام یک فروشگاه/مکان را جستجو کن و نتیجه را انتخاب کن.
- مدیریت: `/admin/login` با `admin/admin`.
- سرویس‌کار: `/driver/login` با `admin/admin`.

## Build در محیط تحویل
`npm run typecheck` روی سورس Patch شده PASS شد. Build در کانتینر تحویل به دلیل Permission فایل `vite` داخل node_modules ویندوزی قابل اجرا نبود؛ Build نهایی را روی Windows پروژه اجرا کنید.
