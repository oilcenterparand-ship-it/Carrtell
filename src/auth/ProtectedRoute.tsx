import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import AuthLoadingScreen from './AuthLoadingScreen';
import type { UserRole } from './authApi';

export default function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login-otp?returnTo=${encodeURIComponent(returnTo)}`} replace state={{ from: returnTo }} />;
  }

  if (roles?.length && (!role || !roles.includes(role))) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname, requiredRoles: roles }} />;
  }

  return <Outlet />;
}
