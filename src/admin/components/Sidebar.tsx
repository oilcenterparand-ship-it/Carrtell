import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BadgeCheck,
  Box,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Droplets,
  Grid3X3,
  Home,
  LayoutTemplate,
  MessageSquareText,
  PackageCheck,
  Palette,
  Search,
  Send,
  Settings2,
  Users,
  Wrench,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: 'home' | 'homeContent' | 'box' | 'orders' | 'service' | 'reviews' | 'sms' | 'brand' | 'package' | 'category' | 'oil' | 'car' | 'users' | 'settings' | 'payment';
}

interface SidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const iconMap = {
  home: Home,
  homeContent: LayoutTemplate,
  box: Box,
  orders: ClipboardList,
  service: Wrench,
  reviews: MessageSquareText,
  sms: Send,
  brand: BadgeCheck,
  package: PackageCheck,
  category: Grid3X3,
  oil: Droplets,
  car: CarFront,
  users: Users,
  settings: Settings2,
  payment: CreditCard,
};

function Sidebar({ navItems, isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fa');
    if (!normalized) return navItems;
    return navItems.filter((item) => item.label.toLocaleLowerCase('fa').includes(normalized));
  }, [navItems, query]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 transform border-l border-slate-200 bg-white shadow-2xl transition-all duration-300 md:sticky md:top-[72px] md:h-[calc(100vh-72px)] md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isCollapsed ? 'w-24' : 'w-72'}`}
      >
        <div className={`flex min-h-[86px] items-center border-b border-slate-100 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-black text-slate-900">پنل مدیریت Carrtell</p>
              <p className="mt-1 text-xs text-slate-500">کنترل فروشگاه و خدمات</p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 md:hidden"
            aria-label="بستن منو"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 md:inline-flex"
            aria-label={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            title={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          >
            {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-3 pt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جست‌وجوی منو..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-xs font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
              />
            </div>
          </div>
        )}

        <nav className={`overflow-y-auto px-3 py-4 ${isCollapsed ? 'h-[calc(100vh-158px)]' : 'h-[calc(100vh-205px)]'} space-y-1`}>
          {filteredItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-2xl py-2.5 text-sm font-bold transition ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5 group-hover:bg-white">
                  <Icon className="h-4 w-4" />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}

          {!isCollapsed && filteredItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
              نتیجه‌ای پیدا نشد.
            </div>
          )}

          <div className="my-3 border-t border-slate-100" />

          <NavLink
            to="/admin/appearance"
            onClick={onClose}
            title={isCollapsed ? 'ظاهر سایت' : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-2xl py-2.5 text-sm font-bold transition ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <Palette className="h-4 w-4" />
            </span>
            {!isCollapsed && 'ظاهر سایت'}
          </NavLink>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
