'use client';

import { useState, useEffect } from 'react';
import { licenseKeyService, getAuthToken, moduleService, tenantService } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';

interface SubscriptionSubTabProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function SubscriptionSubTab({ showToast }: SubscriptionSubTabProps) {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
    const [activeModules, setActiveModules] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const token = getAuthToken() || '';

            // 1. Get Tenant Info (Plan)
            const tenantRes = await tenantService.getTenantById(token, user.tenantId);
            if (tenantRes.success) {
                setSubscriptionInfo(tenantRes.data);
            }

            // 2. Get Active Modules
            const modulesRes = await moduleService.getTenantModules(token, user.tenantId);
            if (modulesRes.success) {
                // The API returns an array of TenantModule assignments with nested module info
                const modules = (modulesRes.data || []).map((assignment: any) => ({
                    ...assignment.module,
                    isActive: assignment.isActive
                })).filter((m: any) => m.isActive);
                setActiveModules(modules);
            }
        } catch (error) {
            console.error('Failed to load subscription info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey.trim()) return;

        setActivating(true);
        try {
            const token = getAuthToken() || '';
            const res = await licenseKeyService.activate(token, licenseKey);
            if (res.success) {
                showToast('License key activated successfully! Your plan has been updated.', 'success');
                setLicenseKey('');
                loadData();
                // We might want to trigger a session reload or notify user to refresh
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showToast(res.message || 'Activation failed', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to activate key', 'error');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary opacity-50 mb-3"></div>
                <p className="text-muted small">Loading subscription details...</p>
            </div>
        );
    }

    const plan = subscriptionInfo?.plan;
    const expiresAt = subscriptionInfo?.subscriptionExpiresAt;

    return (
        <div className="fade-in">
            <h4 className="fw-bold mb-4">Subscription & Licensing</h4>

            {/* Current Plan Card */}
            <div className="row g-4 mb-5">
                <div className="col-md-7">
                    <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 h-100 position-relative overflow-hidden">
                        <div className="position-absolute top-0 end-0 p-4 opacity-10">
                            <i className="bi bi-gem display-1"></i>
                        </div>
                        <div className="position-relative z-index-1">
                            <span className="badge bg-white text-primary rounded-4 px-3 py-1 mb-3 small-caps">Current Plan</span>
                            <h2 className="fw-bold mb-1 text-white">{plan?.name || 'Free/Trial Plan'}</h2>
                            <p className="opacity-75 mb-4">{plan?.description || 'Your current limited access plan.'}</p>

                            <div className="d-flex align-items-center mt-auto">
                                <div className="me-4">
                                    <div className="small opacity-75">Status</div>
                                    <div className="fw-bold">
                                        {subscriptionInfo?.subscriptionStatus === 1 ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                                {expiresAt && (
                                    <div className="me-4">
                                        <div className="small opacity-75">Expires At</div>
                                        <div className="fw-bold">{new Date(expiresAt).toLocaleDateString()}</div>
                                    </div>
                                )}
                                {subscriptionInfo?.licenseKey && (
                                    <div className="ms-auto pt-2">
                                        <div className="small opacity-75">License Key</div>
                                        <div className="d-flex align-items-center fw-mono">
                                            <span className="me-2 fw-bold" style={{ fontSize: '0.9rem' }}>
                                                {showKey ? subscriptionInfo.licenseKey.key : '••••-••••-••••-••••'}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-link text-white p-0 border-0"
                                                onClick={() => setShowKey(!showKey)}
                                                type="button"
                                            >
                                                <i className={`bi bi-eye${showKey ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 border border-primary-subtle bg-primary-soft">
                        <h5 className="fw-bold mb-3"><i className="bi bi-key-fill me-2 text-primary"></i> Upgrade Plan</h5>
                        <p className="text-muted small mb-4">Enter a license key to unlock premium modules and extend your subscription.</p>

                        <form onSubmit={handleActivate}>
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control form-control-lg border-primary-subtle text-primary fw-mono"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-bold rounded-3"
                                disabled={activating || !licenseKey}
                            >
                                {activating ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Activate Key'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Active Modules Section */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h5 className="fw-bold mb-4">Enabled Modules</h5>
                {activeModules.length > 0 ? (
                    <div className="row g-3">
                        {activeModules.map((mod: any) => (
                            <div className="col-md-4" key={mod.id}>
                                <div className="d-flex align-items-center p-3 bg-light rounded-3">
                                    <div className="p-2 bg-white rounded-circle shadow-sm me-3 text-primary">
                                        <i className="bi bi-check-circle-fill"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold small">{mod.name}</div>
                                        <div className="text-muted extra-small">{mod.slug}</div>
                                        {mod.slug === 'marketing_hub' && (
                                            <a href="/realestate-owner-admin/marketing" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Go to Hub <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === '3d_viewer' && (
                                            <a href="/realestate-owner-admin/property-3d" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Go to 3D Architect <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'widget_creator' && (
                                            <a href="/realestate-owner-admin/widgets" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Widgets <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'social_all' && (
                                            <a href="/realestate-owner-admin/social" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Social <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'automation_engine' && (
                                            <a href="/realestate-owner-admin/automation" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Automation <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'social_posts' && (
                                            <a href="/realestate-owner-admin/social-posts" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Social Posts <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'social_whatsapp' && (
                                            <a href="/realestate-owner-admin/whatsapp-campaigns" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage WhatsApp <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'social_interactions' && (
                                            <a href="/realestate-owner-admin/social-interactions" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Social Interactions <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'website_cms' && (
                                            <a href="/realestate-owner-admin/cms" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Website CMS <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'discovery' && (
                                            <a href="/realestate-owner-admin/discovery" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Discovery <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}
                                        {mod.slug === 'analytics_pro' && (
                                            <a href="/realestate-owner-admin/analytics" className="extra-small text-primary text-decoration-none d-block mt-1">
                                                Manage Analytics <i className="bi bi-arrow-right small"></i>
                                            </a>
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-light rounded-4">
                        <i className="bi bi-box-seam display-4 text-muted opacity-25 mb-3 d-block"></i>
                        <p className="text-muted">No premium modules active on this tenant.</p>
                        <button className="btn btn-sm btn-link" onClick={() => setLicenseKey('')}>Contact support to upgrade</button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(99, 102, 241, 0.05); }
                .fw-mono { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; }
                .extra-small { font-size: 0.75rem; }
                .z-index-1 { z-index: 1; }
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
