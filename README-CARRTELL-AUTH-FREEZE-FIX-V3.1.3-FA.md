# اصلاح گیرکردن ورود Carrtell V3.1.3

این پچ گیرکردن دائمی دکمه ورود مشتری و ادمین را برطرف می‌کند.

- ورود مشتری با شماره موبایل مستقیماً از Supabase Auth انجام می‌شود.
- نام کاربری سفارشی همچنان از `customer-credentials` استفاده می‌کند.
- همه درخواست‌های ورود timeout دارند و رابط کاربری برای همیشه قفل نمی‌ماند.
- ورود ادمین ابتدا مسیر مستقیم را امتحان می‌کند و حساب‌های قدیمی را از مسیر سازگاری همگام می‌کند.
- ایجنت، بازشدن دوباره دکمه پس از خطای ورود را برای مشتری و ادمین تست می‌کند.

## نصب

فایل ZIP را در ریشه پروژه Extract و Replace کنید.

Edge Function به‌روزشده را اجرا کنید:

```powershell
npx supabase functions deploy customer-credentials --no-verify-jwt
```

سپس:

```powershell
npm run typecheck
npm run build
.\agent-category.ps1
```

SQL ندارد.
