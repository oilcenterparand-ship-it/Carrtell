# PATCH MANIFEST — Guest Checkout / Search / Car Picker V2

Branch:
sprint/guest-checkout-search-car-picker

Changed source:
- src/components/Layout.tsx
- src/pages/BookPage.tsx
- src/pages/CartPage.tsx
- src/customer/services/serviceRequestsApi.ts
- src/pages/ServicePaymentPage.tsx
- src/pages/OtpLoginPage.tsx
- src/index.css

New SQL:
- supabase/migrations/202608140001_guest_checkout_service.sql

Docs:
- README-SPRINT-GUEST-CHECKOUT-FA.md
- PATCH-MANIFEST-SPRINT-GUEST-CHECKOUT.md

Installer:
- APPLY-SPRINT-GUEST-CHECKOUT-V2.ps1
- APPLY-SPRINT-GUEST-CHECKOUT.mjs

Validation:
- npm run typecheck
- npm run build
- git diff --check

Secrets:
- none
