# Carrtell customer export + invoice + SMS/review workflow

## What changed
- Customer profile form: removed National Code and internal notes from UI.
- Preferred contact field now follows the site theme.
- Admin Orders: export unique customer phone numbers as CSV for Excel.
- Invoice download: generates a real PDF file in the browser.
- SMS flow: order creation/status changes are logged in `sms_logs` and ready to connect to SMS provider.
- After order completion, a review link is logged for SMS.
- Review page: `/review/:orderId`
- Admin review approval page: `/admin/reviews`

## SMS provider note
Actual SMS sending needs a provider such as Kavenegar, FarazSMS, or Melipayamak. This patch creates the database and code hooks; the provider API key should be connected through a secure backend/Edge Function, not directly in React.
