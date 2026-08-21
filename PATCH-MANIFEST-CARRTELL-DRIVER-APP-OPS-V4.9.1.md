# Patch Manifest — Carrtell V4.9.1

## مبنا
- آخرین ZIP کامل: `project(20260820-121754).zip`
- V4.9 cumulative files نیز داخل این Patch قرار دارند.

## فایل‌های تغییرکرده/اضافه‌شده
- `src/App.tsx`
- `src/pages/CartPage.tsx`
- `src/customer/services/serviceRequestsApi.ts`
- `src/admin/services/serviceFleetApi.ts`
- `src/admin/services/dashboardApi.ts`
- `src/admin/services/dispatchApi.ts`
- `src/admin/pages/ServiceRequests.tsx`
- `src/admin/pages/Dispatch.tsx`
- `src/admin/pages/ServiceOperationsBoard.tsx` (new)
- `src/admin/hooks/useAdminRoutes.ts`
- `src/driver/services/driverJobsApi.ts`
- `src/driver/pages/DriverDashboard.tsx`
- `src/driver/pages/DriverJobDetail.tsx`
- `src/driver/utils/neshanNavigation.ts` (new)
- `tests/e2e/persona-technician.spec.ts`
- `supabase/migrations/202608200002_paid_order_to_service_crm.sql` (existing V4.9, no new SQL)

## دیتابیس
SQL جدید ندارد. Migration V4.9 برای Paid Order → Service Request همراه Patch است.

## امنیت
- هیچ Neshan/Kavenegar/Supabase service secret به Frontend اضافه نشده است.
- مسیر Neshan فقط از مختصات ماموریت و Geolocation مرورگر استفاده می‌کند.

## QA
- `npm run typecheck`: PASS
- Build تحویل‌دهنده: blocked by Windows node_modules / Linux Rollup optional binary mismatch; باید روی Windows اجرا شود.
- Persona technician test اکنون نبودن `<footer>` در پنل سرویس‌کار را هم بررسی می‌کند.
