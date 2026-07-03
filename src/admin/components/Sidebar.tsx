import { NavLink } from 'react-router-dom';
import { X, Home, Box, Users, Settings2 } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: 'home' | 'box' | 'users' | 'settings';
}

interface SidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  home: Home,
  box: Box,
  users: Users,
  settings: Settings2,
};

function Sidebar({ navItems, isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-slate-900/95 pb-10 shadow-2xl backdrop-blur transition-transform duration-300 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-200">پنل مدیریت</p>
          <p className="text-xs text-slate-400">مدیریت سریع محتوا</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="mt-4 px-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xl'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
