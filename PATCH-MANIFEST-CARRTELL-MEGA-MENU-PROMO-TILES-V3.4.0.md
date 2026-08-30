# Patch Manifest — Carrtell V3.4.0

## Source

- `src/admin/pages/Categories.tsx`
- `src/admin/pages/HomeContent.tsx`
- `src/admin/services/homeContentApi.ts`
- `src/components/DynamicCategoryMegaMenu.tsx`
- `src/components/Layout.tsx`
- `src/pages/ShopPage.tsx`
- `src/index.css`
- `agent-category.ps1`

## Database

- `supabase/migrations/202608240001_mega_menu_tiles.sql`

## Test assets

- `public/images/mega-menu/car-cleaning.webp`
- `public/images/mega-menu/fuel-additives.webp`
- `public/images/mega-menu/economy-oil-change.webp`
- `public/images/mega-menu/car-accessories.webp`

## Tests

- `tests/e2e/dynamic-category-mega-menu.spec.ts`
- `tests/e2e/home-category-agent-source-contract.spec.ts`
- `tests/e2e/persona-admin.spec.ts`

## Documentation

- `README-CARRTELL-MEGA-MENU-PROMO-TILES-V3.4.0-FA.md`
- `PATCH-MANIFEST-CARRTELL-MEGA-MENU-PROMO-TILES-V3.4.0.md`

## Security

- هیچ Secret، رمز، Token، کلید Supabase، پرداخت، پیامک یا Neshan داخل پچ وجود ندارد.
- Credential ادمین فقط هنگام اجرای Agent در Environment همان PowerShell قرار می‌گیرد و در `finally` پاک می‌شود.

