'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { tenantService, userService, getAuthToken } from '@/app/services/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const { user, logout, isAdmin, isOwner } = useAuthContext();
    const {
        tenantType, setTenantType,
        activeTenantId, setActiveTenantId,
        activeOwnerId, setActiveOwnerId,
        setActiveOwnerAndTenant
    } = useManagementContext();

    const [owners, setOwners] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.body.addEventListener('mousedown', handleClickOutside);
        return () => document.body.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOwners = owners.filter(o =>
        o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);


    // Fetch Owners when tenant type changes
    useEffect(() => {
        if (!isAdmin) return;

        const fetchOwners = async () => {
            const token = getAuthToken();
            if (!token) return;

            // Fetch all owners (role 3)
            const userRes = await userService.getOwners(token, {
                limit: '1000'
            });

            if (userRes.success) {
                const ownersList = userRes.data.users || userRes.data || [];
                console.log(`Global owners found:`, ownersList.length);
                setOwners(ownersList);
            }
        };
        fetchOwners();
    }, [isAdmin]);

    const handleOwnerChange = (ownerId: string | null) => {
        if (!ownerId) {
            setActiveOwnerAndTenant(null, null);
            return;
        }

        const selectedOwner = owners.find(o => o.id === ownerId);
        if (selectedOwner) {
            console.log('AdminHeader: Switching to owner:', selectedOwner.name, 'Tenant ID:', selectedOwner.tenantId);
            setActiveOwnerAndTenant(ownerId, selectedOwner.tenantId);
            // If the owner's tenant has a specific industry type, switch to it
            // Based on API: selectedOwner might have tenant nested
            if (selectedOwner.tenant?.type) {
                setTenantType(Number(selectedOwner.tenant.type));
            } else if (selectedOwner.tenantType) {
                setTenantType(Number(selectedOwner.tenantType));
            }
        } else {
            console.warn('AdminHeader: Owner not found in list:', ownerId);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            logout();
            router.push('/login');
        }
    };

    if (!user) return null;

    const roleLabel = isAdmin ? 'System Administrator' : isOwner ? 'Property Owner' : 'Standard User';
    const settingsPath = isAdmin ? '/realestate-admin/settings' : isOwner ? '/realestate-owner-admin/settings' : '/user/settings';
    const profilePath = isAdmin ? '/user/profile' : isOwner ? '/user/profile' : '/user/profile'; // Assuming profile is shared

    return (
        <header className="admin-header bg-white border-bottom sticky-top shadow-sm px-3 px-md-4">
            <div className="d-flex align-items-center justify-content-between h-100" style={{ height: '70px' }}>

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn-icon d-lg-none me-2"
                    onClick={onMenuClick}
                >
                    <i className="bi bi-list fs-3"></i>
                </button>

                {/* Left Side: Search & Welcome */}
                <div className="d-flex align-items-center gap-4 flex-grow-1">
                    <div className="search-bar position-relative d-none d-md-block" style={{ maxWidth: '300px', width: '100%' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control bg-light border-0 ps-5 py-2 rounded-3 fs-14"
                            placeholder="Search everything..."
                        />
                    </div>

                    {/* Searchable Company Selector for Admins */}
                    {isAdmin && !pathname.includes('/realestate-owner-admin') && (
                        <div className="company-selector-wrapper ms-2" ref={dropdownRef}>
                            <div
                                className="d-flex align-items-center gap-2 bg-light p-2 rounded-3 border border-primary-subtle cursor-pointer transition-all hover-shadow-sm"
                                style={{ minWidth: '240px' }}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <i className="bi bi-building-fill text-primary ms-1"></i>
                                <div className="flex-grow-1">
                                    <div className="extra-small text-muted text-uppercase fw-bold line-height-1" style={{ fontSize: '9px' }}>Property Company</div>
                                    <div className="fw-bold text-dark fs-14 line-height-1">
                                        {owners.find(o => o.id === activeOwnerId)?.name || 'Select Company'}
                                    </div>
                                </div>
                                <i className={`bi bi-chevron-${isDropdownOpen ? 'up' : 'down'} text-muted extra-small me-1`}></i>
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu show border-0 shadow-lg mt-2 p-0 rounded-4 overflow-hidden animate-fade-in" style={{ width: '300px', position: 'absolute', zIndex: 1050 }}>
                                    <div className="p-3 bg-light border-bottom">
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-white border-end-0">
                                                <i className="bi bi-search text-muted small"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-0"
                                                placeholder="Search company or email..."
                                                autoFocus
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="owners-list overflow-auto" style={{ maxHeight: '350px' }}>
                                        <button
                                            className={`dropdown-item py-2 px-3 border-bottom d-flex align-items-center gap-3 ${!activeOwnerId ? 'bg-primary-subtle' : ''}`}
                                            onClick={() => {
                                                handleOwnerChange(null);
                                                setIsDropdownOpen(false);
                                                setSearchTerm('');
                                            }}
                                        >
                                            <i className="bi bi-slash-circle text-muted"></i>
                                            <div>
                                                <div className="fw-bold small">Clear Selection</div>
                                                <div className="extra-small text-muted">View all platform data</div>
                                            </div>
                                        </button>

                                        {filteredOwners.length > 0 ? (
                                            filteredOwners.map(o => (
                                                <button
                                                    key={o.id}
                                                    className={`dropdown-item py-2 px-3 border-bottom d-flex align-items-center gap-3 ${activeOwnerId === o.id ? 'bg-primary-subtle' : ''}`}
                                                    onClick={() => {
                                                        handleOwnerChange(o.id);
                                                        setIsDropdownOpen(false);
                                                        setSearchTerm('');
                                                    }}
                                                >
                                                    <div className="avatar avatar-sm bg-primary-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                        {o.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="fw-bold text-dark text-truncate small">{o.name || 'Unnamed Company'}</div>
                                                        <div className="extra-small text-muted text-truncate">{o.email || 'No email provided'}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-muted">
                                                <i className="bi bi-building-exclamation fs-3 mb-2 d-block"></i>
                                                <div className="small">No companies found</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Utils & Profile */}
                <div className="d-flex align-items-center gap-3">

                    {/* Time & Date Display (Hidden on smaller screens) */}
                    <div className="d-none d-lg-flex flex-column text-end me-3">
                        <span className="fw-bold text-dark small">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-muted extra-small">
                            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    {/* Quick Utils */}
                    <div className="d-flex align-items-center gap-2 border-end pe-3 me-2">
                        <button className="btn btn-icon btn-light-soft rounded-3 position-relative" title="Quick Support">
                            <i className="bi bi-question-circle text-muted"></i>
                        </button>
                        <button className="btn btn-icon btn-light-soft rounded-3 position-relative" title="Notifications">
                            <i className="bi bi-bell text-muted"></i>
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                <span className="visually-hidden">New alerts</span>
                            </span>
                        </button>
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn d-flex align-items-center gap-3 p-1 rounded-pill hover-bg-light border-0"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <div className="d-none d-md-block text-end">
                                <div className="fw-bold text-dark fs-14 line-height-1 mb-0">{user.name}</div>
                                <div className="text-muted extra-small line-height-1">{roleLabel}</div>
                            </div>
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>
                                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 py-2 rounded-4" style={{ minWidth: '220px' }}>
                            <li className="px-3 py-2 border-bottom mb-2">
                                <div className="fw-bold text-dark">{user.name}</div>
                                <div className="text-muted extra-small">{user.email}</div>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center gap-3 py-2" href={profilePath}>
                                    <i className="bi bi-person-circle text-primary fs-5"></i>
                                    <span>My Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center gap-3 py-2" href={settingsPath}>
                                    <i className="bi bi-gear-fill text-primary fs-5"></i>
                                    <span>Account Settings</span>
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center gap-3 py-2" href="#">
                                    <i className="bi bi-shield-check text-primary fs-5"></i>
                                    <span>Security Logs</span>
                                </Link>
                            </li>
                            <li><hr className="dropdown-divider opacity-50" /></li>
                            <li>
                                <button className="dropdown-item d-flex align-items-center gap-3 py-2 text-danger" onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right fs-5"></i>
                                    <span className="fw-bold">Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .admin-header {
                    height: 70px;
                    z-index: 999;
                }
                .fs-14 { font-size: 14px; }
                .extra-small { font-size: 11px; }
                .line-height-1 { line-height: 1.2; }
                .btn-icon { width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; }
                .btn-light-soft { background: rgba(0,0,0,0.03); border: none; }
                .btn-light-soft:hover { background: rgba(0,0,0,0.06); }
                .hover-bg-light:hover { background: rgba(0,0,0,0.04); }
                .dropdown-item { transition: all 0.2s; border-radius: 8px; margin: 0 8px; width: calc(100% - 16px); }
                .dropdown-item:hover { background-color: rgba(13, 110, 253, 0.08); color: #0d6efd; }
                .cursor-pointer { cursor: pointer; }
                .hover-shadow-sm:hover { box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); border-color: #0d6efd !important; }
                .bg-primary-light { background-color: rgba(13, 110, 253, 0.1); }
                .avatar-sm { flex-shrink: 0; }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </header>
    );
}
