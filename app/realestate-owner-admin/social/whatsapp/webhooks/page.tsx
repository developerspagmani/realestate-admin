'use client';

import { useEffect, useState } from 'react';
import { whatsappApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { useRouter } from 'next/navigation';

export default function WhatsAppWebhooksPage() {
    return (
        <ModuleGuard moduleSlug="social_whatsapp">
            <WebhooksContent />
        </ModuleGuard>
    );
}

function WebhooksContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [webhookInfo, setWebhookInfo] = useState({
        callbackUrl: '',
        verifyToken: ''
    });
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        loadWebhookInfo();
    }, []);

    const loadWebhookInfo = async () => {
        try {
            setLoading(true);
            const res = await whatsappApi.getWebhookInfo();
            if (res.success) {
                setWebhookInfo(res.data);
            }
        } catch (error) {
            console.error('Error loading webhook info:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                <div className="mb-4">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-link text-decoration-none p-0 mb-3 text-muted small"
                    >
                        <i className="bi bi-arrow-left me-1"></i> Back to WhatsApp
                    </button>
                    <h1 className="fw-bold h2 mb-1">Webhook Configuration</h1>
                    <p className="text-muted small">Configure your Meta App to receive real-time message updates</p>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="card-header bg-white p-4 border-0">
                                <h5 className="fw-bold mb-0">Endpoint Details</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Callback URL</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 py-2 fw-medium"
                                            value={webhookInfo.callbackUrl}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-outline-secondary border-0 bg-light"
                                            onClick={() => copyToClipboard(webhookInfo.callbackUrl, 'url')}
                                        >
                                            {copied === 'url' ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
                                        </button>
                                    </div>
                                    <div className="form-text extra-small mt-2">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Note: If you are developing locally, use <strong>Ngrok</strong> to expose your local port to an HTTPS URL.
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Verify Token</label>
                                    <div className="input-group">
                                        <input
                                            type={showToken ? "text" : "password"}
                                            className="form-control bg-light border-0 py-2 fw-medium"
                                            value={webhookInfo.verifyToken}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-outline-secondary border-0 bg-light"
                                            onClick={() => setShowToken(!showToken)}
                                        >
                                            <i className={`bi bi-eye${showToken ? '-slash' : ''}`}></i>
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary border-0 bg-light"
                                            onClick={() => copyToClipboard(webhookInfo.verifyToken, 'token')}
                                        >
                                            {copied === 'token' ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-10 d-flex gap-3">
                                    <i className="bi bi-shield-check text-primary fs-4"></i>
                                    <div>
                                        <h6 className="fw-bold mb-1 text-primary">Security Recommendation</h6>
                                        <p className="small mb-0 text-muted">Keep your Verify Token secret. It is used by Meta to authenticate that the webhook requests are coming to the correct server.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white p-4 border-0">
                                <h5 className="fw-bold mb-0">Setup Instructions</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <div className="timeline-steps">
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="step-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', minWidth: '32px' }}>1</div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Open Meta Developer Portal</h6>
                                            <p className="small text-muted mb-0">Navigate to your App → WhatsApp → Configuration.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="step-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', minWidth: '32px' }}>2</div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Edit Webhook Configuration</h6>
                                            <p className="small text-muted mb-0">Paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> provided above.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="step-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', minWidth: '32px' }}>3</div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Add Webhook Fields</h6>
                                            <p className="small text-muted mb-0">Subscribe to <code>messages</code> and <code>message_deliveries</code> in the Webhook fields section.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3">
                                        <div className="step-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', minWidth: '32px' }}>4</div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Verification</h6>
                                            <p className="small text-muted mb-0">Click "Verify and Save". Meta will send a test request to your server.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 bg-dark text-white p-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <i className="bi bi-lightning-charge-fill text-warning"></i>
                                <h6 className="fw-bold mb-0">Why use Webhooks?</h6>
                            </div>
                            <p className="small opacity-75 mb-0">
                                Webhooks allow your application to receive messages instantly. Without them, our AI Chatbot won't be able to reply to your customers in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .extra-small { font-size: 0.75rem; }
            `}</style>
        </MainLayout>
    );
}
