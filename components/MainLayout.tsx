'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import { useAuthContext } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import '@/app/realestate-admin/modern-admin.css';
import Footer from '@/components/common/footer';
import CookieConsent from '@/components/common/CookieConsent';
import { useManagementContext } from '@/app/contexts/ManagementContext';

interface MainLayoutProps {
  children: ReactNode;
  activePage?: string;
  hideSidebar?: boolean;
  hideHeader?: boolean;
}

export default function MainLayout({ children, activePage, hideSidebar = false, hideHeader = false }: MainLayoutProps) {
  const { user, isOwner } = useAuthContext();
  const { activeTenant } = useManagementContext();
  const [sidebarWidth, setSidebarWidth] = useState('250px');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showTrialBar, setShowTrialBar] = useState(true);

  const showCookieBanner = activeTenant?.settings?.privacy?.cookieNotice ?? true;
  const privacyLink = activeTenant?.settings?.privacy?.privacyLink;
  const termsLink = activeTenant?.settings?.privacy?.termsLink;

  // Trial calculations
  const isTrial = isOwner && user?.subscriptionStatus === 3 && showTrialBar;
  const daysLeft = user?.subscriptionExpiresAt
    ? Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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

  const handleCloseTrialBar = () => {
    setShowTrialBar(false);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="admin-wrapper overflow-hidden min-vh-100 flex-column">
      {isTrial && (
        <div className="trial-bar bg-primary text-white py-2 px-3 d-flex justify-content-between align-items-center position-fixed top-0 start-0 w-100 shadow-sm" style={{ zIndex: 1100, height: '60px' }}>
          <div className="d-flex align-items-center gap-2 small">
            <i className="bi bi-clock-history"></i>
            <span>You are in trial period. <strong>{daysLeft} days remaining</strong>. Upgrade to manage data without any loss.</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Link href="/realestate-owner-admin/settings?tab=subscription" className="btn btn-light btn-sm rounded-4 px-3 fw-bold">
              Upgrade Now
            </Link>
            <button
              className="btn btn-link text-white p-0 border-0 opacity-75 hvr-scale"
              onClick={handleCloseTrialBar}
              title="Close notification"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}

      <div className="d-flex w-100" style={{ marginTop: isTrial ? '60px' : '0' }}>
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

        <main className="main-content flex-grow-1 d-flex flex-column" style={{
          marginLeft: isMobile || hideSidebar ? '0' : sidebarWidth,
          minHeight: isTrial ? 'calc(100vh - 60px)' : '100vh',
          minWidth: 0,
          backgroundColor: 'var(--admin-bg)',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {!hideHeader && <AdminHeader onMenuClick={toggleMobileSidebar} />}
          <div className={`container-fluid flex-grow-1 ${hideSidebar || hideHeader ? 'p-0' : 'p-3 p-md-4'}`} style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>
          <Footer />
        </main>

        {showCookieBanner && (
          <CookieConsent
            privacyLink={privacyLink}
            termsLink={termsLink}
          />
        )}

        <style jsx>{`
        .z-index-1000 { z-index: 1000; }
        .admin-wrapper { display: flex; width: 100%; }
      `}</style>
      </div>
    </div>
  );
}
