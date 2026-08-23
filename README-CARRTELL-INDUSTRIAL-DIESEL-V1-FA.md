# پچ Carrtell — فروشگاه دیزلی و صنعتی V1

## امکانات
- صفحه عمومی و مستقل `/industrial` بدون ورود اجباری
- دسته‌بندی درختی و نامحدود در پنل مدیریت
- انتخاب والد، تصویر، ایموجی، ترتیب و فعال/غیرفعال
- اتصال هر محصول به یک یا چند دسته داینامیک
- حفظ فیلد قدیمی `products.category` برای جلوگیری از خرابی محصولات سواری
- Seed دسته‌های دیزلی و صنعتی و انتقال امن اتصال دسته‌های فعلی
- حالت تست جدید `INDUSTRIAL` در Carrtell Agent

## نصب
1. ZIP را در ریشه پروژه، کنار `package.json`، استخراج کن و Replace را تأیید کن.
2. فایل `supabase/migrations/202608230001_dynamic_product_category_tree.sql` را در SQL Editor پروژه Supabase اجرا کن.
3. فایل `INSTALL-INDUSTRIAL-V1.ps1` را با PowerShell اجرا کن؛ یا دستورات زیر را دستی اجرا کن:

```powershell
npm install
npm run typecheck
npm run build
.\agent.ps1 INDUSTRIAL
```

4. در پنل ادمین، بخش «دسته‌بندی‌ها» را باز کن و ساختار والد/زیرشاخه را بررسی کن.
5. در «محصولات»، محصول صنعتی را به یک یا چند شاخه صنعتی متصل کن.
6. آدرس `/industrial` را در موبایل و دسکتاپ باز کن.

## گزارش تست به ChatGPT
اگر Agent خطا داد، این موارد را بفرست:
- متن کامل PowerShell از اولین `FAILED`
- فایل `playwright-report/index.html` یا Screenshot خطا
- مسیر و مرحله‌ای که Agent اعلام کرده

Agent نباید برای عبور از تست قابلیت سالمی را حذف کند. خطا باید تحلیل شود و Patch اصلاحی بعدی روی همین Sprint ساخته شود.

## بازگشت دیتابیس
حذف جدول واسط اتصال‌ها اطلاعات اصلی محصول را پاک نمی‌کند، چون `products.category` حفظ شده است:

```sql
drop table if exists public.product_category_assignments;
alter table public.product_categories drop column if exists parent_id;
```

قبل از Rollback از دیتابیس Backup بگیر. دسته‌های Seed شده عمداً خودکار حذف نمی‌شوند.
