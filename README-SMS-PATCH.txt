Carrtell SMS patch

Copy src/ into your project src/.
Run docs/sql/2026_sms_system.sql in Supabase SQL Editor.

Routes to add if not already present:
/admin/sms-settings -> src/admin/pages/SmsSettings.tsx
/admin/sms-logs -> src/admin/pages/SmsLogs.tsx

Events helper:
src/lib/smsEvents.ts
Use these functions after order/service events:
notifyOrderCreated(order)
notifyOrderStatusChanged(order)
notifyServiceAssigned(service)
notifyServiceOnTheWay(service)
notifyServiceCompleted(service)

Real provider sending should be done in a Supabase Edge Function so API keys are not exposed in browser.
