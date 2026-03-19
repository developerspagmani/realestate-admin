'use client';

import { useState, useEffect, useCallback } from 'react';
import { marketingService } from '@/app/services/marketing';
import { getAuthToken } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Loader from '@/components/common/Loader';
import Toast from '@/components/common/Toast';
import MainLayout from '@/components/MainLayout';

const DEFAULT_CONFIG = {
    emailSkinColor: '#4f46e5',
    currencySymbol: '$',
    showFooter: true,
    footerText: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    showUnsubscribe: true,
    unsubscribeText: 'Unsubscribe',
    unsubscribeUrl: '',
    enableAiRecommendations: true
};

interface EmailConfigurationProps {
    mode?: 'admin' | 'owner';
}

export default function EmailConfiguration({ mode = 'admin' }: EmailConfigurationProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            
            const targetTenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const res = await marketingService.getEmailSettings(token, { 
                tenantId: targetTenantId || undefined,
                industryType: mode === 'admin' ? tenantType : undefined,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });

            if (res.success) {
                setConfig({ ...DEFAULT_CONFIG, ...res.data });
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
            setToast({ show: true, message: 'Failed to load email configuration', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [mode, activeTenantId, activeOwnerId, tenantType, user]);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchSettings();
        }
    }, [fetchSettings, isAuthenticated, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) {
                setToast({ show: true, message: 'Authentication required. Please log in again.', type: 'error' });
                setSaving(false);
                return;
            }

            const targetTenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const res = await marketingService.saveEmailSettings(token, config, { 
                tenantId: targetTenantId || undefined,
                industryType: mode === 'admin' ? tenantType : undefined,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });

            if (res.success) {
                setToast({ show: true, message: 'Email configuration saved successfully', type: 'success' });
            } else {
                setToast({ show: true, message: res.message || 'Failed to save configuration', type: 'error' });
            }
        } catch (error) {
            console.error('Save settings error:', error);
            setToast({ show: true, message: 'Failed to save email configuration', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5"><Loader /></div>;

    return (
        <MainLayout activePage="email-config">
            <div className="container-fluid py-4 animate__animated animate__fadeIn">
                <Toast 
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">Email Configuration</h2>
                        <p className="text-muted small">Customize the visual appearance, currency and footer of all outgoing emails.</p>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <span className="spinner-border spinner-border-sm" role="status"></span> : <i className="bi bi-check2-circle"></i>}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

                <div className="row g-4">
                    {/* Settings Panel */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="card-header bg-white py-3 border-bottom border-light">
                                <h5 className="mb-0 fw-bold">Configuration Settings</h5>
                            </div>
                            <div className="card-body p-4 scroll-area" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                {/* Appearance Section */}
                                <div className="mb-5">
                                    <h6 className="fw-bold text-uppercase small text-primary mb-3">Appearance & Identity</h6>
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark d-block">Primary Skin Color</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <input
                                                type="color"
                                                className="form-control form-control-color border-0 p-1 rounded-circle shadow-sm"
                                                style={{ width: '48px', height: '48px', cursor: 'pointer' }}
                                                value={config.emailSkinColor}
                                                onChange={(e) => setConfig({ ...config, emailSkinColor: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="form-control border-light-soft bg-light shadow-none"
                                                value={config.emailSkinColor}
                                                onChange={(e) => setConfig({ ...config, emailSkinColor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">Default Currency Symbol</label>
                                        <select 
                                            className="form-select border-light-soft bg-light shadow-none"
                                            value={config.currencySymbol}
                                            onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value })}
                                        >
                                            <option value="$">$ (USD)</option>
                                            <option value="€">€ (EUR)</option>
                                            <option value="£">£ (GBP)</option>
                                            <option value="₹">₹ (INR)</option>
                                            <option value="¥">¥ (JPY)</option>
                                            <option value="AED">AED (Dirham)</option>
                                            <option value="SAR">SAR (Riyal)</option>
                                            <option value="KWD">KWD (Dinar)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Footer Links Section */}
                                <div className="mb-5">
                                    <h6 className="fw-bold text-uppercase small text-primary mb-3">Social Media & Footer</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-medium">Facebook URL</label>
                                            <input type="text" className="form-control form-control-sm bg-light" value={config.facebookUrl} onChange={(e) => setConfig({...config, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-medium">Twitter (X) URL</label>
                                            <input type="text" className="form-control form-control-sm bg-light" value={config.twitterUrl} onChange={(e) => setConfig({...config, twitterUrl: e.target.value})} placeholder="https://x.com/..." />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-medium">Instagram URL</label>
                                            <input type="text" className="form-control form-control-sm bg-light" value={config.instagramUrl} onChange={(e) => setConfig({...config, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-medium">LinkedIn URL</label>
                                            <input type="text" className="form-control form-control-sm bg-light" value={config.linkedinUrl} onChange={(e) => setConfig({...config, linkedinUrl: e.target.value})} placeholder="https://linkedin.com/in/..." />
                                        </div>
                                    </div>
                                    <div className="mb-4 mt-2">
                                        <label className="form-label fw-semibold text-dark">Footer Disclaimer / Address</label>
                                        <textarea
                                            className="form-control border-light-soft bg-light shadow-none"
                                            rows={2}
                                            placeholder="Enter your company address or legal disclaimer..."
                                            value={config.footerText}
                                            onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Features Section */}
                                <div className="mb-2">
                                    <h6 className="fw-bold text-uppercase small text-primary mb-3">Visibility & Automation</h6>
                                    <div className="form-check form-switch mb-3">
                                        <input className="form-check-input custom-switch" type="checkbox" id="showFooter" checked={config.showFooter} onChange={(e) => setConfig({ ...config, showFooter: e.target.checked })} />
                                        <label className="form-check-label fw-medium" htmlFor="showFooter">Enable Premium Footer</label>
                                    </div>
                                    <div className="form-check form-switch mb-3">
                                        <input className="form-check-input custom-switch" type="checkbox" id="showUnsubscribe" checked={config.showUnsubscribe} onChange={(e) => setConfig({ ...config, showUnsubscribe: e.target.checked })} />
                                        <label className="form-check-label fw-medium" htmlFor="showUnsubscribe">Include Unsubscribe Link</label>
                                    </div>
                                    {config.showUnsubscribe && (
                                        <div className="ms-4 mb-3 animate__animated animate__fadeIn">
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <label className="form-label small mb-1">Link Text</label>
                                                    <input type="text" className="form-control form-control-sm bg-light" value={config.unsubscribeText} onChange={(e) => setConfig({...config, unsubscribeText: e.target.value})} />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small mb-1">Custom Redirect URL (Optional)</label>
                                                    <input type="text" className="form-control form-control-sm bg-light" value={config.unsubscribeUrl} onChange={(e) => setConfig({...config, unsubscribeUrl: e.target.value})} placeholder="https://..." />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="form-check form-switch mb-3">
                                        <input className="form-check-input custom-switch" type="checkbox" id="enableAi" checked={config.enableAiRecommendations} onChange={(e) => setConfig({ ...config, enableAiRecommendations: e.target.checked })} />
                                        <label className="form-check-label fw-medium" htmlFor="enableAi">AI Property Recommendations</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-light-soft">
                            <div className="card-header bg-white py-3 border-bottom border-light d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">Live Preview</h5>
                                <span className="badge bg-light text-dark border fw-normal">Email Template Preview</span>
                            </div>
                            <div className="card-body p-5">
                                <div className="mx-auto bg-white rounded-3 shadow-sm overflow-hidden" style={{ maxWidth: '500px', border: '1px solid #edf2f7' }}>
                                    {/* Email Body Mockup */}
                                    <div className="p-4" style={{ borderTop: `4px solid ${config.emailSkinColor}` }}>
                                        <div className="mb-4" style={{ textAlign: 'center' }}>
                                            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                <i className="bi bi-building fs-5" style={{ color: config.emailSkinColor }}></i>
                                            </div>
                                        </div>
                                        <h4 className="fw-bold mb-3" style={{ color: '#1a202c', textAlign: 'center' }}>Property Recommendation</h4>
                                        <p className="text-secondary small mb-4">Hello John, we found some amazing properties matching your preferences. Here is our top pick for you today!</p>

                                        <div className="rounded-4 overflow-hidden mb-4 border border-light">
                                            <div className="bg-light" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyItems: 'center', position: 'relative' }}>
                                                <img src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="luxury home" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div className="position-absolute bottom-0 start-0 p-2 w-100" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                                                    <span className="badge bg-white text-dark small">New Listing</span>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h6 className="fw-bold mb-1 text-truncate">Premium Urban Penthouse</h6>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold" style={{ color: config.emailSkinColor }}>{config.currencySymbol}4,500 / month</span>
                                                    <button className="btn btn-sm text-white px-3" style={{ backgroundColor: config.emailSkinColor, borderRadius: '6px', fontSize: '11px' }}>View Details</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <button className="btn w-100 text-white py-2 fw-semibold shadow-sm" style={{ backgroundColor: config.emailSkinColor, borderRadius: '8px' }}>
                                                Browse more properties
                                            </button>
                                        </div>
                                    </div>

                                    {/* Email Footer Mockup */}
                                    {config.showFooter && (
                                        <div className="p-4 bg-light text-center" style={{ borderTop: '1px solid #edf2f7' }}>
                                            <p className="text-muted" style={{ fontSize: '10px', marginBottom: '8px' }}>
                                                {config.footerText || "You're receiving this because you signed up for property alerts."}
                                            </p>
                                            
                                            <div className="d-flex justify-content-center gap-3 mb-3">
                                                {config.facebookUrl && <i className="bi bi-facebook" style={{ color: config.emailSkinColor }}></i>}
                                                {config.twitterUrl && <i className="bi bi-twitter-x" style={{ color: config.emailSkinColor }}></i>}
                                                {config.instagramUrl && <i className="bi bi-instagram" style={{ color: config.emailSkinColor }}></i>}
                                                {config.linkedinUrl && <i className="bi bi-linkedin" style={{ color: config.emailSkinColor }}></i>}
                                            </div>

                                            <p className="text-muted m-0" style={{ fontSize: '9px' }}>
                                                © {new Date().getFullYear()} Your Real Estate Platform
                                                {config.showUnsubscribe && (
                                                    <span> • <span style={{ textDecoration: 'underline', cursor: 'pointer', color: config.emailSkinColor }}>{config.unsubscribeText}</span></span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .border-light-soft {
                        border-color: rgba(0, 0, 0, 0.05);
                    }
                    .bg-light-soft {
                        background-color: #f8fafc;
                    }
                    .custom-switch {
                        width: 3rem;
                        height: 1.5rem;
                        cursor: pointer;
                    }
                    .custom-switch:checked {
                            background-color: ${config.emailSkinColor};
                            border-color: ${config.emailSkinColor};
                    }
                    .scroll-area::-webkit-scrollbar {
                        width: 4px;
                    }
                    .scroll-area::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                `}</style>
            </div>
        </MainLayout>
    );
}
