# Patch Manifest — Carrtell Admin Redesign V4.8

Base: `project(20260820-112230).zip`

## Modified
- `src/App.tsx` — یکپارچه‌سازی Routeهای Admin زیر `AdminLayout`
- `src/admin/hooks/useAdminRoutes.ts` — معماری Navigation جدید ۸ گروهی
- `src/admin/components/Sidebar.tsx` — Sidebar جدید گروه‌بندی‌شده، جستجو و Collapse
- `src/admin/layouts/AdminLayout.tsx` — Shell تیره و یکپارچه پنل
- `src/admin/pages/AdminDashboard.tsx` — داشبورد «کار امروز»
- `src/admin/pages/Dispatch.tsx` — ساده‌سازی تخصیص و عملیات سرویس
- `tests/e2e/persona-admin.spec.ts` — Assertion برای Navigation جدید

## Database
- No SQL changes.
- No new secrets.
- No frontend exposure of Supabase/Kavenegar/Neshan secrets.

## Validation performed
- `npm run typecheck`: PASS
- `npm run build`: not executable in the Linux patch environment because the uploaded `node_modules` contains Windows Rollup binaries and lacks `@rollup/rollup-linux-x64-gnu`; Windows build is required after installation.
