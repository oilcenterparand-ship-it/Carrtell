# Carrtell Home Sections Date Save Fix

این پچ خطای ذخیره سکشن‌های صفحه اصلی را رفع می‌کند.

مشکل: وقتی تاریخ/ساعت پایان تایمر خالی بود، مقدار `""` به ستون `timestamptz` ارسال می‌شد و Supabase خطای `invalid input syntax for type timestamp with time zone` می‌داد.

اصلاح: اگر تایمر فعال نباشد یا تاریخ خالی باشد، مقدار `null` ارسال می‌شود.

SQL لازم ندارد.
