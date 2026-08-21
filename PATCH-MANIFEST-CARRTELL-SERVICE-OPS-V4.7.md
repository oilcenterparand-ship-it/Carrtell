# Patch Manifest — Carrtell Service Operations V4.7

## Added
- `src/admin/pages/Technicians.tsx`
- `src/admin/services/technicianAdminApi.ts`
- `supabase/migrations/202608200001_service_operations_simplification.sql`

## Modified
- `src/App.tsx`
- `src/admin/pages/ServiceRequests.tsx`
- `src/admin/pages/ServiceFleet.tsx`
- `src/admin/pages/SystemSettingsCenter.tsx`
- `src/admin/services/dispatchApi.ts`
- `src/customer/services/serviceRequestsApi.ts`
- `src/admin/auth/adminPermissions.ts`
- `src/admin/navigation/adminNavigation.ts`
- `src/admin/navigation/adminRouteRegistry.ts`
- `src/admin/navigation/adminRoutesRegistry.ts`
- `supabase/functions/staff-password-login/index.ts`
- `tests/e2e/persona-admin.spec.ts`

## Database
- New canonical `service_technicians` table.
- Existing legacy technician credential is migrated to the canonical technician identity when matching auth user exists.
- `service_fleet` is created/normalized if needed.
- RLS policies added for technicians/fleet.

## No secrets
No Supabase service role, SMS, payment or Neshan secret is added to frontend files.
