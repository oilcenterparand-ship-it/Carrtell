# Patch Manifest — Carrtell Industrial/Diesel V1

Branch مبنا: `sprint/guest-checkout-search-car-picker`

## فایل‌های تغییرکرده
- `src/App.tsx`
- `src/pages/HomePage.tsx`
- `src/admin/services/categoriesApi.ts`
- `src/admin/services/productsApi.ts`
- `src/admin/pages/Categories.tsx`
- `src/admin/pages/Products.tsx`
- `agent.ps1`
- `CARRTELL_PROJECT_CONTEXT.md`

## فایل‌های جدید
- `INSTALL-INDUSTRIAL-V1.ps1`
- `src/pages/IndustrialProductsPage.tsx`
- `supabase/migrations/202608230001_dynamic_product_category_tree.sql`
- `tests/e2e/industrial-diesel-catalog.spec.ts`
- `README-CARRTELL-INDUSTRIAL-DIESEL-V1-FA.md`
- `PATCH-MANIFEST-CARRTELL-INDUSTRIAL-DIESEL-V1.md`

## دیتابیس
- تکمیل idempotent جدول `product_categories`
- افزودن `parent_id`
- ساخت `product_category_assignments`
- Seed شاخه دیزلی/صنعتی
- انتقال اتصال دسته قدیمی محصولات بدون حذف `products.category`
- RLS و Indexهای لازم

## Secretها
هیچ Secret یا کلید Supabase، پیامک، پرداخت یا Neshan اضافه نشده است.
