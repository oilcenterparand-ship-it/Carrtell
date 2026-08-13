import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function GlobalRouteGuard({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  if (isAdmin) return <>{children}</>;
  const isTechnician = path === '/driver' || path.startsWith('/driver/');
  const protectedCustomer = path.startsWith('/profile/') || path.startsWith('/notifications');
  if (!isTechnician && !protectedCustomer) return <>{children}</>;
  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-950 p-12 text-center text-white">در حال بررسی دسترسی...</main>;
  if (!isAuthenticated) return <Navigate to={`/login-otp?returnTo=${encodeURIComponent(path)}`} replace />;
  if (isTechnician && role !== 'admin' && role !== 'technician') return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
