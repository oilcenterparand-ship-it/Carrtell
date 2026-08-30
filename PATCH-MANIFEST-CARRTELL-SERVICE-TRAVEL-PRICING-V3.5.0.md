# Patch Manifest — Carrtell V3.5.0

## Frontend و API

- `src/pages/BookPage.tsx`
- `src/pages/ServicePaymentPage.tsx`
- `src/admin/pages/ServiceBookingSettings.tsx`
- `src/customer/services/serviceBookingApi.ts`
- `src/customer/services/serviceRequestsApi.ts`
- `src/customer/services/serviceTravelApi.ts`
- `src/utils/serviceInvoiceImage.ts`

## Supabase

- `supabase/functions/service-travel-estimate/index.ts`
- `supabase/migrations/202608240004_service_travel_distance_pricing.sql`
- `supabase/manual/CARRTELL_SERVICE_TRAVEL_PRICING_SAFE.sql`

## Agent و تست

- `agent.ps1`
- `playwright.source.config.ts`
- `tests/e2e/critical-user-journeys-v23.spec.ts`
- `tests/e2e/service-travel-pricing-source-contract.spec.ts`

## راهنما

- `README-CARRTELL-SERVICE-TRAVEL-PRICING-V3.5.0-FA.md`
- `PATCH-MANIFEST-CARRTELL-SERVICE-TRAVEL-PRICING-V3.5.0.md`

ZIP فاقد Secret، `.env`، `node_modules`، گزارش Playwright و فایل اختصاصی هاست است.
