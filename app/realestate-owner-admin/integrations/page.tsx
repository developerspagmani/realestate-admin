'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { integrationService } from '@/app/services/integration';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { getAuthToken } from '@/app/services/api';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';

export default function IntegrationsPage() {
    const { isAuthenticated, loading: authLoading } = useAuthContext();
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [showHowItWorks, setShowHowItWorks] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('integrations_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('integrations_hideGuide', (!show).toString());
    };

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
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h1 className="fw-bold h2 mb-1">External Integrations</h1>
                            <p className="text-muted small mb-0">Manage your WordPress sites and other external platforms connected to Virpanix.</p>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                </div>

                {showHowItWorks && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white overflow-hidden position-relative animate-fade-in">
                        <button
                            className="btn position-absolute top-0 end-0 m-3 text-white opacity-50 hover-opacity-100 p-2"
                            style={{ zIndex: 1 }}
                            onClick={() => toggleGuide(false)}
                            title="Hide this section"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className="card-body p-4 p-lg-5">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <h3 className="fw-bold mb-3 text-white">Bridge Your Ecosystem</h3>
                                    <p className="opacity-75 mb-4">Virpanix Integrations allow you to funnel leads from any external site directly into your central dashboard. Here is how management works:</p>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-wordpress text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">1. WordPress Connectivity</div>
                                                    <div className="small opacity-75">Install our official plugin on any WordPress site and paste your API key to start syncing.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-key text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">2. API Security</div>
                                                    <div className="small opacity-75">Your API keys are unique per site. You can revoke access instantly if a site is compromised.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-collection-play text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">3. Sandbox Testing</div>
                                                    <div className="small opacity-75">Use "Sandbox" mode to test your integration without affecting your live lead data or dashboards.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-sync text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">4. Real-time Lead Flow</div>
                                                    <div className="small opacity-75">Once connected, leads captured on external landing pages flow directly into your CRM within seconds.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 d-none d-lg-block text-center">
                                    <i className="bi bi-puzzle display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <tr><td colSpan={6} className="text-center py-5"><Loader size="sm" message="" /></td></tr>
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
