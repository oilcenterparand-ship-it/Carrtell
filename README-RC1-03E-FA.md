# RC1-03E — تعمیر قطعی Super Admin

این پچ مشکل انتقال خودکار `/admin/setup` به `/admin/login` را رفع می‌کند.

علت خطا این بود که وجود هر رکورد در `admin_accounts` باعث بسته‌شدن Setup می‌شد، حتی اگر آن رکورد فعال یا Super Admin نبود.

## نصب

1. فایل‌های پچ را در ریشه پروژه Replace کنید.
2. فایل زیر را کامل در Supabase SQL Editor اجرا کنید:

`supabase/migrations/202607230007_rc1_03e_admin_recovery.sql`

3. سرور Vite را یک‌بار متوقف و دوباره اجرا کنید:

```powershell
Ctrl + C
npm run dev
```

4. در مرورگر به این آدرس بروید:

`http://localhost:5173/admin/setup`

5. نام کاربری قبلی (`aminoraei`) و یک رمز جدید حداقل ۱۰ کاراکتری وارد کنید.

بعد از تکمیل، حساب قبلی تعمیر، فعال و به نقش Owner/Super Admin تبدیل می‌شود و صفحه Setup قفل خواهد شد.
