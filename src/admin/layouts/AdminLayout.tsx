import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import { useAdminRoutes } from '../hooks/useAdminRoutes';

function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useAdminRoutes();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar
          navItems={navItems}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
