# Patch Manifest — CARRTELL-DRIVER-LOGIN-GUARD-HOTFIX-V4.2

- Base source: `project(20260819-201932).zip`
- Scope: Driver authentication route guard only
- Changed files:
  - `src/auth/GlobalRouteGuard.tsx`
- Database changes: none
- Edge Function deploy: none
- Secrets: none
- Frontend secrets added: none
- Purpose: prevent redirect loop on `/driver/login` and allow technician login page to render for anonymous users.
