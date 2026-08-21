import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentCarrtellUser, onAuthChanged, signOutCarrtell, type CarrtellAuthUser, type UserRole } from './authApi';

type AuthContextValue = {
  user: CarrtellAuthUser | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
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
      const ownerKey = 'carrtell:browser-state-owner';
      const previousOwner = localStorage.getItem(ownerKey);
      const nextOwner = freshUser?.id || '';
      if (previousOwner && nextOwner && previousOwner !== nextOwner) {
        localStorage.removeItem('carrtell:selected-customer-car');
        localStorage.removeItem('carrtell_selected_car');
        localStorage.removeItem('carrtell:shop-filters');
        localStorage.removeItem('carrtell_shop_filters');
        sessionStorage.removeItem('carrtell:shop-filters');
        sessionStorage.removeItem('carrtell_shop_filters');
      }
      if (nextOwner) localStorage.setItem(ownerKey, nextOwner);
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
    initialized: !loading,
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
