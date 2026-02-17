'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Image from 'next/image';


interface SidebarProps {
  activePage?: string;
  onSidebarCollapse?: (width: string) => void;
  showMobile?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ activePage, onSidebarCollapse, showMobile, onMobileClose }: SidebarProps) {
  const { user, isAuthenticated, isAdmin, isOwner, isUser, isAgent, logout, hasModule } = useAuthContext();
  const { tenantType } = useManagementContext();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Notify parent of sidebar width changes
    if (onSidebarCollapse) {
      onSidebarCollapse(collapsed ? '70px' : '250px');
    }
  }, [collapsed, onSidebarCollapse]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const settingsPath = isAdmin ? '/realestate-admin/settings' : isOwner ? '/realestate-owner-admin/settings' : '/user/settings';

  const getMenuItems = (isAdmin: boolean, isOwner: boolean, isUser: boolean, isAgent: boolean, tenantType: number, hasModule: (m: string) => boolean, activePage?: string, user?: any) => {
    if (!user) return [];

    const labels = {
      properties: tenantType === 2 ? 'Spaces / Centers' : 'Properties',
      units: tenantType === 2 ? 'Workspaces / Desks' : 'Units / Flats',
      bookings: tenantType === 2 ? 'Bookings' : 'Leases & Inquiries',
      leads: 'Leads',
    };

    if (isAdmin) {
      return [
        {
          title: 'Operations',
          items: [
            { href: '/realestate-admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill', active: activePage === 'dashboard' },
            { href: '/realestate-admin/bookings', label: labels.bookings, icon: 'bi-calendar2-check-fill', active: activePage === 'bookings' },
            { href: '/realestate-admin/leads', label: labels.leads, icon: 'bi-person-badge-fill', active: activePage === 'leads' }
          ]
        },
        {
          title: 'Core Management',
          items: [
            { href: '/realestate-admin/properties', label: labels.properties, icon: 'bi-building-fill', active: activePage === 'properties' },
            { href: '/realestate-admin/units', label: labels.units, icon: 'bi-door-open-fill', active: activePage === 'units' },
            { href: '/realestate-admin/owners', label: 'Property Owners', icon: 'bi-person-vcard-fill', active: activePage === 'owners' },
            { href: '/realestate-admin/agents', label: 'Sales Agents', icon: 'bi-briefcase-fill', active: activePage === 'agents' },
            { href: '/realestate-admin/users', label: 'System Users', icon: 'bi-people-fill', active: activePage === 'users' },
          ]
        },
        {
          title: 'Design Studio',
          items: [
            { href: '/realestate-admin/media-library', label: 'Media Library', icon: 'bi-images', active: activePage === 'media-library' },
            { href: '/realestate-admin/plot-map', label: 'Plot Map Manager', icon: 'bi-map-fill', active: activePage === 'plot-map' },
            { href: '/realestate-admin/property-3d', label: '3D Architect Pro', icon: 'bi-vector-pen', active: activePage === 'property-3d' },
            { href: '/realestate-admin/amenities', label: 'Amenities', icon: 'bi-ui-checks-grid', active: activePage === 'amenities' },
            { href: '/realestate-admin/categories', label: 'Categories', icon: 'bi-tags-fill', active: activePage === 'categories' },
          ]
        },
        ...(hasModule('marketing_hub') ? [{
          title: 'Marketing Suite',
          items: [
            { href: '/realestate-admin/marketing', label: 'Marketing Hub', icon: 'bi-megaphone-fill', active: activePage === 'marketing' },
            { href: '/realestate-admin/websites', label: 'Website', icon: 'bi-window-stack', active: activePage === 'websites' },
            { href: '/realestate-admin/cms', label: 'CMS', icon: 'bi-file-earmark-richtext-fill', active: activePage === 'cms' },
            { href: '/realestate-admin/widgets', label: 'Public Widgets', icon: 'bi-code-slash', active: activePage === 'widgets' }
          ]
        }] : []),
        {
          title: 'Administration',
          items: [
            { href: '/realestate-admin/subscriptions', label: 'Subscriptions', icon: 'bi-credit-card-2-front-fill', active: activePage === 'subscriptions' },
            { href: '/realestate-admin/upgrade-requests', label: 'Upgrade Requests', icon: 'bi-rocket-takeoff-fill', active: activePage === 'upgrade-requests' },
            { href: '/realestate-admin/modules', label: 'Feature Modules', icon: 'bi-plugin', active: activePage === 'modules' },
            { href: '/realestate-admin/settings', label: 'Global Settings', icon: 'bi-gear-fill', active: activePage === 'settings' }
          ]
        }
      ];
    }

    if (isOwner) {
      return [
        {
          title: 'Operations',
          items: [
            { href: '/realestate-owner-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', active: activePage === 'dashboard' },
            { href: '/realestate-owner-admin/bookings', label: 'Bookings', icon: 'bi-calendar2-check-fill', active: activePage === 'bookings' },
            { href: '/realestate-owner-admin/leads', label: 'Leads', icon: 'bi-funnel-fill', active: activePage === 'leads' },
            { href: '/realestate-owner-admin/agents', label: 'My Agents', icon: 'bi-person-badge-fill', active: activePage === 'agents' },
          ]
        },
        {
          title: 'Inventory',
          items: [
            { href: '/realestate-owner-admin/properties', label: 'My Properties', icon: 'bi-building-fill', active: activePage === 'properties' },
            { href: '/realestate-owner-admin/units', label: 'Unit Management', icon: 'bi-door-open-fill', active: activePage === 'units' },
            { href: '/realestate-owner-admin/users', label: 'Staff & Users', icon: 'bi-people-fill', active: activePage === 'users' }
          ]
        },
        {
          title: 'Content & Resources',
          items: [
            { href: '/realestate-owner-admin/media-library', label: 'Media Library', icon: 'bi-images', active: activePage === 'media-library' },
            { href: '/realestate-owner-admin/plot-map', label: 'Plot Map Editor', icon: 'bi-map-fill', active: activePage === 'plot-map' },
            { href: '/realestate-owner-admin/amenities', label: 'Amenities', icon: 'bi-ui-checks-grid', active: activePage === 'amenities' },
            { href: '/realestate-owner-admin/categories', label: 'Categories', icon: 'bi-tags-fill', active: activePage === 'categories' },
          ]
        },
        ...(hasModule('marketing_hub') || hasModule('widget_creator') || hasModule('3d_viewer') || hasModule('website') || hasModule('cms') || hasModule('discovery') ? [{
          title: 'Premium Channels',
          items: [
            ...(hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/marketing', label: 'Marketing Hub', icon: 'bi-megaphone-fill', active: activePage === 'marketing' },
            ] : []),
            ...(hasModule('website') || hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/websites', label: 'Website', icon: 'bi-globe', active: activePage === 'websites' },
            ] : []),
            ...(hasModule('cms') || hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/cms', label: 'CMS', icon: 'bi-layers-fill', active: activePage === 'cms' },
            ] : []),
            ...(hasModule('discovery') || hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/chatbot-config', label: 'AI Agent Config', icon: 'bi-robot', active: activePage === 'chatbot-config' },
            ] : []),
            ...(hasModule('widget_creator') || hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/widgets', label: 'Public Widgets', icon: 'bi-code-slash', active: activePage === 'widgets' },
            ] : []),
            ...(hasModule('3d_viewer') || hasModule('marketing_hub') ? [
              { href: '/realestate-owner-admin/property-3d', label: '3D Architect Pro', icon: 'bi-vector-pen', active: activePage === 'property-3d' },
            ] : []),
          ]
        }] : []),
        {
          title: 'Account',
          items: [
            { href: '/realestate-owner-admin/subscriptions', label: 'Subscription Plan', icon: 'bi-credit-card-fill', active: activePage === 'subscriptions' },
            { href: '/realestate-owner-admin/integrations', label: 'Connected Sites', icon: 'bi-link-45deg', active: activePage === 'integrations' },
            { href: '/realestate-owner-admin/settings', label: 'Business Settings', icon: 'bi-gear-fill', active: activePage === 'settings' }
          ]
        }
      ];
    }

    if (isAgent) {
      return [
        {
          title: 'Workforce',
          items: [
            { href: '/realestate-agent/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2', active: activePage === 'dashboard' },
            { href: '/realestate-agent/leads', label: 'My Leads', icon: 'bi-person-badge', active: activePage === 'leads' },
            { href: '/realestate-agent/commissions', label: 'Commissions', icon: 'bi-cash-stack', active: activePage === 'commissions' },
          ]
        },
        {
          title: 'Account',
          items: [
            { href: '/realestate-agent/profile', label: 'My Profile', icon: 'bi-person-circle', active: activePage === 'profile' },
          ]
        }
      ];
    }

    if (isUser) {
      return [
        {
          title: 'Main',
          items: [
            { href: '/user/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', active: activePage === 'dashboard' },
            { href: '/user/bookings', label: 'My Bookings', icon: 'bi-calendar-check', active: activePage === 'bookings' },
            { href: '/workspace', label: 'Find a Space', icon: 'bi-search', active: activePage === 'explore' }
          ]
        },
        {
          title: 'Account',
          items: [
            { href: '/user/profile', label: 'My Profile', icon: 'bi-person', active: activePage === 'profile' },
            { href: '/user/settings', label: 'Settings', icon: 'bi-gear', active: activePage === 'settings' }
          ]
        }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems(isAdmin, isOwner, isUser, isAgent, tenantType, hasModule, activePage, user);

  if (!mounted || !user) {
    return (
      <div className="sidebar bg-white border-end shadow-sm" style={{ width: collapsed ? '70px' : '250px', minHeight: '100vh', position: 'fixed' }}>
        <div className="p-4 border-bottom">
          <div className="bg-primary rounded-3" style={{ width: '32px', height: '32px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      {/* Sidebar navigation */}
      <div
        className={`sidebar bg-white border-end shadow-sm ${collapsed ? 'collapsed' : ''} ${showMobile ? 'show-mobile' : ''}`}
        style={{
          width: collapsed ? '70px' : '250px',
          height: '100vh',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          top: '0',
          left: '0',
          zIndex: '1050',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Mobile Close Button */}
        {showMobile && (
          <button
            className="btn btn-close position-absolute top-0 end-0 m-3 d-lg-none"
            onClick={onMobileClose}
          ></button>
        )}

        {/* Toggle Button (Desktop only) */}
        {!showMobile && (
          <button
            className="btn btn-sm btn-light border shadow-sm position-absolute rounded-circle d-none d-lg-flex"
            style={{
              zIndex: '1051',
              top: '24px',
              right: '-12px',
              width: '24px',
              height: '24px',
              padding: '0',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} small`}></i>
          </button>
        )}

        {/* Logo Section */}
        <div className="p-4 border-bottom d-flex align-items-center gap-2">
          <div className=" d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <Image
              src="/images/Virpnix-logo-icon-svg.svg"
              alt="logo"
              width={40}
              height={40}
              className="img-fluid"
            />
          </div>
          {(!collapsed || showMobile) && (
            <div className="fw-bold text-dark mb-0 text-nowrap letter-spacing-tight">
              VIRPANIX
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-grow-1 overflow-auto px-2 py-4 custom-scrollbar">
          {menuItems.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex} className="mb-4">
              {(!collapsed || showMobile) && (
                <div className="px-3 mb-2">
                  <span className="text-muted text-uppercase fw-bold opacity-50" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    {section.title}
                  </span>
                </div>
              )}
              {section.items.map((item: any) => (
                <div key={item.href} className="mb-1">
                  <a
                    href={item.href}
                    className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${item.active
                      ? 'active bg-primary text-white fw-semibold shadow-sm'
                      : 'text-secondary hover-bg-light'
                      }`}
                    style={{ textDecoration: 'none' }}
                  >
                    <i className={`bi ${item.icon} fs-5`}></i>
                    {(!collapsed || showMobile) && (
                      <span className="text-nowrap">{item.label}</span>
                    )}
                  </a>
                </div>
              ))}
            </div>
          ))}

          {/* Quick Logout Item for Sidebar (Optional, added for convenience) */}
          <div className="px-2 mt-4 pt-4 border-top">
            <button
              onClick={handleLogout}
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all text-danger hover-bg-danger-light w-100 border-0 bg-transparent"
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
              {(!collapsed || showMobile) && <span className="text-nowrap fw-semibold">Logout</span>}
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-top bg-light-soft mt-auto">
          <div className={`d-flex align-items-center gap-3 ${(collapsed && !showMobile) ? 'justify-content-center' : ''}`}>
            <div
              className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{ minWidth: '36px', height: '36px', fontSize: '14px' }}
            >
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            {(!collapsed || showMobile) && (
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-bold text-dark text-truncate small">{user.name}</div>
                <div className="text-muted text-truncate" style={{ fontSize: '10px' }}>{user.email}</div>
              </div>
            )}
            {(!collapsed || showMobile) && (
              <div className="dropdown">
                <button className="btn btn-link btn-sm p-0 border-0" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots-vertical text-muted"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                  <li><h6 className="dropdown-header small text-uppercase fw-bold text-muted">Account</h6></li>
                  <li><a className="dropdown-item d-flex align-items-center gap-2" href={settingsPath}><i className="bi bi-person"></i> Profile</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Logout</button></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-primary-soft {
          background-color: rgba(13, 110, 253, 0.08);
        }
        .bg-light-soft {
          background-color: rgba(0, 0, 0, 0.02);
        }
        .hover-bg-light:hover {
          background-color: rgba(0, 0, 0, 0.04);
          color: #212529 !important;
        }
        .hover-bg-danger-light:hover {
          background-color: rgba(220, 53, 69, 0.08);
          color: #dc3545 !important;
        }
        .transition-all {
          transition: all 0.23s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }
      `}</style>
    </div>
  );
}
