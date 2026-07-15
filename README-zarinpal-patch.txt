Carrtell - Zarinpal Gateway Structure Patch

Copy files into project root, then run:
docs/sql/2026_zarinpal_gateway_settings.sql

What this patch adds:
- Admin route: /admin/payment-settings
- Payment gateway settings in site_settings
- Zarinpal-ready payment flow
- Test gateway remains available
- Pending Zarinpal payment registration
- Zarinpal callback verification structure

Important:
Real Zarinpal request/verify should be handled by Supabase Edge Functions.
This patch prepares the frontend and database. The next patch can add Edge Function code.
