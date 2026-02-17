'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { integrationService } from '@/app/services/integration';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { getAuthToken } from '@/app/services/api';
import Toast from '@/components/common/Toast';

export default function IntegrationsPage() {
    const { isAuthenticated, loading: authLoading } = useAuthContext();
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            loadIntegrations();
        }
    }, [isAuthenticated]);

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await integrationService.getIntegrations(token);
            if (res.success) {
                setIntegrations(res.data);
            }
        } catch (error) {
            console.error('Failed to load integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await integrationService.toggleStatus(token, id);
            if (res.success) {
                setToast({ message: 'Integration status updated.', type: 'success' });
                loadIntegrations();
            }
        } catch (error) {
            setToast({ message: 'Failed to update status.', type: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this connection? This will break the integration on the external site.')) return;

        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await integrationService.deleteIntegration(token, id);
            if (res.success) {
                setToast({ message: 'Integration removed.', type: 'success' });
                loadIntegrations();
            }
        } catch (error) {
            setToast({ message: 'Failed to remove integration.', type: 'error' });
        }
    };

    if (authLoading) return <div className="p-5 text-center">Loading...</div>;

    return (
        <MainLayout activePage="integrations">
            <div className="p-1">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold mb-1">External Integrations</h4>
                        <p className="text-muted small">Manage your WordPress sites and other external platforms connected to Virpanix.</p>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase fw-bold">Site / Platform</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold">Environment</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold">API Key</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold">Status</th>
                                        <th className="py-3 text-muted small text-uppercase fw-bold">Last Sync</th>
                                        <th className="px-4 py-3 text-center text-muted small text-uppercase fw-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                                    ) : integrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5">
                                                <div className="py-4">
                                                    <i className="bi bi-link-45deg display-4 text-muted opacity-25"></i>
                                                    <p className="mt-3 text-muted">No connected sites found.</p>
                                                    <button
                                                        className="btn btn-primary btn-sm rounded-pill"
                                                        onClick={() => alert('To connect a new site, please use the Virpanix WordPress Plugin on your WordPress site.')}
                                                    >
                                                        How to connect?
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : integrations.map((int) => (
                                        <tr key={int.id}>
                                            <td className="px-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className={`bi ${int.platform === 'wordpress' ? 'bi-wordpress' : 'bi-globe'} fs-5 text-primary`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{int.siteName || 'Unnamed Site'}</div>
                                                        <div className="text-muted extra-small">{int.siteUrl}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill ${int.isSandbox ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'} small px-3`}>
                                                    {int.isSandbox ? 'SANDBOX' : 'PRODUCTION'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <code className="bg-light p-1 rounded small">vp_••••••••{int.apiKey.slice(-6)}</code>
                                                    <button
                                                        className="btn btn-sm btn-link p-0 text-muted"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(int.apiKey);
                                                            setToast({ message: 'API Key copied to clipboard', type: 'info' });
                                                        }}
                                                    >
                                                        <i className="bi bi-clipboard"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="form-check form-switch p-0 d-flex align-items-center justify-content-center" style={{ minHeight: 'auto' }}>
                                                    <input
                                                        className="form-check-input ms-0 me-2"
                                                        type="checkbox"
                                                        checked={int.status}
                                                        onChange={() => handleToggleStatus(int.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span className={`small ${int.status ? 'text-success fw-bold' : 'text-danger'}`}>
                                                        {int.status ? 'Enabled' : 'Revoked'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-muted small">
                                                {int.lastSyncAt ? new Date(int.lastSyncAt).toLocaleString() : 'Never'}
                                            </td>
                                            <td className="px-4 text-center">
                                                <button
                                                    className="btn btn-outline-danger btn-sm rounded-circle border-0"
                                                    onClick={() => handleDelete(int.id)}
                                                    title="Remove Connection"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    show={!!toast}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .bg-light-soft { background-color: #f8f9fa; }
                .table thead th { border-top: 0; }
                .form-check-input:checked { background-color: #198754; border-color: #198754; }
            `}</style>
        </MainLayout>
    );
}
