'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getAuthToken, licenseKeyService } from '@/app/services/api';

interface LicenseKey {
    id: string;
    key: string;
    status: number;
    activatedAt: string | null;
    plan: { id: string; name: string; slug: string };
    tenant: {
        id: string;
        name: string;
        subscriptionStatus: number;
        subscriptionExpiresAt: string | null;
    } | null;
}

interface TenantSubDetail {
    id: string;
    name: string;
    domain: string;
    planId: string | null;
    subscriptionStatus: number;
    subscriptionExpiresAt: string | null;
    plan: { id: string; name: string; slug: string; price: number; interval: string } | null;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
    1: { label: 'Active', color: 'success' },
    2: { label: 'Expired', color: 'danger' },
    3: { label: 'Trial', color: 'warning' },
    4: { label: 'Suspended', color: 'secondary' },
};

function daysUntilExpiry(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OwnerLicense() {
    const { id: ownerId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [subDetail, setSubDetail] = useState<TenantSubDetail | null>(null);
    const [activeKey, setActiveKey] = useState<LicenseKey | null>(null);
    const [unusedKeys, setUnusedKeys] = useState<LicenseKey[]>([]);
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            // Get owner info to find their tenantId
            const { userService } = await import('@/app/services/api');
            const ownerRes = await userService.getUserById(token, ownerId as string);
            if (!ownerRes.success || !ownerRes.data?.user) return;

            const tid = ownerRes.data.user.tenantId;
            if (!tid) {
                setLoading(false);
                return;
            }
            setTenantId(tid);

            // Load subscription detail + unused keys in parallel
            const { adminService } = await import('@/app/services/admin');
            const [subRes, unusedRes] = await Promise.all([
                adminService.getTenantSubscription(token, tid),
                licenseKeyService.getAll(token, { status: 1 })
            ]);

            if (subRes.success) {
                setSubDetail(subRes.data.tenant);
                setActiveKey(subRes.data.activeKey);
                if (subRes.data.tenant?.subscriptionExpiresAt) {
                    setExpiryDate(subRes.data.tenant.subscriptionExpiresAt.split('T')[0]);
                }
            }

            if (unusedRes.success) {
                setUnusedKeys(unusedRes.data?.keys || []);
            }
        } catch (err) {
            console.error('Failed to load license data:', err);
            showToast('Failed to load subscription data', 'error');
        } finally {
            setLoading(false);
        }
    }, [ownerId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAssignKey = async () => {
        if (!selectedKeyId || !tenantId) return;
        try {
            setSaving(true);
            const token = getAuthToken();
            if (!token) return;
            const { adminService } = await import('@/app/services/admin');
            const res = await adminService.assignLicenseKey(token, {
                tenantId,
                keyId: selectedKeyId,
                expiresAt: expiryDate || undefined
            });
            if (res.success) {
                showToast(`License key assigned! Plan: ${res.data?.planName}`);
                setSelectedKeyId('');
                loadData();
            } else {
                showToast(res.message || 'Failed to assign key', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Error assigning key', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSetExpiry = async () => {
        if (!expiryDate || !tenantId) return;
        try {
            setSaving(true);
            const token = getAuthToken();
            if (!token) return;
            const { adminService } = await import('@/app/services/admin');
            const res = await adminService.setExpiry(token, tenantId, new Date(expiryDate).toISOString());
            if (res.success) {
                showToast('Expiry date updated successfully');
                loadData();
            } else {
                showToast(res.message || 'Failed to update expiry', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Error updating expiry', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeKey = async () => {
        if (!tenantId || !window.confirm('Revoke this license key? The owner will be set back to trial mode.')) return;
        try {
            setRevoking(true);
            const token = getAuthToken();
            if (!token) return;
            const { adminService } = await import('@/app/services/admin');
            const res = await adminService.revokeKey(token, tenantId);
            if (res.success) {
                showToast('License key revoked. Tenant is back to trial.');
                loadData();
            } else {
                showToast(res.message || 'Failed to revoke key', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Error revoking key', 'error');
        } finally {
            setRevoking(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => showToast('Key copied to clipboard!'));
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3 small">Loading subscription data...</p>
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <i className="bi bi-exclamation-circle text-warning fs-1 mb-3"></i>
                <h5 className="fw-bold">No Tenant Linked</h5>
                <p className="text-muted">This owner does not have a tenant account associated yet.</p>
            </div>
        );
    }

    const status = subDetail ? STATUS_MAP[subDetail.subscriptionStatus] || { label: 'Unknown', color: 'secondary' } : null;
    const daysLeft = daysUntilExpiry(subDetail?.subscriptionExpiresAt || null);
    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
    const isExpired = daysLeft !== null && daysLeft < 0;

    return (
        <div className="row g-4">
            {/* Current Subscription Card */}
            <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header border-0 p-4 d-flex align-items-center gap-3"
                        style={{ background: 'linear-gradient(135deg, #667eea20, #764ba220)' }}>
                        <div className="bg-primary p-3 rounded-3 text-white">
                            <i className="bi bi-shield-check fs-4"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0">Current Subscription</h5>
                            <p className="text-muted small mb-0">License key and plan details for this owner</p>
                        </div>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            {/* Plan Info */}
                            <div className="col-md-4">
                                <div className="p-4 bg-light rounded-4 h-100">
                                    <div className="text-muted small text-uppercase fw-bold mb-2">Current Plan</div>
                                    <div className="fs-3 fw-bold text-dark">
                                        {subDetail?.plan?.name || <span className="text-muted fs-6">No Plan</span>}
                                    </div>
                                    {subDetail?.plan && (
                                        <div className="text-muted small mt-1">
                                            ₹{subDetail.plan.price?.toLocaleString()} / {subDetail.plan.interval}
                                        </div>
                                    )}
                                    {status && (
                                        <span className={`badge bg-${status.color}-soft text-${status.color} rounded-pill px-3 py-2 mt-3 d-inline-block`}>
                                            <i className="bi bi-dot me-1 fs-6"></i>{status.label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* License Key */}
                            <div className="col-md-4">
                                <div className="p-4 bg-light rounded-4 h-100">
                                    <div className="text-muted small text-uppercase fw-bold mb-2">Active License Key</div>
                                    {activeKey ? (
                                        <>
                                            <div className="font-monospace fw-bold text-primary fs-6 mb-2">{activeKey.key}</div>
                                            <div className="text-muted small">Plan: {activeKey.plan?.name}</div>
                                            <div className="text-muted small">
                                                Activated: {activeKey.activatedAt
                                                    ? new Date(activeKey.activatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : 'N/A'}
                                            </div>
                                            <div className="d-flex gap-2 mt-3">
                                                <button className="btn btn-sm btn-outline-primary rounded-3"
                                                    onClick={() => copyToClipboard(activeKey.key)}>
                                                    <i className="bi bi-clipboard me-1"></i>Copy
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger rounded-3"
                                                    onClick={handleRevokeKey} disabled={revoking}>
                                                    {revoking
                                                        ? <span className="spinner-border spinner-border-sm me-1"></span>
                                                        : <i className="bi bi-x-circle me-1"></i>}
                                                    Revoke
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-muted small mt-2">
                                            <i className="bi bi-lock me-2"></i>No active license key
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expiry */}
                            <div className="col-md-4">
                                <div className={`p-4 rounded-4 h-100 ${isExpired ? 'bg-danger-soft' : isExpiringSoon ? 'bg-warning-soft' : 'bg-light'}`}>
                                    <div className="text-muted small text-uppercase fw-bold mb-2">Subscription Expiry</div>
                                    {subDetail?.subscriptionExpiresAt ? (
                                        <>
                                            <div className={`fs-4 fw-bold ${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : 'text-dark'}`}>
                                                {new Date(subDetail.subscriptionExpiresAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </div>
                                            {daysLeft !== null && (
                                                <div className={`mt-2 small fw-semibold ${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : 'text-success'}`}>
                                                    {isExpired
                                                        ? `Expired ${Math.abs(daysLeft)} days ago`
                                                        : `${daysLeft} days remaining`}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-muted small mt-2">No expiry set</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign License Key */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header border-0 p-4 bg-white">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-success-soft p-2 rounded-3">
                                <i className="bi bi-key text-success fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0">Assign License Key</h6>
                                <p className="text-muted extra-small mb-0">
                                    {unusedKeys.length > 0
                                        ? `${unusedKeys.length} unused key(s) available`
                                        : 'No unused keys available — generate some first'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-4">
                        {unusedKeys.length === 0 ? (
                            <div className="text-center py-3">
                                <i className="bi bi-key text-muted fs-2 mb-2"></i>
                                <p className="text-muted small">No unused license keys. Go to Subscriptions → Keys to generate new keys.</p>
                                <a href="/realestate-admin/subscriptions" className="btn btn-sm btn-outline-primary rounded-3">
                                    <i className="bi bi-plus me-1"></i>Generate Keys
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Select Key</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 font-monospace"
                                        value={selectedKeyId}
                                        onChange={e => setSelectedKeyId(e.target.value)}
                                    >
                                        <option value="">-- Choose a license key --</option>
                                        {unusedKeys.map(k => (
                                            <option key={k.id} value={k.id}>
                                                {k.key} ({k.plan?.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted text-uppercase">
                                        Custom Expiry Date <span className="text-muted fw-normal">(optional, defaults to 1 year)</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg bg-light border-0 rounded-3"
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <button
                                    className="btn btn-success px-4 fw-bold shadow-sm w-100 rounded-3"
                                    onClick={handleAssignKey}
                                    disabled={!selectedKeyId || saving}
                                >
                                    {saving
                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Assigning...</>
                                        : <><i className="bi bi-check-circle me-2"></i>Assign & Activate Key</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Set Expiry Date */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header border-0 p-4 bg-white">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-warning-soft p-2 rounded-3">
                                <i className="bi bi-calendar-event text-warning fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0">Adjust Expiry Date</h6>
                                <p className="text-muted extra-small mb-0">Override the subscription expiry independently</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-4">
                        <div className="mb-4">
                            <label className="form-label small fw-bold text-muted text-uppercase">New Expiry Date</label>
                            <input
                                type="date"
                                className="form-control form-control-lg bg-light border-0 rounded-3"
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                            />
                            <div className="form-text small text-muted mt-2">
                                This updates the expiry date without changing the license key or plan.
                            </div>
                        </div>
                        <button
                            className="btn btn-warning px-4 fw-bold shadow-sm w-100 rounded-3 text-dark"
                            onClick={handleSetExpiry}
                            disabled={!expiryDate || saving}
                        >
                            {saving
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                : <><i className="bi bi-calendar-check me-2"></i>Update Expiry Date</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div
                    className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type === 'success' ? 'success' : 'danger'} shadow-lg rounded-4 d-flex align-items-center gap-3`}
                    style={{ zIndex: 9999, minWidth: '280px', animation: 'slideUp 0.3s ease' }}
                >
                    <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} fs-5`}></i>
                    <span className="fw-medium small">{toast.message}</span>
                </div>
            )}

            <style>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .extra-small { font-size: 11px; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
