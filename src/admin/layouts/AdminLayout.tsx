import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import { useAdminRoutes } from '../hooks/useAdminRoutes';

function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navItems = useAdminRoutes();

  return (
    <div dir="rtl" className="min-h-screen bg-[#070d17] text-slate-100">
      <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1920px]">
        <Sidebar navItems={navItems} isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)} />
        <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.05),transparent_26%),#070d17] p-3 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-[1540px]"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
