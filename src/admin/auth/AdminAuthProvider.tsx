import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { adminSignIn, adminSignOut, loadCurrentAdmin, type AdminIdentity } from './adminAuthApi';
import type { AdminPermission } from './adminPermissions';

interface AdminAuthContextValue {
  admin: AdminIdentity | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: AdminPermission | null) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { setAdmin(await loadCurrentAdmin()); } finally { setLoading(false); }
  };

  useEffect(() => {
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void refresh(), 0));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    admin,
    loading,
    isAuthenticated: Boolean(admin?.isActive),
    login: async (username, password) => { const result = await adminSignIn(username, password); setAdmin(result.identity); },
    logout: async () => { await adminSignOut(); setAdmin(null); },
    refresh,
    can: (permission) => Boolean(admin && (admin.isSuperAdmin || !permission || admin.permissions.includes(permission))),
  }), [admin, loading]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth باید داخل AdminAuthProvider استفاده شود.');
  return context;
}
