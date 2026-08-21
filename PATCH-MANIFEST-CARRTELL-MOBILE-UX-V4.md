# PATCH MANIFEST — Carrtell Mobile UX V4

Base: uploaded `project(2).zip` (2026-08-14)

## Changed source files
- src/components/MobileBottomNav.tsx
- src/components/Layout.tsx
- src/pages/BookPage.tsx
- src/index.css

## Database
- No new SQL.

## Security
- No Kavenegar/Supabase/payment secret added to frontend.
- OTP uses existing Supabase Auth flow.

## Validation
- TypeScript typecheck: PASS
- Production build in delivery container: NOT RUN TO COMPLETION because uploaded node_modules is Windows-specific and Rollup Linux optional binary is absent.
