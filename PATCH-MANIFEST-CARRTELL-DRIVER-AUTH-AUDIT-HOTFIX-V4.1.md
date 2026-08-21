# Patch Manifest — Carrtell Driver Auth / Route Audit Hotfix V4.1

## Modified files
- `src/pages/DriverLoginPage.tsx`
- `tests/e2e/route-audit-v21.spec.ts`
- `tests/e2e/persona-technician.spec.ts`
- `tests/e2e/persona-admin.spec.ts`

## Added documentation
- `README-CARRTELL-DRIVER-AUTH-AUDIT-HOTFIX-V4.1-FA.md`
- `PATCH-MANIFEST-CARRTELL-DRIVER-AUTH-AUDIT-HOTFIX-V4.1.md`

## Database
- No SQL changes.

## Secrets
- No new secrets.
- No credentials are hardcoded in frontend runtime code.
- `admin/admin` is only the current server-side temporary staff credential and the default value used by E2E tests.
