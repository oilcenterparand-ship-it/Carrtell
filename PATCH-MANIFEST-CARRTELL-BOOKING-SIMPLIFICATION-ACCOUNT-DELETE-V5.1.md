# Patch Manifest — Carrtell V5.1

Baseline GitHub commit: `6157a7b`
Branch source: `sprint/guest-checkout-search-car-picker`

## Runtime files changed
- `src/pages/BookPage.tsx`
- `src/components/MapLocationPicker.tsx`

## Existing account-delete runtime used
- `src/pages/DashboardPage.tsx`
- `src/auth/authApi.ts`
- `supabase/functions/customer-account-delete/index.ts`

## QA changed
- `tests/e2e/critical-user-journeys-v23.spec.ts`
- `agent.ps1`

## Docs
- `README-CARRTELL-BOOKING-SIMPLIFICATION-ACCOUNT-DELETE-V5.1-FA.md`
- `PATCH-MANIFEST-CARRTELL-BOOKING-SIMPLIFICATION-ACCOUNT-DELETE-V5.1.md`

## SQL
None.

## Server deploy required
- `customer-account-delete` if not already deployed after V5.1 introduction.

## Security
- OTP verification remains through backend/Supabase auth.
- Account deletion requires authenticated customer session.
- Service Role stays only in Edge Function.
- No Kavenegar, Supabase service role, payment or Neshan service secret is exposed in frontend.

## Verification in build environment
- `npm run typecheck`: PASS.
- Vite build could not run in Linux sandbox because uploaded Windows `node_modules/.bin/vite` is not executable; Windows build remains release gate.
