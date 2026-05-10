'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { tenantService } from '@/app/services/tenant';
import { getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Link from 'next/link';

interface TenantsManagerProps {
    mode: 'admin' | 'realestate-admin';
}

export default function TenantsManager({ mode }: TenantsManagerProps) {
    const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuthContext();
    const [mounted, setMounted] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const res = await tenantService.getTenants(token);
            if (res.success && res.data) {
                setTenants(res.data);
            }
        } catch (error) {
            console.error('Failed to load tenants:', error);
            showToast('Failed to load tenants', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted || authLoading) return;

        if (!isAuthenticated || !user || !isAdmin) {
            router.push('/login');
            return;
        }

        loadTenants();
    }, [user, isAuthenticated, isAdmin, mounted, authLoading, router]);

    const filteredTenants = useMemo(() => {
        return tenants.filter(t =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.domain?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tenants, searchTerm]);

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="tenants">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Tenants & Workspaces</h2>
                        <p className="text-muted small mb-0">Manage customer tenants and assign company owners</p>
                    </div>
                    <Link
                        href="/realestate-admin/tenants/create"
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                    >
                        <i className="bi bi-buildings"></i>
                        <span>Create Tenant</span>
                    </Link>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4">
                        <div className="input-group input-group-lg bg-light rounded-3 border-0">
                            <span className="input-group-text bg-transparent border-0 pe-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control bg-transparent border-0 ps-3 fs-6"
                                placeholder="Search by name or domain..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="vi-table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Tenant Details</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0">Business Type</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0">Company Owners</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </td>
                                    </tr>
                                ) : filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="text-muted">No tenants found matching your search.</div>
                                        </td>
                                    </tr>
                                ) : filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="transition-all">
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar bg-dark text-white rounded-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-building"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{tenant.name}</div>
                                                    <a href={`https://${tenant.domain}.virpanix.com`} target="_blank" className="text-decoration-none text-muted extra-small d-block">
                                                        <i className="bi bi-link-45deg"></i> {tenant.domain}.virpanix.com
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="badge bg-light text-dark border">
                                                {tenant.type === 1 ? 'Real Estate' : 'Coworking / PM'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {tenant.users && tenant.users.length > 0 ? (
                                                <div className="d-flex flex-column gap-1">
                                                    {tenant.users.map((owner: any) => (
                                                        <div key={owner.id} className="d-flex align-items-center gap-2 small">
                                                            <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                                                                {owner.name.charAt(0)}
                                                            </div>
                                                            <span className="text-dark fw-medium">{owner.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted small fst-italic">No owners assigned</span>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge rounded-4 px-3 py-2 ${tenant.status === 1 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                                {tenant.status === 1 ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link
                                                    href={`/realestate-admin/tenants/${tenant.id}`}
                                                    className="btn btn-icon btn-light-primary rounded-circle hvr-float"
                                                    title="Manage Tenant"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; padding: 0; }
                .btn-light-primary { background: rgba(13, 110, 253, 0.05); color: #0d6efd; border: none; }
                .btn-light-primary:hover { background: #0d6efd; color: white; }
                .btn-light-success { background: rgba(25, 135, 84, 0.05); color: #198754; border: none; }
                .btn-light-success:hover { background: #198754; color: white; }
                .extra-small { font-size: 11px; }
                .transition-all { transition: all 0.2s ease; }
                .table-hover tbody tr:hover { background-color: rgba(0,0,0,0.01); }
                .bg-primary-soft { background-color: rgba(13,110,253,0.1) !important; }
                .bg-success-soft { background-color: rgba(25,135,84,0.1) !important; }
                .bg-danger-soft { background-color: rgba(220,53,69,0.1) !important; }
            `}</style>
            
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
