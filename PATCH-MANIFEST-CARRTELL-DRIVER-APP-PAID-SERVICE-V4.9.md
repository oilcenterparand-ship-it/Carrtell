# Patch Manifest — Carrtell V4.9

Base: `project(20260820-121754).zip`

## Changed files

- `src/App.tsx`
  - `/driver` → `/driver/dashboard`
  - حذف نمایش Driver قدیمی داخل SiteLayout
- `src/pages/CartPage.tsx`
  - اتصال Service Draft به Order قبل از رفتن به پرداخت
- `src/driver/pages/DriverDashboard.tsx`
  - بازطراحی کامل App-like
- `src/driver/pages/DriverJobDetail.tsx`
  - بازطراحی مأموریت و مراحل عملیاتی
- `src/driver/services/driverJobsApi.ts`
  - وضعیت `accepted` و timestamp پذیرش
- `src/admin/services/dispatchApi.ts`
  - پشتیبانی از `accepted`
- `src/admin/pages/ServiceRequests.tsx`
  - پشتیبانی از وضعیت جدید در عملیات مدیریت
- `src/admin/services/serviceFleetApi.ts`
  - `accepted` جزو مأموریت‌های فعال
- `src/admin/services/dashboardApi.ts`
  - `accepted` در KPI سرویس‌های فعال
- `src/customer/services/serviceRequestsApi.ts`
  - پشتیبانی سراسری از وضعیت `accepted`
- `tests/e2e/persona-technician.spec.ts`
  - QA پنل جدید سرویس‌کار
- `supabase/migrations/202608200002_paid_order_to_service_crm.sql`
  - اتصال پرداخت موفق سفارش سرویس در محل به CRM عملیات
  - Timeline پایه
  - RLS مأموریت سرویس‌کار

## Database changes

- `orders.service_draft`
- `service_requests.order_id`
- `service_requests.source`
- `service_requests.scheduled_at`
- `service_requests.accepted_at`
- `service_requests.service_started_at`
- `service_requests.updated_at`
- New table: `service_crm_events`
- New RPC: `carrtell_attach_order_service_draft`
- New RPC: `carrtell_create_service_request_from_paid_order`
- New Trigger: `trg_carrtell_sync_paid_service_order`
- New Trigger: `trg_carrtell_log_service_status_event`

## Security

- No Supabase/Kavenegar/payment/Neshan secret added to frontend.
- Assigned technician gets explicit RLS access only to assigned service requests.
- CRM event read is limited to admin or assigned technician.

## Verification performed

```text
TypeScript: PASS
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
```

Production build must be run on the user's Windows project because the uploaded ZIP contains the Windows dependency tree.
