# Carrtell RC1-01B — احراز هویت، کاوه‌نگار و استقرار

این پچ ورود OTP واقعی Supabase را با Send SMS Hook و الگوی کاوه‌نگار `carrtelllogin` تکمیل می‌کند. نقش‌ها از جدول `profiles` خوانده می‌شوند و مسیرهای ادمین، تکنسین و پروفایل محافظت شده‌اند.

## 1) جایگذاری فایل‌ها
محتویات ZIP را روی ریشه پروژه کپی و فایل‌های هم‌نام را Replace کنید. از پروژه قبلی بکاپ بگیرید. `node_modules` داخل پچ نیست.

## 2) اجرای Migration
در Supabase > SQL Editor فایل زیر را اجرا کنید:
`supabase/migrations/202607230002_rc1_01b_auth_kavenegar.sql`

## 3) تنظیم Phone Auth
در Supabase > Authentication > Sign In / Providers، Phone را Enable کنید. سپس Authentication > Hooks یک Send SMS Hook از نوع HTTPS بسازید.

## 4) Deploy تابع
Supabase CLI را نصب و وارد حساب شوید، سپس در ریشه پروژه:
```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set KAVENEGAR_API_KEY="کلید-واقعی"
supabase secrets set KAVENEGAR_TEMPLATE="carrtelllogin"
supabase secrets set SEND_SMS_HOOK_SECRET="SECRET_GENERATED_BY_SUPABASE"
supabase functions deploy send-sms-hook --no-verify-jwt
```
آدرس Hook:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms-hook`
Secret تولیدشده هنگام ساخت Hook را با همان مقدار در `SEND_SMS_HOOK_SECRET` ذخیره کنید.

## 5) تنظیم سایت
فایل `.env.example` را به `.env` کپی و مقادیر Supabase را وارد کنید. کلید کاوه‌نگار هرگز در `.env` فرانت‌اند قرار نگیرد.

## 6) تست RC1-01B
1. `/login-otp` را باز کنید و شماره 09 وارد کنید.
2. پیامک الگوی `carrtelllogin` باید برسد.
3. کد را وارد کنید و وارد سایت شوید.
4. صفحه را Refresh کنید؛ ورود باید حفظ شود.
5. کاربر عادی با رفتن به `/admin` باید به `/unauthorized` هدایت شود.
6. نقش ادمین را فقط از SQL Editor تغییر دهید:
```sql
update public.profiles set role='admin' where phone='+989xxxxxxxxx';
```
7. دوباره وارد `/admin` شوید؛ باید باز شود.
8. خروج را بزنید و Refresh کنید؛ Session نباید باقی بماند.

## 7) DirectAdmin
```powershell
npm install
npm run typecheck
npm run build
```
فقط محتویات پوشه `dist` را داخل `public_html` آپلود کنید. فایل `.htaccess` همراه build از `public/` به `dist/` منتقل می‌شود. SSL دامنه و Force HTTPS را فعال کنید.

## نکات امنیتی
- API Key کاوه‌نگار فقط Supabase Secret است.
- نقش کاربر در localStorage تعیین نمی‌شود.
- اولین کاربر خودکار ادمین نمی‌شود؛ نقش ادمین را دستی و امن تعیین کنید.
- جدول لاگ پیامک فقط برای ادمین قابل خواندن است.
