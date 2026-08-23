# Patch Manifest — Carrtell Category Mega Menu V2.2

## فایل‌های تغییرکرده

- `src/components/Layout.tsx` — منوی چندستونه پویا در هدر؛ فقط ریشه‌ها در ستون اول.
- `src/pages/ShopPage.tsx` — پیمایش مرحله‌ای موبایل، نوار فقط دسته مادر، فیلتر همراه زیرشاخه‌ها.
- `src/index.css` — چیدمان و اسکرول منوی چندستونه.
- `tests/e2e/dynamic-category-mega-menu.spec.ts` — تست دسکتاپ، موبایل و overflow.
- `agent-category.ps1` — اجرای خودکار تست جدید.
- `README-CARRTELL-CATEGORY-MEGA-MENU-V2.2-FA.md` — راهنمای فارسی.
- `PATCH-MANIFEST-CARRTELL-CATEGORY-MEGA-MENU-V2.2.md` — همین Manifest.

## SQL

- ندارد؛ Migration دسته‌بندی Dynamic قبلی باید از قبل اجرا شده باشد.

## بررسی انجام‌شده

- `npm run typecheck`
- `npm run build`
