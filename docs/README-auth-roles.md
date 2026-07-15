# پچ نقش‌ها و دسترسی‌ها

این پچ زیرساخت نقش‌ها را اضافه می‌کند:

- admin: دسترسی به `/admin`
- driver: دسترسی به `/driver`
- customer: دسترسی به پروفایل و خرید

برای Supabase بهتر است جدول پروفایل‌ها چنین فیلدی داشته باشد:

```sql
alter table public.profiles add column if not exists role text default 'customer';
```

اگر جدول شما `profiles` نیست، سرویس نقش‌ها به‌ترتیب `profiles`، `user_profiles` و `users` را بررسی می‌کند.

ورود موبایل/OTP آماده شده ولی برای فعال شدن واقعی باید Phone Auth در Supabase فعال و SMS Provider تنظیم شود.
