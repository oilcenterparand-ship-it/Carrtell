# Carrtell RC1-01 — Authentication & Authorization

این Sprint احراز هویت و کنترل دسترسی Carrtell را از حالت محلی/نمایشی به Session واقعی Supabase تبدیل می‌کند.

## قابلیت‌های تکمیل‌شده

- ورود و ثبت‌نام خودکار با OTP موبایل Supabase
- نگهداری Session در مرورگر
- Refresh خودکار Access Token توسط Supabase Client
- Refresh دستی Session در Auth Context
- خروج امن و پاک‌سازی اطلاعات محلی سبد/Checkout
- نقش‌های استاندارد `customer`، `technician` و `admin`
- ساخت خودکار Profile برای هر کاربر جدید
- تبدیل نقش قدیمی `driver` به `technician`
- Protected Route عمومی
- Admin Guard و Technician Guard
- صفحه `/unauthorized`
- Loading State سراسری احراز هویت
- جلوگیری از تغییر نقش و فعال‌بودن حساب توسط خود کاربر
- ثبت تاریخچه تغییر نقش مدیران در `auth_role_audit`
- RLS کامل جدول‌های مرتبط با احراز هویت

## نصب

### ۱. جایگزینی سورس

محتویات پوشه پروژه داخل ZIP را در مسیر زیر جایگزین کنید:

```text
D:\carrtell\Carrtell-v0.2-current\project
```

فایل `.env` فعلی خودتان را نگه دارید. ZIP فایل محرمانه `.env` ندارد.

### ۲. نصب وابستگی‌ها

PowerShell را در پوشه پروژه باز کنید:

```powershell
cd D:\carrtell\Carrtell-v0.2-current\project
npm install
```

### ۳. اجرای Migration

در Supabase وارد بخش **SQL Editor** شوید و محتوای فایل زیر را یک‌بار اجرا کنید:

```text
supabase/migrations/202607230001_rc1_01_authentication.sql
```

Migration اطلاعات فعلی جدول `profiles` را حذف نمی‌کند و نقش قدیمی `driver` را به `technician` تبدیل می‌کند.

### ۴. فعال‌سازی Phone Auth

در Supabase:

1. مسیر `Authentication > Providers > Phone` را باز کنید.
2. Phone Provider را فعال کنید.
3. ارائه‌دهنده پیامک مورد پشتیبانی Supabase را تنظیم کنید.
4. طول OTP را روی ۶ رقم و زمان انقضا را طبق نیاز تنظیم کنید.

تا قبل از تنظیم Provider واقعی، Supabase پیامک واقعی ارسال نمی‌کند. این Sprint عمداً کد OTP را در مرورگر تولید یا نمایش نمی‌دهد.

### ۵. تعیین اولین مدیر

ابتدا با شماره مدیر یک‌بار از سایت وارد شوید تا Profile ساخته شود. سپس در SQL Editor اجرا کنید:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where phone = '+98912XXXXXXX';
```

شماره را با فرمت بین‌المللی واقعی مدیر جایگزین کنید. پس از تغییر نقش، یک‌بار Logout/Login انجام دهید.

### ۶. اجرای پروژه

```powershell
npm run dev
```

برای کنترل نهایی:

```powershell
npm run typecheck
npm run build
```

## مسیرهای محافظت‌شده

- تمام مسیرهای `/admin/*`: فقط `admin`
- `/driver`، `/driver/dashboard` و `/driver/jobs/:id`: فقط `technician`
- پروفایل، اعلان‌ها و داشبورد مشتری: کاربران واردشده

## تست پذیرش

1. کاربر جدید با موبایل وارد شود و Session بعد از Refresh صفحه باقی بماند.
2. رکورد کاربر با نقش `customer` در `profiles` ساخته شود.
3. مشتری هنگام ورود به `/admin` به `/unauthorized` منتقل شود.
4. تکنسین به پنل تکنسین دسترسی داشته باشد و به ادمین دسترسی نداشته باشد.
5. مدیر به تمام مسیرهای ادمین دسترسی داشته باشد.
6. Logout باعث حذف Session و انتقال مجدد مسیر محافظت‌شده به صفحه ورود شود.
7. کاربر عادی نتواند با درخواست مستقیم نقش خودش را تغییر دهد.

## نکات امنیتی

- `VITE_SUPABASE_ANON_KEY` برای Frontend است؛ `service_role` را هرگز در Vite یا مرورگر قرار ندهید.
- نقش از جدول محافظت‌شده `profiles` خوانده می‌شود، نه از `localStorage`.
- Guard سمت React فقط تجربه کاربری را کنترل می‌کند؛ امنیت داده با RLS انجام می‌شود.
- برای جدول‌های هر Sprint بعدی نیز Policy اختصاصی همان ماژول اضافه خواهد شد.
