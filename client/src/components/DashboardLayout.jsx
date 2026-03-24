// components/DashboardLayout.jsx — App shell with sidebar + topbar + AI chatbot
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, title, fullBleed = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} title={title} />
        <main className={fullBleed ? 'page-full' : 'page anim-fade-up'}>
          {children}
        </main>
      </div>
    </div>
  );
}
