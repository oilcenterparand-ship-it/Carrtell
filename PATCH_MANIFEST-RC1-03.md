# RC1-03 Patch Manifest

## Added
- src/admin/auth/adminPermissions.ts
- src/admin/auth/adminAuthApi.ts
- src/admin/auth/AdminAuthProvider.tsx
- src/admin/auth/AdminRouteGuard.tsx
- src/admin/pages/AdminLogin.tsx
- src/admin/pages/AdminAccounts.tsx
- src/admin/services/adminSecurityApi.ts
- supabase/migrations/202607230004_rc1_03_admin_rbac.sql
- supabase/functions/admin-bootstrap/index.ts
- supabase/functions/admin-user-management/index.ts
- README-RC1-03-FA.md

## Modified
- src/main.tsx
- src/App.tsx
- src/auth/GlobalRouteGuard.tsx
- src/auth/ProtectedRoute.tsx
- src/admin/hooks/useAdminRoutes.ts
- src/admin/components/AdminHeader.tsx
- src/admin/pages/Roles.tsx
