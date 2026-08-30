# Patch Manifest — Carrtell V3.6.2

## Changed source

- `src/auth/staffPasswordAuth.ts`
- `src/pages/ShopPage.tsx`
- `src/customer/services/serviceTravelApi.ts`
- `supabase/functions/staff-password-login/index.ts`
- `supabase/functions/service-travel-estimate/index.ts`

## Database and tests

- `supabase/manual/CARRTELL_SERVICE_TRAVEL_PRICING_SAFE.sql`
- `tests/e2e/sprint-auth-product-travel-contract.spec.ts`
- `tests/e2e/service-travel-pricing-source-contract.spec.ts`

## Deployment

- Apply safe SQL once
- Set `NESHAN_SERVICE_API_KEY` using the `service.` key
- Deploy `staff-password-login`
- Deploy `service-travel-estimate`
- Build and publish `dist`

## Validation

- TypeScript: passed
- Production build: passed
- Focused ESLint: passed
- Relevant contract tests: 15/15 passed
