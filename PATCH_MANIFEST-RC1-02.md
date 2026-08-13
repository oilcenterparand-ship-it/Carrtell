# PATCH MANIFEST — RC1-02 Store Complete

## Modified
- `src/pages/CartPage.tsx`
- `src/services/discountsClientApi.ts`
- `src/auth/AuthProvider.tsx`

## Added
- `supabase/migrations/202607230003_rc1_02_store_complete.sql`
- `README-RC1-02-FA.md`
- `PATCH_MANIFEST-RC1-02.md`

## Database objects
- orders/order_items/payments hardening
- discounts/discount_usages
- inventory_movements
- carrtell_validate_discount
- carrtell_create_checkout_order
- carrtell_release_order_inventory
- carrtell_get_order_payment_snapshot
- carrtell_mark_payment_pending
- carrtell_finalize_order_payment
- carrtell_complete_test_payment
- RLS policies and indexes

## Verification
- `npm run typecheck`: passed
- `npm run build`: source reached Vite, but Linux build was blocked by the Windows-origin `node_modules` missing Rollup Linux optional binary. Run `npm install` on Windows before build.
