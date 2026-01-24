'use client';

import { useState, useEffect } from 'react';
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
    const router = useRouter();
    const pathname = usePathname();

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

            // Fetch owners (role 3) filtered by industry type on backend
            const userRes = await userService.getOwners(token, {
                limit: '1000',
                industryType: tenantType
            });

            if (userRes.success) {
                const ownersList = userRes.data.users || userRes.data || [];
                console.log(`Owners found for type ${tenantType}:`, ownersList.length);
                setOwners(ownersList);
            }
        };
        fetchOwners();
    }, [tenantType, isAdmin]);

    const handleOwnerChange = (ownerId: string | null) => {
        if (!ownerId) {
            setActiveOwnerAndTenant(null, null);
            return;
        }

        const selectedOwner = owners.find(o => o.id === ownerId);
        if (selectedOwner) {
            setActiveOwnerAndTenant(ownerId, selectedOwner.tenantId);
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

                    {/* Command Center for Admins - Hidden in Owner Portal */}
                    {isAdmin && !pathname.includes('/realestate-owner-admin') && (
                        <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-3 ms-2 border border-info-subtle">
                            <i className="bi bi-layers-half text-info ms-2"></i>
                            <select
                                className="form-select form-select-sm border-0 bg-transparent fw-bold text-info"
                                style={{ width: 'auto' }}
                                value={tenantType}
                                onChange={(e) => setTenantType(parseInt(e.target.value))}
                            >
                                <option value={1}>🏠 Real Estate</option>
                                <option value={2}>🏢 Coworking</option>
                            </select>
                            <select
                                className="form-select form-select-sm border-0 bg-transparent"
                                style={{ width: 'auto', maxWidth: '200px' }}
                                value={activeOwnerId || ''}
                                onChange={(e) => handleOwnerChange(e.target.value || null)}
                            >
                                <option value="">Select Property Owner</option>
                                {owners.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
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
            `}</style>
        </header>
    );
}
