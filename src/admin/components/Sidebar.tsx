import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BadgeCheck,
  Boxes,
  Box,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Droplets,
  FolderKanban,
  Grid3X3,
  Home,
  LayoutTemplate,
  Megaphone,
  MessageSquareText,
  PackageCheck,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Tags,
  UserCog,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ADMIN_ROUTE_GROUP_LABELS, type AdminRoute, type AdminRouteGroup } from '../hooks/useAdminRoutes';

interface SidebarProps {
  navItems: AdminRoute[];
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
  inventory: Boxes,
  support: MessageSquareText,
  discount: Tags,
  roles: UserCog,
  audit: ShieldCheck,
};

const groupOrder: AdminRouteGroup[] = ['today', 'service', 'commerce', 'customers', 'growth', 'finance', 'team', 'system'];
const defaultOpen = new Set<AdminRouteGroup>(['today', 'service']);

function Sidebar({ navItems, isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<AdminRouteGroup>>(new Set(defaultOpen));

  const grouped = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fa');
    const source = normalized
      ? navItems.filter((item) => `${item.label} ${item.description || ''}`.toLocaleLowerCase('fa').includes(normalized))
      : navItems;
    return groupOrder
      .map((group) => ({ group, items: source.filter((item) => item.group === group) }))
      .filter((entry) => entry.items.length > 0);
  }, [navItems, query]);

  useEffect(() => {
    const current = navItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
    if (!current) return;
    setOpenGroups((prev) => new Set(prev).add(current.group));
  }, [location.pathname, navItems]);

  function toggleGroup(group: AdminRouteGroup) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  return (
    <>
      {isOpen && <button type="button" aria-label="بستن منو" onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm md:hidden" />}
      <aside className={`fixed inset-y-0 right-0 z-40 transform border-l border-slate-800 bg-[#0b1220] text-white shadow-2xl transition-all duration-300 md:sticky md:top-[72px] md:h-[calc(100vh-72px)] md:translate-x-0 md:shadow-none ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${isCollapsed ? 'w-24' : 'w-[292px]'}`}>
        <div className={`flex min-h-[82px] items-center border-b border-slate-800 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <div><p className="text-sm font-black">مدیریت Carrtell</p><p className="mt-1 text-[11px] text-slate-400">هر کاری، فقط از یک مسیر واضح</p></div>}
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 p-2 text-slate-400 md:hidden" aria-label="بستن منو"><X className="h-4 w-4" /></button>
          <button type="button" onClick={onToggleCollapse} className="hidden rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:border-amber-400 hover:text-amber-300 md:inline-flex" aria-label={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}>
            {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && <div className="px-3 pt-4"><div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو در پنل..." className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-amber-400" /></div></div>}

        <nav className={`overflow-y-auto px-3 py-4 ${isCollapsed ? 'h-[calc(100vh-150px)]' : 'h-[calc(100vh-196px)]'}`}>
          {isCollapsed ? (
            <div className="space-y-2">
              {navItems.filter((item) => ['dashboard','dispatch','orders','products','customers-crm','settings'].some((key) => item.path.endsWith(key))).map((item) => {
                const Icon = iconMap[item.icon];
                return <NavLink key={item.path} to={item.path} title={item.label} onClick={onClose} className={({ isActive }) => `grid h-12 w-12 place-items-center rounded-2xl transition ${isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}><Icon className="h-5 w-5" /></NavLink>;
              })}
            </div>
          ) : grouped.map(({ group, items }) => {
            const expanded = query.trim() ? true : openGroups.has(group);
            return <section key={group} className="mb-3 rounded-2xl border border-slate-800/80 bg-slate-950/30 p-1.5">
              <button type="button" onClick={() => toggleGroup(group)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-black text-slate-300 hover:bg-slate-900">
                <FolderKanban className="h-4 w-4 text-amber-300" />
                <span className="flex-1">{ADMIN_ROUTE_GROUP_LABELS[group]}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{items.length.toLocaleString('fa-IR')}</span>
                <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && <div className="mt-1 space-y-1">{items.map((item) => {
                const Icon = iconMap[item.icon];
                return <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-900/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${item.badge ? 'bg-amber-300/15' : 'bg-slate-900/80'}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="truncate text-xs">{item.label}</b>{item.badge && <small className="rounded-full bg-slate-950/20 px-2 py-0.5 text-[9px] font-black">{item.badge}</small>}</span>{item.description && <span className={`mt-0.5 block truncate text-[10px] ${item.badge ? 'text-slate-800/70' : 'text-slate-600 group-hover:text-slate-400'}`}>{item.description}</span>}</span>
                </NavLink>;
              })}</div>}
            </section>;
          })}
          {!isCollapsed && grouped.length === 0 && <div className="rounded-2xl border border-dashed border-slate-800 p-5 text-center text-xs font-bold text-slate-500">نتیجه‌ای پیدا نشد.</div>}
          {!isCollapsed && <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-6 text-slate-400"><Megaphone className="mb-2 h-4 w-4 text-amber-300" />کار روزانه را از «داشبورد» یا «عملیات سرویس» شروع کن. ابزارهای تخصصی داخل گروه‌های پایین‌تر هستند.</div>}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
