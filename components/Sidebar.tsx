'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Image from 'next/image';
import Link from 'next/link';
import ConfirmationModal from '@/components/common/ConfirmationModal';


interface SidebarProps {
  activePage?: string;
  onSidebarCollapse?: (width: string) => void;
  showMobile?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ activePage, onSidebarCollapse, showMobile, onMobileClose }: SidebarProps) {
  const { user, isAuthenticated, isAdmin, isOwner, isUser, isAgent, logout, hasModule } = useAuthContext();
  const { tenantType } = useManagementContext();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar_open_menus');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { }
      }
    }
    return {};
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(collapsed));
    }
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_open_menus', JSON.stringify(openMenus));
    }
  }, [openMenus]);

  // Restore scroll position
  useEffect(() => {
    if (mounted && scrollContainerRef.current) {
      const savedScroll = sessionStorage.getItem('sidebar_scroll_top');
      if (savedScroll) {
        scrollContainerRef.current.scrollTop = parseInt(savedScroll);
      }
    }
  }, [mounted]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem('sidebar_scroll_top', String(scrollContainerRef.current.scrollTop));
    }
  };

  useEffect(() => {
    // Notify parent of sidebar width changes
    if (onSidebarCollapse) {
      onSidebarCollapse(collapsed ? '70px' : '280px');
    }
  }, [collapsed, onSidebarCollapse]);

  const handleLogoutInitiate = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const settingsPath = isAdmin ? '/realestate-admin/settings' : isOwner ? '/realestate-owner-admin/settings' : isAgent ? '/realestate-agent/profile' : '/user/settings';

  const getMenuItems = (isAdmin: boolean, isOwner: boolean, isUser: boolean, isAgent: boolean, tenantType: number, hasModule: (m: string) => boolean, activePage?: string, user?: any) => {
    if (!user) return [];

    const labels = {
      properties: tenantType === 2 ? 'Spaces / Centers' : 'Properties',
      units: tenantType === 2 ? 'Workspaces / Desks' : 'Units / Flats',
      bookings: 'Site Visits',
      leads: 'Leads',
    };

    const adminPrefix = isAdmin ? '/realestate-admin' : '/realestate-owner-admin';

    if (isAdmin || isOwner) {
      return [
        {
          title: 'Operations',
          items: [
            { href: `${adminPrefix}/dashboard`, label: 'Dashboard', icon: 'bi-grid-1x2-fill', active: activePage === 'dashboard' },
            {
              href: `${adminPrefix}/leads`,
              label: labels.leads,
              icon: 'bi-funnel-fill',
              active: activePage === 'leads' || activePage === 'leads-qualification',
              children: [
                { href: `${adminPrefix}/leads`, label: 'Lead Pipeline', icon: 'bi-kanban', active: activePage === 'leads' },
                { href: `${adminPrefix}/leads/qualification`, label: 'Qualification Hub', icon: 'bi-lightning-charge-fill', active: activePage === 'leads-qualification' }
              ]
            },
            { href: `${adminPrefix}/bookings`, label: labels.bookings, icon: 'bi-calendar2-check-fill', active: activePage === 'bookings' },
          ]
        },
        {
          title: 'Inventory',
          items: [
            { href: `${adminPrefix}/properties`, label: labels.properties, icon: 'bi-building-fill', active: activePage === 'properties' },
            { href: `${adminPrefix}/units`, label: labels.units, icon: 'bi-door-open-fill', active: activePage === 'units' },
            { href: `${adminPrefix}/media-library`, label: 'Media Library', icon: 'bi-images', active: activePage === 'media-library' },
            { href: `${adminPrefix}/amenities`, label: 'Amenities', icon: 'bi-ui-checks-grid', active: activePage === 'amenities' },
            { href: `${adminPrefix}/categories`, label: 'Categories', icon: 'bi-tags-fill', active: activePage === 'categories' },
          ]
        },
        {
          title: 'Marketing',
          items: [
            {
              href: `${adminPrefix}/websites`,
              label: 'Website',
              icon: 'bi-window-stack',
              active: activePage === 'websites' || activePage === 'cms' || activePage === 'popups' || activePage === 'widgets',
              children: [
                { href: `${adminPrefix}/websites`, label: 'Website Hub', icon: 'bi-globe', active: activePage === 'websites' },
                { href: `${adminPrefix}/cms`, label: 'CMS', icon: 'bi-file-earmark-richtext-fill', active: activePage === 'cms' },
                { href: `${adminPrefix}/popups`, label: 'Popups & Banners', icon: 'bi-megaphone-fill', active: activePage === 'popups' },
                { href: `${adminPrefix}/widgets`, label: 'Public Widgets', icon: 'bi-bounding-box', active: activePage === 'widgets' },
              ]
            },
            {
              href: `${adminPrefix}/marketing`,
              label: 'Email Campaigns',
              icon: 'bi-envelope-paper-heart-fill',
              active: activePage === 'marketing' || activePage === 'intelligent-email' || activePage === 'email-config',
              children: [
                { href: `${adminPrefix}/marketing`, label: 'Email Marketing', icon: 'bi-envelope', active: activePage === 'marketing' },
                { href: `${adminPrefix}/marketing/intelligent`, label: 'Intelligent Email', icon: 'bi-stars', active: activePage === 'intelligent-email' },
                { href: `${adminPrefix}/marketing/config`, label: 'Email Configuration', icon: 'bi-gear', active: activePage === 'email-config' },
              ]
            },
            { href: `${adminPrefix}/brochures`, label: 'Brochures', icon: 'bi-file-earmark-pdf-fill', active: activePage === 'brochures' },
            { href: `${adminPrefix}/plot-map`, label: 'Plot Map Editor', icon: 'bi-map-fill', active: activePage === 'plot-map' },
            ...(isOwner ? [{ href: '/realestate-owner-admin/tasks', label: 'Task Management', icon: 'bi-check2-square', active: activePage === 'tasks' }] : []),
          ]
        },
        {
          title: 'Sales & Intelligence',
          items: [
            {
              href: `${adminPrefix}/analytics`,
              label: 'Sales Analytics',
              icon: 'bi-graph-up-arrow',
              active: activePage === 'analytics' || activePage === 'deal-intelligence' || activePage === 'deal-prevention' || activePage === 'forecasting' || activePage === 'prop-intel' || activePage === 'propintel',
              children: [
                { href: `${adminPrefix}/analytics`, label: 'Performance Dashboard', icon: 'bi-speedometer2', active: activePage === 'analytics' },
                { href: `${adminPrefix}/analytics/deal-intelligence`, label: 'Deal Intelligence', icon: 'bi-shield-x', active: activePage === 'deal-intelligence' },
                { href: `${adminPrefix}/analytics/deal-prevention`, label: 'Deal Prevention', icon: 'bi-shield-check', active: activePage === 'deal-prevention' },
                { href: `${adminPrefix}/analytics/forecasting`, label: 'Forecasting AI', icon: 'bi-magic', active: activePage === 'forecasting' },
                { href: `${adminPrefix}/analytics/prop-intel`, label: 'PropIntel™ AI', icon: 'bi-robot', active: activePage === 'prop-intel' || activePage === 'propintel' },
              ]
            },
            { href: `${adminPrefix}/agents`, label: 'Sales Agents', icon: 'bi-people-fill', active: activePage === 'agents' },
          ]
        },
        {
          title: 'Administration',
          items: [
            { href: `${adminPrefix}/subscriptions`, label: 'Subscriptions', icon: 'bi-credit-card-2-front-fill', active: activePage === 'subscriptions' },
            ...(isAdmin ? [
              { href: '/realestate-admin/tenants', label: 'Tenants & Workspaces', icon: 'bi-buildings', active: activePage === 'tenants' },
              { href: '/realestate-admin/owners', label: 'Property Owners', icon: 'bi-person-vcard-fill', active: activePage === 'owners' },
              { href: '/realestate-admin/users', label: 'System Users', icon: 'bi-people-fill', active: activePage === 'users' },
              { href: '/realestate-admin/partners', label: 'Partner Management', icon: 'bi-person-hearts', active: activePage === 'partners' },
              { href: '/realestate-admin/modules', label: 'Feature Modules', icon: 'bi-plugin', active: activePage === 'modules' },
            ] : [
              { href: '/realestate-owner-admin/users', label: 'Staff & Users', icon: 'bi-people-fill', active: activePage === 'users' },
              { href: '/realestate-owner-admin/integrations', label: 'Connected Sites', icon: 'bi-link-45deg', active: activePage === 'integrations' },
            ]),
            { href: `${adminPrefix}/help`, label: 'Knowledge Base', icon: 'bi-question-circle-fill', active: activePage === 'help' },
            { href: `${adminPrefix}/settings`, label: 'Global Settings', icon: 'bi-gear-fill', active: activePage === 'settings' }
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
            { href: '/realestate-agent/attention', label: 'Attention', icon: 'bi-exclamation-triangle', active: activePage === 'attention' },
            { href: '/realestate-agent/leads', label: 'My Leads', icon: 'bi-person-badge', active: activePage === 'leads' },
            { href: '/realestate-agent/bookings', label: 'Visits & Tours', icon: 'bi-calendar-event', active: activePage === 'bookings' },
            { href: '/realestate-agent/tasks', label: 'My Tasks', icon: 'bi-check2-square', active: activePage === 'tasks' },
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

  const baseMenuItems = getMenuItems(isAdmin, isOwner, isUser, isAgent, tenantType, hasModule, activePage, user);

  // Recursively apply active state based on pathname to prevent visual glitches during routing
  // and handle complex sub-routes properly
  const menuItems = baseMenuItems.map((section: any) => ({
    ...section,
    items: section.items.map((item: any) => {
      // Parent is active if its ID matches OR its href matches OR it's a prefix
      const isItemActive = item.active || (pathname && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))));

      return {
        ...item,
        active: isItemActive,
        children: item.children ? item.children.map((child: any) => {
          // For children, be more strict: only active if explicit ID matches OR exact href match
          // This prevents '/analytics' from matching '/analytics/forecasting'
          const isChildActive = child.active || (pathname && pathname === child.href);
          return {
            ...child,
            active: isChildActive
          };
        }) : undefined
      };
    })
  }));

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim() === ''
    ? menuItems
    : menuItems.map((section: any) => ({
      ...section,
      items: section.items.filter((item: any) => {
        const itemMatch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        const childrenMatch = item.children?.some((child: any) => child.label.toLowerCase().includes(searchQuery.toLowerCase()));
        return itemMatch || childrenMatch;
      }).map((item: any) => ({
        ...item,
        children: item.children?.filter((child: any) => child.label.toLowerCase().includes(searchQuery.toLowerCase()))
      }))
    })).filter((section: any) => section.items.length > 0);

  if (!user) {
    return (
      <div className="sidebar bg-white border-end shadow-sm" style={{ width: collapsed ? '70px' : '280px', minHeight: '100vh', position: 'fixed' }}>
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
          width: collapsed ? '70px' : '280px',
          height: '100vh',
          transition: isMounting || !mounted ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        <div className="p-4 border-bottom d-flex align-items-center justify-content-center gap-2">
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

        {/* Search Bar Section */}
        {(!collapsed || showMobile) && (
          <div className="px-3 mb-3 mt-3">
            <div className="input-group input-group-sm bg-light rounded-3 overflow-hidden border-0">
              <span className="input-group-text bg-transparent border-1 pe-1">
                <i className="bi bi-search text-muted small"></i>
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-1 ps-1 py-2 small"
                placeholder="Quick Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '11px' }}
              />
              {searchQuery && (
                <button
                  className="btn btn-link btn-sm text-muted p-1 me-1 text-decoration-none"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle-fill opacity-50"></i>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow-1 overflow-auto px-2 py-2 custom-scrollbar"
        >
          {filteredMenuItems.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex} className="mb-4">
              {(!collapsed || showMobile) && (
                <div className="px-3 mb-2">
                  <span className="text-muted text-uppercase fw-bold opacity-50" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    {section.title}
                  </span>
                </div>
              )}
              {section.items.map((item: any) => {
                const hasChildren = item.children && item.children.length > 0;
                const isParentActive = item.active || (hasChildren && item.children.some((c: any) => c.active));
                const isOpen = !!openMenus[item.label] || (searchQuery.trim() !== '' && hasChildren);

                return (
                  <div key={item.label} className="mb-1">
                    {hasChildren ? (
                      <>
                        <div
                          onClick={() => setOpenMenus(prev => ({ ...prev, [item.label]: !isOpen }))}
                          className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all cursor-pointer ${isParentActive
                            ? 'bg-light text-primary fw-semibold'
                            : 'text-secondary hover-bg-light'
                            }`}
                          style={{ textDecoration: 'none', cursor: 'pointer' }}
                        >
                          <i className={`bi ${item.icon} fs-5`}></i>
                          {(!collapsed || showMobile) && (
                            <>
                              <span className="text-nowrap">{item.label}</span>
                              <i className={`bi bi-chevron-${isOpen ? 'down' : 'right'} ms-auto small opacity-50`}></i>
                            </>
                          )}
                        </div>
                        {isOpen && (!collapsed || showMobile) && (
                          <div className="ms-3 mt-1 border-start ps-1">
                            {item.children.map((child: any) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all small ${child.active ? 'active bg-primary text-white fw-semibold shadow-sm' : 'text-secondary hover-bg-light'
                                  }`}
                                style={{ textDecoration: 'none' }}
                              >
                                <i className={`bi ${child.icon} fs-6`}></i>
                                <span className="text-nowrap">{child.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
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
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Quick Logout Item for Sidebar (Optional, added for convenience) */}
          {/* <div className="px-2 mt-4 pt-4 border-top">
            <button
              onClick={handleLogoutInitiate}
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all text-danger hover-bg-danger-light w-100 border-0 bg-transparent"
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
              {(!collapsed || showMobile) && <span className="text-nowrap fw-semibold">Logout</span>}
            </button>
          </div> */}
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
                  <li><Link className="dropdown-item d-flex align-items-center gap-2" href={settingsPath}><i className="bi bi-person"></i> Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={handleLogoutInitiate}><i className="bi bi-box-arrow-right"></i> Logout</button></li>
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

      <ConfirmationModal
        show={showLogoutModal}
        title="Logging Out?"
        message="Are you sure you want to end your session? We'll be here when you're ready to close more deals."
        confirmText="Yes, Logout"
        cancelText="Stay Here"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />
    </div>
  );
}
