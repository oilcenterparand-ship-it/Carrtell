import { useEffect, useMemo, useState } from 'react';
import { Home, ShoppingBag, Wrench, UserRound } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

type MobileNavItem = {
  to: string;
  label: string;
  Icon: typeof Home;
  matches: (pathname: string) => boolean;
  featured?: boolean;
};

const items: MobileNavItem[] = [
  { to: '/', label: 'خانه', Icon: Home, matches: (pathname) => pathname === '/' || pathname === '/home' },
  { to: '/shop', label: 'فروشگاه', Icon: ShoppingBag, matches: (pathname) => pathname === '/shop' || pathname.startsWith('/shop/') || pathname.startsWith('/package-categories/') },
  { to: '/book', label: 'رزرو سرویس', Icon: Wrench, matches: (pathname) => pathname === '/book', featured: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKeyboardOpen(window.innerHeight - vv.height > 140);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  const accountTo = useMemo(
    () => user ? '/dashboard' : `/login-otp?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`,
    [location.hash, location.pathname, location.search, user],
  );

  const accountLabel = useMemo(() => {
    if (!user) return 'حساب';
    const firstName = String(user.fullName || '').trim().split(/\s+/).filter(Boolean)[0];
    return firstName ? `سلام ${firstName}` : 'حساب من';
  }, [user]);

  const hidden = location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/driver')
    || location.pathname === '/login-otp'
    || location.pathname.startsWith('/payment')
    || location.pathname.startsWith('/service-payment');

  if (hidden || keyboardOpen) return null;

  return (
    <nav className="ct-mobile-bottom-nav" aria-label="ناوبری اصلی موبایل">
      {items.map(({ to, label, Icon, matches, featured }) => {
        const active = matches(location.pathname);
        return (
          <NavLink key={label} to={to} className={`${active ? 'is-active' : ''}${featured ? ' is-featured' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="ct-mobile-nav-icon"><Icon aria-hidden="true" /></span>
            <span className="ct-mobile-nav-label">{label}</span>
          </NavLink>
        );
      })}
      <NavLink to={accountTo} className={location.pathname === '/dashboard' && location.hash !== '#orders' ? 'is-active' : ''} aria-current={location.pathname === '/dashboard' && location.hash !== '#orders' ? 'page' : undefined}>
        <span className="ct-mobile-nav-icon"><UserRound aria-hidden="true" /></span>
        <span className="ct-mobile-nav-label">{accountLabel}</span>
      </NavLink>
    </nav>
  );
}
