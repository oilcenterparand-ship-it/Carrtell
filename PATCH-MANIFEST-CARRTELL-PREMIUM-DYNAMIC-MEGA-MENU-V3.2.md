# Patch Manifest — Carrtell Premium Dynamic Mega Menu V3.2.0

Base branch: `sprint/guest-checkout-search-car-picker`

Base GitHub commit: `c36839123744313e41454b7875b71b00d18e0f66`

Includes previous home-rail/admin-credential fix commit: `25dcf88f3c10c2d15b8ff563a176fa6870f895c5`

## Files

- `src/components/DynamicCategoryMegaMenu.tsx` — shared premium dynamic category overlay for homepage.
- `src/components/Layout.tsx` — replaces the old homepage root-category rail with the premium trigger and loads the managed promotion.
- `src/pages/ShopPage.tsx` — removes fixed slug assumptions from the desktop default cascade.
- `src/admin/pages/Categories.tsx` — excludes the edited node and all descendants from valid parent choices.
- `src/index.css` — responsive premium toolbar, desktop overlay and mobile hierarchy styling.
- `supabase/migrations/202608230003_category_tree_cycle_guard.sql` — database-level cycle prevention.
- `tests/e2e/dynamic-category-mega-menu.spec.ts` — dynamic-data customer tests for homepage, shop, desktop and mobile.
- `tests/e2e/home-category-agent-source-contract.spec.ts` — source, credential, promotion and hierarchy safety contracts.
- `tests/e2e/persona-admin.spec.ts` — real admin route audit now includes categories and dynamic product assignment.
- `playwright.source.config.ts` — fast source-contract configuration without a browser server.
- `agent-category.ps1` — runs stricter dynamic source and cycle-safety verification.
- `README-CARRTELL-PREMIUM-DYNAMIC-MEGA-MENU-V3.2-FA.md` — Persian installation and test guide.

## Database

Run once:

`supabase/migrations/202608230003_category_tree_cycle_guard.sql`

No secret, credential, Supabase service key, SMS key, payment key or Neshan key is included.

