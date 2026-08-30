# Patch Manifest — Carrtell V3.4.1

## Frontend

- `src/pages/HomePage.tsx`
- `src/pages/ShopPage.tsx`
- `src/components/Layout.tsx`
- `src/components/DynamicCategoryMegaMenu.tsx`
- `src/index.css`

## Admin and API

- `src/admin/pages/Categories.tsx`
- `src/admin/pages/HomeContent.tsx`
- `src/admin/services/homeContentApi.ts`

## Database

- `supabase/migrations/202608240001_mega_menu_tiles.sql`
- `supabase/migrations/202608240002_home_hero_promo_tiles_correction.sql`

## Images

- `public/images/mega-menu/car-cleaning.webp`
- `public/images/mega-menu/fuel-additives.webp`
- `public/images/mega-menu/economy-oil-change.webp`
- `public/images/mega-menu/car-accessories.webp`

## Agent and tests

- `agent-category.ps1`
- `tests/e2e/dynamic-category-mega-menu.spec.ts`
- `tests/e2e/home-category-agent-source-contract.spec.ts`
- `tests/e2e/persona-admin.spec.ts`

## Security

- هیچ Secret یا Credential داخل Patch قرار نگرفته است.
- Credential ادمین فقط در Environment همان اجرای Agent نگهداری و در `finally` پاک می‌شود.

