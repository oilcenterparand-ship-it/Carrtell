import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthProvider';
import { permissionForAdminPath } from './adminPermissions';

export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { loading, isAuthenticated, can } = useAdminAuth();
  if (location.pathname === '/admin/login' || location.pathname === '/admin/setup') return <>{children}</>;
  if (!location.pathname.startsWith('/admin')) return <>{children}</>;
  if (loading) return <main dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 text-white">در حال بررسی دسترسی مدیریت...</main>;
  if (!isAuthenticated) return <Navigate to={`/admin/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const permission = permissionForAdminPath(location.pathname);
  if (!can(permission)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
