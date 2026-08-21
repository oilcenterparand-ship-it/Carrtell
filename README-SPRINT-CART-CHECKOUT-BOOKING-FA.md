# Sprint سبد خرید، Checkout و رزرو سرویس — 2026-08-15

این Sprint روی ZIP واقعی `project(6).zip` ساخته شده است.

## اصلاحات
- Mini Cart در موبایل به پنل مستقل بالای محتوا تبدیل شد و دیگر زیر Search/Header مخفی نمی‌شود.
- Mini Cart محصول، قیمت، تعداد و کلیدهای + و - را نمایش می‌دهد.
- Bottom Nav هنگام باز شدن کیبورد موبایل مخفی می‌شود تا وسط فرم/نقشه گیر نکند.
- فرم آدرس Checkout ساده شد: فیلدهای پلاک، واحد و کدپستی از UI حذف شدند.
- خطای `order_items.item_type does not exist` با migration هماهنگ‌کننده schema رفع می‌شود.

## SQL الزامی
فایل `supabase/migrations/202608150002_order_items_schema_alignment.sql` را در Supabase SQL Editor اجرا کنید.

## نصب
فایل‌های Patch را روی پروژه فعلی Replace کنید، SQL را اجرا کنید و سپس:
`npm run typecheck`
`npm run build`

## تست
1. در Home/Shop روی سبد بزنید؛ پنل کوچک باید روی صفحه و قابل مشاهده باشد.
2. + و - تعداد را تغییر دهند.
3. در Checkout آدرس، پلاک/واحد/کدپستی نباشد.
4. با باز شدن کیبورد، Bottom Nav مزاحم فرم نباشد.
5. ثبت سفارش دیگر خطای item_type ندهد.
