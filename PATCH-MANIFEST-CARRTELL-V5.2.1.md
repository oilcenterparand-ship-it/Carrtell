# PATCH MANIFEST — CARRTELL V5.2.1

## Changed
1. `src/pages/BookPage.tsx`
   - inline OTP verification error
   - expiry-aware OTP message
   - preserve cart selections when service is removed
   - separated service/product subtotals

2. `src/pages/ServicePaymentPage.tsx`
   - password setup after payment
   - verified mobile as username
   - credentials setup + guest request claim + dashboard navigation

3. `tests/e2e/v521-source-contract.spec.ts`
   - regression contracts for the above fixes

## SQL
None.

## Secrets
No secrets are added to frontend.

## Expected verification
- TypeScript typecheck
- Vite production build
- V5.2.1 regression spec
- PERSONAS agent

4. `tests/e2e/critical-user-journeys-v23.spec.ts`
   - updated cart subtotal expectations
   - post-payment account setup UI assertions

5. `tests/e2e/critical-user-journeys-v23.spec.ts`
   - exact password/repeat-password selectors to prevent Playwright strict-mode collision
