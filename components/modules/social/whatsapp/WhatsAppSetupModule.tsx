'use client';

import { useEffect, useState, useCallback } from 'react';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';
import Toast from '@/components/common/Toast';

interface SetupComponentProps {
    onSuccess: () => void;
    initialData?: any;
}

export default function WhatsAppSetupModule({ onSuccess, initialData }: SetupComponentProps) {
    const [loading, setLoading] = useState(false);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const loadMetaSDK = useCallback(() => {
        // Function to perform initialization
        const initFB = () => {
            if ((window as any).FB) {
                (window as any).FB.init({
                    appId: process.env.NEXT_PUBLIC_META_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                setSdkLoaded(true);
            }
        };

        if ((window as any).FB) {
            initFB();
            return;
        }

        (window as any).fbAsyncInit = function () {
            initFB();
        };

        (function (d, s, id) {
            const fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            const js = d.createElement(s) as HTMLScriptElement;
            js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode?.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    useEffect(() => {
        loadMetaSDK();
    }, [loadMetaSDK]);

    const isHttps = typeof window !== 'undefined' &&
        (window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1');

    const handleWhatsAppSignup = () => {
        if (!isHttps) {
            showToast('Meta (Facebook) Login requires an HTTPS connection for security.', 'error');
            return;
        }

        if (!window.FB) {
            showToast('Facebook SDK not loaded. Please refresh.', 'error');
            return;
        }

        setLoading(true);
        window.FB.login((response: any) => {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                processWhatsAppSignup(accessToken);
            } else {
                setLoading(false);
                showToast('User cancelled login or did not fully authorize.', 'error');
            }
        }, {
            scope: 'whatsapp_business_management,whatsapp_business_messaging',
            extras: {
                feature: 'whatsapp_embedded_signup',
                setup: {}
            }
        });
    };

    const processWhatsAppSignup = async (accessToken: string) => {
        try {
            const wabaId = initialData?.accountId || prompt("Enter your WhatsApp Business Account (WABA) ID:", initialData?.accountId || "");
            const phoneId = initialData?.metadata?.phoneNumberId || prompt("Enter your WhatsApp Phone Number ID:", initialData?.metadata?.phoneNumberId || "");

            if (!wabaId || !phoneId) {
                showToast("Missing WABA ID or Phone ID. Connection cancelled.", "error");
                setLoading(false);
                return;
            }

            const res = await connectedAccountsApi.connect({
                platform: 'WHATSAPP',
                accessToken: accessToken,
                accountId: wabaId,
                accountName: 'WhatsApp Business',
                metadata: {
                    phoneNumberId: phoneId,
                    setupComplete: true
                }
            });

            if (res.success) {
                showToast('WhatsApp Business connected successfully!', 'success');
                onSuccess();
            } else {
                showToast(res.message || 'Failed to connect WhatsApp account', 'error');
            }
        } catch (error) {
            console.error('WhatsApp setup error:', error);
            showToast('An error occurred during WhatsApp setup.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [showManual, setShowManual] = useState(false);
    const [manualData, setManualData] = useState({
        wabaId: initialData?.accountId || '',
        phoneId: initialData?.metadata?.phoneNumberId || '',
        token: ''
    });

    const handleManualConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualData.wabaId || !manualData.phoneId || !manualData.token) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await connectedAccountsApi.connect({
                platform: 'WHATSAPP',
                accessToken: manualData.token,
                accountId: manualData.wabaId,
                accountName: 'WhatsApp Business (Manual)',
                metadata: {
                    phoneNumberId: manualData.phoneId,
                    setupComplete: true
                }
            });

            if (res.success) {
                showToast('WhatsApp Business connected successfully!', 'success');
                onSuccess();
            } else {
                showToast(res.message || 'Failed to connect WhatsApp account', 'error');
            }
        } catch (error) {
            console.error('Manual setup error:', error);
            showToast('An error occurred during manual setup.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-body p-5 text-center">
                {!isHttps && (
                    <div className="alert alert-warning mb-4 rounded-4 border-0 shadow-sm d-flex align-items-center gap-3 text-start">
                        <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                        <div>
                            <h6 className="fw-bold mb-1">HTTPS Connection Required</h6>
                            <p className="small mb-0">Meta requires an HTTPS connection to use Facebook Login. Please switch to an HTTPS URL to connect your account.</p>
                        </div>
                    </div>
                )}

                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-whatsapp fs-1 text-success"></i>
                </div>
                <h2 className="fw-bold mb-3">Connect WhatsApp Business</h2>
                <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                    Grow your real estate business by automating customer interactions on WhatsApp.
                    Sync your property listings and let our AI Chatbot handle initial inquiries.
                </p>

                {!showManual ? (
                    <>
                        <div className="row g-4 text-start mb-5 justify-content-center">
                            <div className="col-md-5">
                                <div className="d-flex gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <div>
                                        <h6 className="fw-bold mb-1">AI Chatbot</h6>
                                        <p className="small text-muted mb-0">Automated property search and lead qualification.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="d-flex gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <div>
                                        <h6 className="fw-bold mb-1">Bulk Campaigns</h6>
                                        <p className="small text-muted mb-0">Send property updates and newsletters to your leads.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column align-items-center gap-3">
                            <button
                                onClick={handleWhatsAppSignup}
                                disabled={loading || !sdkLoaded || !isHttps}
                                className="btn btn-success btn-lg px-5 rounded-pill shadow-sm py-3 fw-bold"
                            >
                                {loading ? (
                                    <div className="spinner-border spinner-border-sm me-2"></div>
                                ) : (
                                    <><i className="bi bi-whatsapp me-2"></i> Connect with Meta</>
                                )}
                            </button>
                            <button
                                onClick={() => setShowManual(true)}
                                className="btn btn-link text-muted small text-decoration-none"
                            >
                                Don't have a BSP? Enter IDs manually
                            </button>
                            {!isHttps && <span className="small text-danger">Connection Unavailable (Insecure Context)</span>}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleManualConnect} className="text-start mx-auto" style={{ maxWidth: '400px' }}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">WABA ID</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="WhatsApp Business Account ID"
                                value={manualData.wabaId}
                                onChange={(e) => setManualData({ ...manualData, wabaId: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Phone Number ID</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="Phone ID (found in Meta Setup)"
                                value={manualData.phoneId}
                                onChange={(e) => setManualData({ ...manualData, phoneId: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Access Token</label>
                            <input
                                type="password"
                                className="form-control rounded-3"
                                placeholder="Permanent User Token"
                                value={manualData.token}
                                onChange={(e) => setManualData({ ...manualData, token: e.target.value })}
                                required
                            />
                            <div className="form-text small">Generate this in Business Settings -&gt; System Users</div>
                        </div>
                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-success rounded-pill py-2 fw-bold" disabled={loading}>
                                {loading ? 'Validating...' : 'Connect Manually'}
                            </button>
                            <button type="button" onClick={() => setShowManual(false)} className="btn btn-light rounded-pill py-2">
                                Back to Meta Flow
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
}

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: any;
    }
}
