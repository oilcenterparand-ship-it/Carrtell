# PATCH MANIFEST — Carrtell v2.3.14

## Base
`carrtell-current-v2313-FINAL.zip`

## Changed
- src/components/Layout.tsx
- supabase/functions/send-sms-hook/index.ts
- tests/e2e/critical-user-journeys-v23.spec.ts

## Added
- setup-real-sms-v2314.ps1
- README_FA.md
- PATCH_MANIFEST.md
- install-sprint-guest-menu-sms-v2314.ps1

## SQL
None.

## Guest Menu
Removes `/login-otp` CTA from hamburger drawer for guests.
Adds explicit public-flow note.

## SMS
Hardens the existing Supabase Send SMS Hook for Kavenegar.
Requires signed Supabase Hook payload and server-side Kavenegar secrets.

## Secrets
No secret is embedded in frontend or patch files.

## Acceptance
- typecheck PASS
- build PASS
- CRITICAL PASS
- real phone receives Kavenegar OTP after cloud hook configuration
