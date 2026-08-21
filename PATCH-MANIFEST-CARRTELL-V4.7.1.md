# Patch Manifest — Carrtell V4.7.1

- Base: latest complete project ZIP + installed V4.2 through V4.7 patches.
- Changed: `supabase/functions/staff-password-login/index.ts`
- Database migration: none
- Secret changes: none
- Purpose: isolate and restore deterministic Admin authentication while retaining V4.7 multi-technician/service-operations logic.
- Rollback: restore V4.7 version of the Edge Function and redeploy.
