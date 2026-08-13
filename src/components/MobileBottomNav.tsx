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
  const [modalOpen, setModalOpen] = useState(() => document.body.classList.contains('ct-modal-open'));

  useEffect(() => {
    const updateKeyboardState = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      setKeyboardOpen(window.innerHeight - viewport.height > 140);
    };

    const onFocusIn = (event: FocusEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.matches('input, textarea, select, [contenteditable="true"]')) setKeyboardOpen(true);
    };
    const onFocusOut = () => window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active?.matches('input, textarea, select, [contenteditable="true"]')) setKeyboardOpen(false);
    }, 120);

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => setModalOpen(document.body.classList.contains('ct-modal-open')));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const accountTo = useMemo(
    () => user ? '/dashboard' : `/login-otp?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`,
    [location.hash, location.pathname, location.search, user],
  );

  const hidden = keyboardOpen || modalOpen
    || location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/driver')
    || location.pathname === '/login-otp'
    || location.pathname.startsWith('/payment')
    || location.pathname.startsWith('/service-payment');

  if (hidden) return null;

  return (
    <nav className="ct-mobile-bottom-nav" aria-label="ناوبری اصلی موبایل">
      {items.map(({ to, label, Icon, matches, featured }) => {
        const active = matches(location.pathname);
        return (
          <NavLink
            key={label}
            to={to}
            className={`${active ? 'is-active' : ''}${featured ? ' is-featured' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="ct-mobile-nav-icon"><Icon aria-hidden="true" /></span>
            <span className="ct-mobile-nav-label">{label}</span>
          </NavLink>
        );
      })}
      <NavLink
        to={accountTo}
        className={location.pathname === '/dashboard' && location.hash !== '#orders' ? 'is-active' : ''}
        aria-current={location.pathname === '/dashboard' && location.hash !== '#orders' ? 'page' : undefined}
      >
        <span className="ct-mobile-nav-icon"><UserRound aria-hidden="true" /></span>
        <span className="ct-mobile-nav-label">حساب</span>
      </NavLink>
    </nav>
  );
}
