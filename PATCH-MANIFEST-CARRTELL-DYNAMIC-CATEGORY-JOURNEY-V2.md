# Patch Manifest — Dynamic Category Journey V2

مبنای نصب: Carrtell Industrial/Diesel V1

## فایل‌های تغییرکرده
- `src/App.tsx`
- `src/pages/HomePage.tsx`
- `src/admin/services/categoriesApi.ts`
- `src/admin/pages/Categories.tsx`
- `src/admin/pages/Products.tsx`
- `CARRTELL_PROJECT_CONTEXT.md`

## فایل‌های جدید
- `src/pages/CategoryJourneyPage.tsx`
- `tests/e2e/dynamic-category-journey.spec.ts`
- `agent-category.ps1`
- `README-CARRTELL-DYNAMIC-CATEGORY-JOURNEY-V2-FA.md`
- `PATCH-MANIFEST-CARRTELL-DYNAMIC-CATEGORY-JOURNEY-V2.md`

## دیتابیس
SQL جدید لازم نیست. این Sprint از `parent_id` و `product_category_assignments` پچ V1 استفاده می‌کند.

## امنیت
هیچ Secret یا کلید جدیدی به Frontend اضافه نشده است.
