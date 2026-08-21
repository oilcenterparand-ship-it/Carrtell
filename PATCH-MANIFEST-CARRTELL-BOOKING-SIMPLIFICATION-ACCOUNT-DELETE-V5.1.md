# Patch Manifest — Carrtell V5.1

Baseline: `project(20260821-141451).zip`

## Runtime files changed
- `src/pages/BookPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/auth/authApi.ts`

## Server files added
- `supabase/functions/customer-account-delete/index.ts`

## QA files changed
- `tests/e2e/persona-technician.spec.ts`

## SQL
None.

## Server deploy required
- `customer-account-delete`

## Security
- Account deletion requires a valid authenticated session after OTP verification.
- Admin/technician roles are blocked from customer self-delete endpoint.
- Supabase Service Role remains server-side only.
- Financial/order records are anonymized rather than blindly removed.

## Verification
- `tsc --noEmit -p tsconfig.app.json`: PASS on merged V5.1 source.
- Full Vite/Playwright release gate must run on user's Windows environment.
