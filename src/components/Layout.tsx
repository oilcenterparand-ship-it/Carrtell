import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Phone,
  Search,
  ShoppingCart,
  User,
  Car,
  CalendarDays,
  Grid3X3,
} from 'lucide-react';

const navLinks = [
  { to: '/', label: 'خانه' },
  { to: '/shop', label: 'فروشگاه' },
  { to: '/book', label: 'رزرو سرویس' },
  { to: '/dashboard', label: 'پنل کاربری' },
  { to: '/investor', label: 'سرمایه‌گذاری' },
];
function CarrtellLogo() {
  return (
    <Link to="/" className="flex items-center shrink-0">
      <img
        src="/brand/logo.png"
        alt="Carrtell"
        className="h-16 w-auto object-contain"
      />
    </Link>
  );
}
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 text-neutral-950 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5'
          : 'bg-white/90 backdrop-blur-xl'
      }`}
    >
      <div className="border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-4">
          <CarrtellLogo />

          <button className="hidden lg:flex items-center gap-2 rounded-2xl bg-neutral-950 text-white px-5 py-3 font-bold hover:bg-neutral-800 transition">
            <Car className="w-5 h-5 text-gold-500" />
            خودروی من
          </button>

          <div className="hidden md:flex flex-1 items-center gap-3 rounded-2xl bg-neutral-100 border border-neutral-200 px-5 py-3.5 focus-within:border-gold-400 transition">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              className="w-full bg-transparent outline-none text-sm text-neutral-700 placeholder:text-neutral-400"
              placeholder="جستجوی روغن، فیلتر، برند یا خودرو..."
            />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="tel:0219130"
              className="hidden xl:flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-600 hover:border-gold-400 hover:text-neutral-950 transition"
            >
              <Phone className="w-4 h-4" />
              ۰۲۱-۹۱۳۰
            </a>

            <Link
              to="/dashboard"
              className="h-12 w-12 rounded-2xl border border-neutral-200 flex items-center justify-center hover:border-gold-400 hover:bg-gold-50 transition"
              aria-label="پنل کاربری"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              to="/shop"
              className="relative h-12 w-12 rounded-2xl border border-neutral-200 flex items-center justify-center hover:border-gold-400 hover:bg-gold-50 transition"
              aria-label="سبد خرید"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -left-1 h-5 min-w-5 rounded-full bg-gold-500 text-neutral-950 text-xs font-black flex items-center justify-center">
                ۰
              </span>
            </Link>

            <Link
              to="/book"
              className="h-12 rounded-2xl bg-gold-500 px-5 flex items-center gap-2 font-black text-neutral-950 hover:bg-gold-400 transition shadow-lg shadow-gold-500/20"
            >
              <CalendarDays className="w-5 h-5" />
              رزرو سرویس
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="xl:hidden mr-auto h-12 w-12 rounded-2xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="hidden xl:block bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-neutral-800 hover:bg-neutral-100 transition">
              <Grid3X3 className="w-5 h-5" />
              دسته‌بندی کالاها
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  location.pathname === link.to
                    ? 'text-gold-600 bg-gold-50'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm text-neutral-500">
            فروش محصولات خودرو + سرویس در محل
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden bg-white border-t border-neutral-100 shadow-xl">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 border border-neutral-200 px-4 py-3">
              <Search className="w-5 h-5 text-neutral-400" />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="جستجو..."
              />
            </div>

            <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-white px-5 py-3 font-bold">
              <Car className="w-5 h-5 text-gold-500" />
              انتخاب خودروی من
            </button>

            <nav className="space-y-1">
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
        </div>
      )}
    </header>
  );
}