import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { enableLocalDevAdmin, type UserRole } from './authApi';

export default function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, loading, role, refreshAuth } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-32 text-center text-white" dir="rtl">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">در حال بررسی دسترسی...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && (!role || !roles.includes(role))) {
    const canUseDevUnlock = import.meta.env.DEV && roles.includes('admin') && location.pathname.startsWith('/admin');

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-32 text-white" dir="rtl">
        <section className="mx-auto max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center shadow-2xl shadow-black/30">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-200" />
          <h1 className="text-2xl font-black">دسترسی مجاز نیست</h1>
          <p className="mt-2 text-sm text-red-100/80">این بخش فقط برای نقش‌های مجاز باز می‌شود. نقش فعلی شما: {role || 'نامشخص'}</p>
          {canUseDevUnlock && (
            <button
              type="button"
              onClick={async () => {
                enableLocalDevAdmin();
                await refreshAuth();
              }}
              className="mt-5 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20"
            >
              فعال‌سازی مدیر محلی برای تست
            </button>
          )}
        </section>
      </main>
    );
  }

  return <Outlet />;
}
