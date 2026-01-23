'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

interface MainLayoutProps {
  children: ReactNode;
  activePage?: string;
}

export default function MainLayout({ children, activePage }: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState('210px');

  const handleSidebarCollapse = (width: string) => {
    setSidebarWidth(width);
  };

  return (
    <div className="d-flex">
      <Sidebar activePage={activePage} onSidebarCollapse={handleSidebarCollapse} />
      <main className="flex-grow-1" style={{
        marginLeft: sidebarWidth,
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        transition: 'margin-left 0.3s ease'
      }}>
        <AdminHeader />
        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
