# Patch Manifest — Carrtell V5.2

Baseline GitHub commit: `34dd0cf5cc556230b380c348f8a3339fbc7d456b`
Branch: `sprint/guest-checkout-search-car-picker`

## Runtime files changed
- `src/components/WhatsAppButton.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/Layout.tsx`
- `src/pages/BookPage.tsx`
- `src/pages/OtpLoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/auth/authApi.ts`
- `src/services/smsOtpApi.ts`
- `src/styles/mobile-rc106a.css`

## QA files changed
- `tests/e2e/auth-account-regression-v2319.spec.ts`
- `tests/e2e/critical-user-journeys-v23.spec.ts`
- `agent.ps1`

## Docs
- `README-CARRTELL-AUTH-SUPPORT-OTP-FIX-V5.2-FA.md`
- `PATCH-MANIFEST-CARRTELL-AUTH-SUPPORT-OTP-FIX-V5.2.md`

## SQL
None.

## Edge Function deploy
No new deploy required if `customer-account-delete` from V5.1 is already deployed.

## Security
- No frontend secrets added.
- Account delete remains server-side through the existing Edge Function.
- OTP continues through Supabase Auth / server SMS hook.

## Verification in build environment
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`: PASS.
- Playwright test discovery for modified suites: PASS.
- Full Vite + browser Agent run remains Windows release gate.
