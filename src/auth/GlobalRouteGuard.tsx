import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function GlobalRouteGuard({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  if (isAdmin) return <>{children}</>;

  // The technician login page must remain public. Treating /driver/login as a
  // protected technician route creates a redirect loop back to itself and the
  // actual login UI never mounts.
  if (path === '/driver/login') return <>{children}</>;

  const isTechnician = path === '/driver' || path.startsWith('/driver/');
  if (!isTechnician) return <>{children}</>;
  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-950 p-12 text-center text-white">در حال بررسی دسترسی...</main>;
  if (!isAuthenticated) return <Navigate to={`/driver/login?returnTo=${encodeURIComponent(path)}`} replace />;
  if (isTechnician && role !== 'admin' && role !== 'technician') return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
