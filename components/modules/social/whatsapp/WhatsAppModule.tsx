'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import WhatsAppSetupModule from './WhatsAppSetupModule';
import ModuleGuard from '@/components/common/ModuleGuard';
import Toast from '@/components/common/Toast';

interface WhatsAppTemplate {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
}

interface WhatsAppCampaign {
    id: string;
    name: string;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
}

interface WhatsAppMessage {
    id: string;
    direction: 'OUTBOUND' | 'INBOUND';
    senderNumber: string;
    createdAt: string;
    messageText: string;
    status: string;
}

export default function WhatsAppModule() {
    return (
        <ModuleGuard moduleSlug="social_whatsapp">
            <WhatsAppContent />
        </ModuleGuard>
    );
}

function WhatsAppContent() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('templates');
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [testData, setTestData] = useState({
        to: '',
        message: ''
    });
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [templatesRes, campaignsRes, messagesRes, accountsRes] = await Promise.all([
                whatsappApi.getTemplates(),
                whatsappApi.getCampaigns(),
                whatsappApi.getMessages(),
                connectedAccountsApi.getAll({ platform: 'WHATSAPP' })
            ]);

            if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data.templates || []);
            if (campaignsRes.success && campaignsRes.data) setCampaigns(campaignsRes.data.campaigns || []);
            if (messagesRes.success && messagesRes.data) setMessages(messagesRes.data.messages || []);
            if (accountsRes.success && accountsRes.data) setAccounts(accountsRes.data.accounts || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const handleDisconnect = async () => {
        if (!isConnected || !confirm('Are you sure you want to disconnect WhatsApp Business?')) {
            return;
        }

        try {
            setSyncing(true);
            const accountId = accounts[0].id;
            const res = await connectedAccountsApi.disconnect(accountId);
            if (res.success) {
                showToast('WhatsApp Business disconnected successfully');
                loadData();
            } else {
                showToast(res.message || 'Failed to disconnect', 'error');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await whatsappApi.syncTemplates();
            if (res.success) {
                showToast('Templates synced successfully');
                setIsTokenExpired(false);
                setErrorMessage(null);
                loadData();
            } else {
                const isExpired = res.message?.toLowerCase().includes('token') || res.message?.toLowerCase().includes('expired');
                if (isExpired) {
                    setIsTokenExpired(true);
                    setErrorMessage('Your WhatsApp connection has expired.');
                    showToast('Connection expired. Please reconnect.', 'error');
                } else {
                    showToast(res.message || 'Failed to sync templates', 'error');
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleTestSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testData.to || !testData.message) return;

        const phoneId = accounts[0]?.metadata?.phoneNumberId;
        if (!phoneId) {
            showToast('Phone ID not found.', 'error');
            return;
        }

        try {
            setSyncing(true);
            const res = await whatsappApi.sendMessage({
                phoneNumberId: phoneId,
                to: testData.to,
                text: testData.message
            });

            if (res.success) {
                showToast('Test message sent!');
                setTestData({ ...testData, message: '' });
                loadData();
            } else {
                showToast(res.message || 'Failed to send', 'error');
            }
        } catch (error) {
            console.error('Test send error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            setSyncing(true);
            const res = await whatsappApi.deleteCampaign(id);
            if (res.success) {
                setCampaigns(campaigns.filter((c: WhatsAppCampaign) => c.id !== id));
                showToast('Campaign deleted');
            }
        } catch (error) {
            console.error('Delete campaign error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const isConnected = accounts.length > 0;

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h1 className="fw-bold h2 mb-1">WhatsApp Business</h1>
                        <p className="text-muted small">Manage templates, campaigns, and messages</p>
                    </div>
                    {isConnected && !isTokenExpired && (
                        <div className="d-flex gap-2">
                            <button onClick={handleSync} disabled={syncing} className="btn btn-outline-success px-4 rounded-3 shadow-sm d-flex align-items-center gap-2">
                                {syncing ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-arrow-repeat"></i>}
                                Sync Meta
                            </button>
                            <button onClick={() => navigateTo('/social/whatsapp/templates/create')} className="btn btn-success px-4 rounded-3 shadow-sm d-flex align-items-center gap-2">
                                <i className="bi bi-whatsapp"></i> Create Template
                            </button>
                            <button onClick={handleDisconnect} disabled={syncing} className="btn btn-outline-danger px-3 rounded-3 shadow-sm">
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    )}
                </div>

                {!isConnected && !loading && (
                    <WhatsAppSetupModule onSuccess={loadData} initialData={accounts[0]} />
                )}

                {isConnected && !isTokenExpired && (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <ul className="nav nav-pills gap-2">
                                <li className="nav-item">
                                    <button className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'templates' ? 'active bg-success' : 'text-muted'}`} onClick={() => setActiveTab('templates')}>Templates</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'campaigns' ? 'active bg-success' : 'text-muted'}`} onClick={() => setActiveTab('campaigns')}>Campaigns</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'messages' ? 'active bg-success' : 'text-muted'}`} onClick={() => setActiveTab('messages')}>Recent Chat</button>
                                </li>
                                <li className="nav-item">
                                    <button className="nav-link rounded-pill px-4 fw-bold text-muted border-0 bg-transparent" onClick={() => navigateTo('/social/whatsapp/bot-builder')}>
                                        <i className="bi bi-robot me-1"></i> Bot Funnel
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'test' ? 'active bg-primary' : 'text-muted'}`} onClick={() => setActiveTab('test')}>Test Chat</button>
                                </li>
                                <li className="nav-item">
                                    <button className="nav-link rounded-pill px-4 fw-bold text-muted" onClick={() => navigateTo('/social/whatsapp/webhooks')}>
                                        <i className="bi bi-gear me-1"></i> Webhooks
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="card-body p-4">
                            {loading ? (
                                <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
                            ) : (
                                <>
                                    {activeTab === 'templates' && (
                                        <div className="row g-4">
                                            {templates.length > 0 ? templates.map(template => (
                                                <div key={template.id} className="col-md-4">
                                                    <div className="card border rounded-4 p-4 hvr-float shadow-sm">
                                                        <div className="d-flex justify-content-between mb-3">
                                                            <h6 className="fw-bold mb-0">{template.name}</h6>
                                                            <span className="badge rounded-pill bg-success-subtle text-success">{template.status}</span>
                                                        </div>
                                                        <div className="small text-muted mb-3">
                                                            <div><i className="bi bi-tag me-2"></i>{template.category}</div>
                                                            <div><i className="bi bi-translate me-2"></i>{template.language}</div>
                                                        </div>
                                                        <button onClick={() => navigateTo(`/social/whatsapp/campaigns/create?template=${template.id}`)} className="btn btn-outline-success btn-sm w-100 rounded-pill">Use Template</button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-12 text-center py-5">
                                                    <p className="text-muted">No templates found. Click Sync Meta to fetch or Create Template.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'campaigns' && (
                                        <div className="d-flex flex-column gap-3">
                                            {campaigns.length > 0 ? campaigns.map((campaign: any) => (
                                                <div key={campaign.id} className="card border rounded-4 p-4 shadow-sm">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 className="fw-bold mb-0">{campaign.name}</h6>
                                                        <div className="d-flex gap-2">
                                                            <button onClick={() => handleDeleteCampaign(campaign.id)} className="btn btn-link text-danger btn-sm p-0"><i className="bi bi-trash"></i></button>
                                                        </div>
                                                    </div>
                                                    <div className="row g-2 text-center small">
                                                        <div className="col-3"><div>Sent</div><div className="fw-bold">{campaign.sentCount}</div></div>
                                                        <div className="col-3 border-start"><div>Delivered</div><div className="fw-bold text-success">{campaign.deliveredCount}</div></div>
                                                        <div className="col-3 border-start"><div>Read</div><div className="fw-bold text-primary">{campaign.readCount}</div></div>
                                                        <div className="col-3 border-start"><div>Failed</div><div className="fw-bold text-danger">{campaign.failedCount}</div></div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-5">
                                                    <p className="text-muted">No campaigns found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'messages' && (
                                        <div className="d-flex flex-column gap-2">
                                            {messages.length > 0 ? messages.map(message => (
                                                <div key={message.id} className="p-3 bg-light rounded-4 border">
                                                    <div className="d-flex justify-content-between small mb-1">
                                                        <span className="fw-bold">{message.senderNumber}</span>
                                                        <span className="text-muted">{new Date(message.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="small mb-0">{message.messageText}</p>
                                                </div>
                                            )) : (
                                                <div className="text-center py-5">
                                                    <p className="text-muted">No messages found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'test' && (
                                        <form onSubmit={handleTestSend} className="mx-auto" style={{ maxWidth: '400px' }}>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">Mobile Number</label>
                                                <input type="text" className="form-control" value={testData.to} onChange={e => setTestData({ ...testData, to: e.target.value })} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">Message</label>
                                                <textarea className="form-control" value={testData.message} onChange={e => setTestData({ ...testData, message: e.target.value })} required />
                                            </div>
                                            <button type="submit" disabled={syncing} className="btn btn-primary w-100 rounded-pill">Send Test</button>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{`
                .hvr-float { transition: transform 0.2s; }
                .hvr-float:hover { transform: translateY(-3px); }
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
