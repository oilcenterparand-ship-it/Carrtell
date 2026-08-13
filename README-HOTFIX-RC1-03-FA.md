# هات‌فیکس RC1-03

این نسخه خطای `function public.is_admin() is not unique` را برطرف می‌کند.

علت: وجود تابع قدیمی `is_admin()` و ساخت تابع جدید `is_admin(uuid default auth.uid())` بود؛ هر دو با فراخوانی بدون آرگومان قابل انتخاب بودند.

فایل اصلاح‌شده را جایگزین و کل Migration را دوباره در Supabase SQL Editor اجرا کنید.
