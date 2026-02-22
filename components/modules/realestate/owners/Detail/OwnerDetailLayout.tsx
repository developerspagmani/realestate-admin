'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { userService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Link from 'next/link';

interface OwnerDetailLayoutProps {
    children: React.ReactNode;
    mode: 'admin' | 'realestate-admin';
}

export default function OwnerDetailLayout({
    children,
    mode
}: OwnerDetailLayoutProps) {
    const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuthContext();
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const [ownerInfo, setOwnerInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const basePath = mode === 'realestate-admin' ? '/realestate-admin/owners' : '/realestate-admin/owners';

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !isAdmin) {
            router.push('/login');
            return;
        }

        const loadOwnerInfo = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getUserById(token, id as string);
                if (response.success && response.data.user) {
                    setOwnerInfo(response.data.user);
                }
            } catch (error) {
                console.error('Failed to load owner info:', error);
            } finally {
                setLoading(false);
            }
        };

        loadOwnerInfo();
    }, [id, isAuthenticated, isAdmin, router, authLoading]);

    const tabs = [
        { label: 'Overview', icon: 'bi-speedometer2', path: `${basePath}/${id}` },
        { label: 'License & Plan', icon: 'bi-key-fill', path: `${basePath}/${id}/license` },
        { label: 'Modules', icon: 'bi-puzzle-fill', path: `${basePath}/${id}/modules` },
        { label: 'Properties', icon: 'bi-building', path: `${basePath}/${id}/properties` },
        { label: 'Units', icon: 'bi-grid-3x3-gap', path: `${basePath}/${id}/units` },
        { label: 'Bookings', icon: 'bi-calendar-check', path: `${basePath}/${id}/bookings` },
        { label: 'Users', icon: 'bi-people', path: `${basePath}/${id}/users` },
    ];

    if (authLoading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-light"><div className="spinner-border text-primary"></div></div>;
    if (!isAuthenticated || !isAdmin) return null;

    return (
        <MainLayout activePage="owners">
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link href={basePath}>Owners</Link></li>
                            <li className="breadcrumb-item active">{ownerInfo?.name || 'Loading...'}</li>
                        </ol>
                    </nav>
                    <div className="d-flex justify-content-between align-items-end">
                        <div>
                            <h2 className="fw-bold mb-1">{ownerInfo?.name || 'Owner Profile'}</h2>
                            <p className="text-muted small mb-0">{ownerInfo?.email || id}</p>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-0">
                        <ul className="nav nav-tabs border-0 px-4 pt-2 flex-nowrap overflow-auto">
                            {tabs.map((tab) => (
                                <li key={tab.path} className="nav-item flex-shrink-0">
                                    <Link
                                        href={tab.path}
                                        className={`nav-link border-0 py-3 px-3 fw-medium transition-all d-flex align-items-center gap-2 ${pathname === tab.path ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'
                                            }`}
                                    >
                                        <i className={`bi ${tab.icon}`}></i>
                                        <span className="d-none d-md-inline">{tab.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="fade-in">
                    {children}
                </div>
            </div>

            <style jsx>{`
                .nav-tabs .nav-link { 
                  border-radius: 0; 
                  background: none; 
                  font-size: 0.95rem;
                }
                .nav-tabs .nav-link:hover {
                  color: #0d6efd;
                }
                .nav-tabs .nav-link.active {
                  color: #0d6efd !important;
                  border-bottom: 3px solid #0d6efd !important;
                  background: none;
                }
                .fade-in {
                  animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </MainLayout>
    );
}
