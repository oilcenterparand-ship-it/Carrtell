import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Search, ShoppingCart, User, Car } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'خانه' },
  { to: '/shop', label: 'فروشگاه' },
  { to: '/book', label: 'رزرو سرویس' },
  { to: '/dashboard', label: 'پنل کاربری' },
  { to: '/investor', label: 'سرمایه‌گذاری' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 text-neutral-900 backdrop-blur-xl shadow-lg border-b border-black/5'
          : 'bg-white/90 text-neutral-900 backdrop-blur-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 bg-neutral-950 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-gold-500 text-2xl font-black">C</span>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-black tracking-tight">Carrtell</div>
              <div className="text-[11px] text-neutral-500 font-medium">کارتل خودرو</div>
            </div>
          </Link>

          <div className="hidden lg:flex flex-1 max-w-xl items-center gap-2 bg-neutral-100 border border-neutral-200 rounded-2xl px-4 py-3">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              placeholder="جستجوی روغن، فیلتر، برند یا خودرو..."
              className="w-full bg-transparent outline-none text-sm text-neutral-800 placeholder:text-neutral-400"
            />
          </div>

          <button className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gold-500/10 text-neutral-900 border border-gold-500/30 hover:bg-gold-500/20 transition">
            <Car className="w-4 h-4" />
            <span className="text-sm font-bold">خودروی من</span>
          </button>

          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  location.pathname === link.to
                    ? 'text-neutral-950 bg-gold-500'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/dashboard" className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition">
              <User className="w-5 h-5" />
            </Link>
            <Link to="/shop" className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <a href="tel:0219130" className="hidden lg:flex items-center gap-2 text-sm font-bold text-neutral-600">
              <Phone className="w-4 h-4" />
              ۰۲۱-۹۱۳۰
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden bg-white border-t border-black/5">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 rounded-xl text-sm font-bold ${
                  location.pathname === link.to
                    ? 'text-neutral-950 bg-gold-500'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}