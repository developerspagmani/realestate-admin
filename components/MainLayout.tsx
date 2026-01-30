'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import '@/app/realestate-admin/modern-admin.css';

interface MainLayoutProps {
  children: ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

export default function MainLayout({ children, activePage, hideSidebar = false, hideHeader = false }: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState('250px');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarCollapse = (width: string) => {
    if (!isMobile) {
      setSidebarWidth(width);
    }
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="admin-wrapper overflow-hidden min-vh-100">
      {!hideSidebar && (
        <Sidebar
          activePage={activePage}
          onSidebarCollapse={handleSidebarCollapse}
          showMobile={showMobileSidebar}
          onMobileClose={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 z-index-1000"
          style={{ zIndex: 1040 }}
          onClick={() => setShowMobileSidebar(false)}
        ></div>
      )}

      <main className="main-content flex-grow-1" style={{
        marginLeft: isMobile || hideSidebar ? '0' : sidebarWidth,
        minHeight: '100vh',
        backgroundColor: 'var(--admin-bg)',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!hideHeader && <AdminHeader onMenuClick={toggleMobileSidebar} />}
        <div className={`container-fluid ${hideSidebar || hideHeader ? 'p-0' : 'p-3 p-md-4'}`}>
          {children}
        </div>
      </main>

      <style jsx>{`
        .z-index-1000 { z-index: 1000; }
        .admin-wrapper { display: flex; width: 100%; }
      `}</style>
    </div>
  );
}
