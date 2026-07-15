import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentCarrtellUser, onAuthChanged, signOutCarrtell, type CarrtellAuthUser, type UserRole } from './authApi';

type AuthContextValue = {
  user: CarrtellAuthUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CarrtellAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const freshUser = await getCurrentCarrtellUser();
      setUser(freshUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAuth();

    const unsubscribeLocal = onAuthChanged(() => void refreshAuth());
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void refreshAuth(), 0);
    });

    const onFocus = () => void refreshAuth();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribeLocal();
      data.subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role: user?.role || null,
    loading,
    isAuthenticated: Boolean(user),
    refreshAuth,
    refreshUserRole: refreshAuth,
    signOut: signOutCarrtell,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth باید داخل AuthProvider استفاده شود.');
  return context;
}
