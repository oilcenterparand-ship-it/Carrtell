# Carrtell Storage Fix

This patch unifies image uploads to one bucket only:

`carrtell-media`

Replace:
- `src/admin/services/uploadApi.ts`
- `src/admin/services/smartUploadApi.ts`

Then run:
- `database/storage_bucket_policy_fix.sql`

Finally restart Vite:
- `Ctrl + C`
- `npm run dev`
