# Patch Manifest — Carrtell Dynamic Mega Menu Design 3 V3.3.0

## فایل‌های جایگزین‌شونده

- `src/components/DynamicCategoryMegaMenu.tsx`
- `src/pages/ShopPage.tsx`
- `src/index.css`
- `tests/e2e/dynamic-category-mega-menu.spec.ts`
- `tests/e2e/home-category-agent-source-contract.spec.ts`

## فایل‌های راهنما

- `README-CARRTELL-DYNAMIC-MEGA-MENU-DESIGN-3-V3.3-FA.md`
- `PATCH-MANIFEST-CARRTELL-DYNAMIC-MEGA-MENU-DESIGN-3-V3.3.md`

## دامنه تغییر

- طراحی ۳ دسکتاپ و موبایل برای صفحه اصلی و فروشگاه
- حفظ درخت دسته‌بندی داینامیک با عمق نامحدود عملی
- حفظ تبلیغ قابل‌ویرایش از پنل مدیریت
- افزودن کنترل اندازه پنجره در دسکتاپ و موبایل
- افزودن آزمون سلامت منوی پایین و ورود به رزرو سرویس از موبایل
- افزودن قرارداد منبع برای جلوگیری از نشت استایل منو به رزرو و منوی پایین

## نیازهای زیرساختی

- مهاجرت دیتابیس جدید: ندارد
- تابع لبه جدید: ندارد
- راز یا متغیر محیطی جدید: ندارد
- فایل خروجی `dist`: داخل پچ سورس قرار نگرفته و با `npm run build` ساخته می‌شود

## نتیجه بررسی سازنده پچ

- Typecheck: پاس
- Build: پاس
- Source Contract: ۷ تست پاس
- آزمون مرورگری محلی: به‌علت نبود فایل اجرایی گوگل‌کروم در محیط سازنده آغاز نشد؛ ایجنت ویندوز آزمون کامل را اجرا می‌کند.

