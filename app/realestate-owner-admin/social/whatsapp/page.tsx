'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import WhatsAppSetup from './SetupComponent';

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

export default function WhatsAppPage() {
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

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadData();
    }, []); // Removed activeTab from dependency array as all data is loaded at once

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const handleDisconnect = async () => {
        if (!isConnected || !confirm('Are you sure you want to disconnect WhatsApp Business? This will remove the connection and you will need to setup again.')) {
            return;
        }

        try {
            setSyncing(true);
            const accountId = accounts[0].id; // Get the ID of the connected account
            const res = await connectedAccountsApi.disconnect(accountId);
            if (res.success) {
                alert('WhatsApp Business disconnected successfully');
                loadData();
            } else {
                alert(res.message || 'Failed to disconnect account');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            alert('An error occurred during disconnect');
        } finally {
            setSyncing(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            setIsTokenExpired(false);
            setErrorMessage(null);
            const res = await whatsappApi.syncTemplates();
            if (res.success) {
                alert('Templates synced successfully');
                setIsTokenExpired(false);
                setErrorMessage(null);
                loadData();
            } else {
                const isExpired = res.message?.toLowerCase().includes('token') || res.message?.toLowerCase().includes('expired');
                if (isExpired) {
                    setIsTokenExpired(true);
                    setErrorMessage('Your WhatsApp connection has expired. Please reconnect to continue.');
                } else {
                    alert(res.message || 'Failed to sync templates');
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('An error occurred while syncing');
        } finally {
            setSyncing(false);
        }
    };

    const handleTestSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testData.to || !testData.message) {
            alert('Please fill in both fields.');
            return;
        }

        const phoneId = accounts[0]?.metadata?.phoneNumberId;
        if (!phoneId) {
            alert('Phone ID not found in account metadata. Please reconnect.');
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
                alert('Test message sent! Remember: Business-initiated text messages only work if the user has messaged you in the last 24h. Otherwise, use a Template.');
                setTestData({ ...testData, message: '' });
                setIsTokenExpired(false);
                setErrorMessage(null);
                loadData();
            } else {
                const isExpired = res.message?.toLowerCase().includes('token') || res.message?.toLowerCase().includes('expired');
                if (isExpired) {
                    setIsTokenExpired(true);
                    setErrorMessage('Your WhatsApp connection has expired. Please reconnect to continue.');
                } else {
                    alert(res.message || 'Failed to send test message');
                }
            }
        } catch (error) {
            console.error('Test send error:', error);
            alert('An error occurred during testing.');
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
                setCampaigns(campaigns.filter((c: any) => c.id !== id));
            } else {
                alert(res.message || 'Failed to delete campaign');
            }
        } catch (error) {
            console.error('Delete campaign error:', error);
            alert('Failed to delete campaign');
        } finally {
            setSyncing(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [templatesRes, campaignsRes, messagesRes, accountsRes] = await Promise.all([
                whatsappApi.getTemplates(),
                whatsappApi.getCampaigns(),
                whatsappApi.getMessages(),
                connectedAccountsApi.getAll({ platform: 'WHATSAPP' })
            ]);

            if (templatesRes.success) setTemplates(templatesRes.data.templates || []);
            if (campaignsRes.success) setCampaigns(campaignsRes.data.campaigns || []);
            if (messagesRes.success) setMessages(messagesRes.data.messages || []);

            if (accountsRes.success) {
                const fetchedAccounts = accountsRes.data.accounts || [];
                setAccounts(fetchedAccounts);

                // Proactively check token health if connected
                if (fetchedAccounts.length > 0) {
                    const account = fetchedAccounts[0];
                    const phoneId = account.metadata?.phoneNumberId;
                    if (phoneId) {
                        whatsappApi.getPhoneInfo(phoneId).then(res => {
                            if (!res.success) {
                                const isExpired = res.message?.toLowerCase().includes('token') || res.message?.toLowerCase().includes('expired');
                                if (isExpired) {
                                    setIsTokenExpired(true);
                                    setErrorMessage('Your WhatsApp connection has expired. Please reconnect to continue.');
                                }
                            }
                        }).catch(err => console.error('Token health check failed:', err));
                    }
                }
            }
        } catch (error) {
            console.error('Error loading WhatsApp data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isConnected = accounts.length > 0;

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h1 className="fw-bold h2 mb-1">WhatsApp Business</h1>
                        <p className="text-muted small">Manage templates, campaigns, and messages</p>
                    </div>
                    {isConnected && !isTokenExpired && (
                        <div className="d-flex gap-2">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="btn btn-outline-success px-4 rounded-3 shadow-sm d-flex align-items-center gap-2"
                            >
                                {syncing ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                    <i className="bi bi-arrow-repeat"></i>
                                )}
                                Sync Meta
                            </button>
                            <button
                                onClick={() => navigateTo('/social/whatsapp/templates/create')}
                                className="btn btn-success px-4 rounded-3 shadow-sm d-flex align-items-center gap-2"
                            >
                                <i className="bi bi-whatsapp"></i>
                                Create Template
                            </button>
                            <button
                                onClick={handleDisconnect}
                                disabled={syncing}
                                className="btn btn-outline-danger px-3 rounded-3 shadow-sm"
                                title="Disconnect Account"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    )}
                </div>

                {!isConnected && !loading && (
                    <div className="mb-4">
                        <WhatsAppSetup
                            onSuccess={() => {
                                setIsTokenExpired(false);
                                setErrorMessage(null);
                                loadData();
                            }}
                            initialData={accounts[0]}
                        />
                    </div>
                )}

                {isConnected && isTokenExpired && (
                    <div className="alert alert-danger rounded-4 border-0 shadow-sm p-4 mb-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                            </div>
                            <div>
                                <h5 className="fw-bold mb-1">Connection Expired</h5>
                                <p className="mb-0 opacity-75">{errorMessage || 'Your Meta access token has expired. Please reconnect your account.'}</p>
                            </div>
                        </div>
                        <button
                            className="btn btn-danger rounded-pill px-4 fw-bold"
                            onClick={() => {
                                // We keep isConnected true but show setup
                                // Actually, we should probably just show the setup component below
                                setErrorMessage(null);
                            }}
                        >
                            Reconnect Now
                        </button>
                    </div>
                )}

                {isConnected && isTokenExpired && (
                    <div className="mb-4">
                        <WhatsAppSetup
                            onSuccess={() => {
                                setIsTokenExpired(false);
                                setErrorMessage(null);
                                loadData();
                            }}
                            initialData={accounts[0]}
                        />
                    </div>
                )}

                {/* Main Dashboard - Only show if connected and token is valid */}
                {isConnected && !isTokenExpired && (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <ul className="nav nav-pills gap-2" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'templates' ? 'active bg-success' : 'text-muted'}`}
                                        onClick={() => setActiveTab('templates')}
                                    >
                                        <i className="bi bi-file-earmark-text me-2"></i>
                                        Templates
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'campaigns' ? 'active bg-success' : 'text-muted'}`}
                                        onClick={() => setActiveTab('campaigns')}
                                    >
                                        <i className="bi bi-megaphone me-2"></i>
                                        Campaigns
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'messages' ? 'active bg-success' : 'text-muted'}`}
                                        onClick={() => setActiveTab('messages')}
                                    >
                                        <i className="bi bi-chat-dots me-2"></i>
                                        Recent Chat
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'test' ? 'active bg-primary' : 'text-muted'}`}
                                        onClick={() => setActiveTab('test')}
                                    >
                                        <i className="bi bi-bug me-2"></i>
                                        Test Chat
                                    </button>
                                </li>
                            </ul>
                        </div>


                        {/* Content */}
                        <div className="card-body p-4">
                            {loading ? (
                                <div className="d-flex align-items-center justify-content-center py-5">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Test Chat Tab */}
                                    {activeTab === 'test' && (
                                        <div className="mx-auto" style={{ maxWidth: '500px' }}>
                                            <div className="text-center mb-4">
                                                <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex p-3 mb-3">
                                                    <i className="bi bi-chat-dots fs-3"></i>
                                                </div>
                                                <h4 className="fw-bold">Send Test Message</h4>
                                                <p className="text-muted small">Send a free-form message to check if your API is connected correctly.</p>
                                            </div>

                                            <form onSubmit={handleTestSend} className="card border-0 bg-light p-4 rounded-4">
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Recipient Mobile (with Country Code)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        placeholder="e.g. 919876543210"
                                                        value={testData.to}
                                                        onChange={(e) => setTestData({ ...testData, to: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="form-label small fw-bold">Message Text</label>
                                                    <textarea
                                                        className="form-control rounded-3"
                                                        rows={3}
                                                        placeholder="Hello, this is a test message from Virpanix!"
                                                        value={testData.message}
                                                        onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                                                        required
                                                    ></textarea>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={syncing}
                                                    className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
                                                >
                                                    {syncing ? (
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                    ) : (
                                                        <i className="bi bi-send me-2"></i>
                                                    )}
                                                    Send Test Message
                                                </button>
                                            </form>

                                            <div className="mt-4 p-3 bg-warning-subtle text-warning-emphasis rounded-3 small">
                                                <i className="bi bi-info-circle me-2"></i>
                                                <strong>Note:</strong> WhatsApp strictly enforces that free-form messages can only be sent to users who have messaged you first in the last 24 hours. For new recipients, you must use <strong>Templates</strong>.
                                            </div>
                                        </div>
                                    )}

                                    {/* Templates Tab */}
                                    {activeTab === 'templates' && (
                                        <div>
                                            {templates.length > 0 ? (
                                                <div className="row g-4">
                                                    {templates.map((template) => (
                                                        <div key={template.id} className="col-md-6 col-lg-4">
                                                            <div className="card border h-100 rounded-4 transition-all hvr-float shadow-sm">
                                                                <div className="card-body p-4">
                                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                                        <h3 className="h6 fw-bold mb-0 text-dark">{template.name}</h3>
                                                                        <span className={`badge rounded-pill ${template.status === 'APPROVED' ? 'bg-success-subtle text-success' :
                                                                            template.status === 'PENDING' ? 'bg-warning-subtle text-warning' :
                                                                                'bg-danger-subtle text-danger'
                                                                            }`}>
                                                                            {template.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="small text-muted mb-3">
                                                                        <div className="mb-1"><i className="bi bi-tag me-2"></i>{template.category}</div>
                                                                        <div><i className="bi bi-translate me-2"></i>{template.language}</div>
                                                                    </div>
                                                                    <div className="d-flex gap-2 mt-auto">
                                                                        <button
                                                                            onClick={() => navigateTo(`/social/whatsapp/templates/${template.id}`)}
                                                                            className="btn btn-light btn-sm flex-fill rounded-pill border"
                                                                        >
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            onClick={() => navigateTo(`/social/whatsapp/campaigns/create?template=${template.id}`)}
                                                                            className="btn btn-outline-success btn-sm flex-fill rounded-pill"
                                                                        >
                                                                            Use
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i className="bi bi-whatsapp display-1 text-success opacity-25 mb-3 d-block"></i>
                                                    <h3 className="h5 fw-bold text-dark mb-2">No templates yet</h3>
                                                    <p className="text-muted small mb-4">Create your first WhatsApp message template</p>
                                                    <button
                                                        onClick={() => navigateTo('/social/whatsapp/templates/create')}
                                                        className="btn btn-success px-4 rounded-pill"
                                                    >
                                                        Create Template
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Campaigns Tab */}
                                    {activeTab === 'campaigns' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <h2 className="h5 fw-bold mb-0 text-dark">Campaign History</h2>
                                                <button
                                                    onClick={() => navigateTo('/social/whatsapp/campaigns/create')}
                                                    className="btn btn-success rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
                                                >
                                                    <i className="bi bi-plus-lg"></i>
                                                    Create Campaign
                                                </button>
                                            </div>

                                            {campaigns.length > 0 ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {campaigns.map((campaign: any) => (
                                                        <div key={campaign.id} className="card border rounded-4 shadow-sm hvr-float">
                                                            <div className="card-body p-4">
                                                                <div className="row align-items-center">
                                                                    <div className="col">
                                                                        <div className="d-flex align-items-center gap-2 mb-3">
                                                                            <h3 className="h6 fw-bold mb-0">{campaign.name}</h3>
                                                                            <span className={`badge rounded-pill ${campaign.status === 'SENT' ? 'bg-success-subtle text-success' :
                                                                                    campaign.status === 'SCHEDULED' ? 'bg-primary-subtle text-primary' :
                                                                                        'bg-secondary-subtle text-secondary'
                                                                                }`}>
                                                                                {campaign.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="row g-4 text-center">
                                                                            <div className="col-3">
                                                                                <div className="small text-muted mb-1">Sent</div>
                                                                                <div className="fw-bold">{campaign.sentCount}</div>
                                                                            </div>
                                                                            <div className="col-3 border-start">
                                                                                <div className="small text-muted mb-1">Delivered</div>
                                                                                <div className="fw-bold text-success">{campaign.deliveredCount}</div>
                                                                            </div>
                                                                            <div className="col-3 border-start">
                                                                                <div className="small text-muted mb-1">Read</div>
                                                                                <div className="fw-bold text-primary">{campaign.readCount}</div>
                                                                            </div>
                                                                            <div className="col-3 border-start">
                                                                                <div className="small text-muted mb-1">Failed</div>
                                                                                <div className="fw-bold text-danger">{campaign.failedCount}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-auto d-flex gap-2">
                                                                        <button
                                                                            onClick={() => navigateTo(`/social/whatsapp/campaigns/${campaign.id}`)}
                                                                            className="btn btn-light rounded-pill border px-3"
                                                                            title="View Details"
                                                                        >
                                                                            <i className="bi bi-eye"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => navigateTo(`/social/whatsapp/campaigns/create?id=${campaign.id}`)}
                                                                            className="btn btn-light rounded-pill border px-3 text-primary"
                                                                            title="Edit/Clone"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                                                            className="btn btn-light rounded-pill border px-3 text-danger"
                                                                            title="Delete Campaign"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5 card border-dashed rounded-4">
                                                    <i className="bi bi-megaphone display-1 text-success opacity-25 mb-3 d-block"></i>
                                                    <h3 className="h5 fw-bold text-dark mb-2">No campaigns yet</h3>
                                                    <p className="text-muted small mb-4">Create your first WhatsApp campaign to reach your leads</p>
                                                    <button
                                                        onClick={() => navigateTo('/social/whatsapp/campaigns/create')}
                                                        className="btn btn-success px-4 rounded-pill"
                                                    >
                                                        Create Campaign
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Messages Tab */}
                                    {activeTab === 'messages' && (
                                        <div>
                                            {messages.length > 0 ? (
                                                <div className="d-flex flex-column gap-2">
                                                    {messages.map((message) => (
                                                        <div key={message.id} className="p-3 bg-light rounded-4 d-flex gap-3 align-items-start border">
                                                            <div className={`rounded-circle p-2 mt-1 ${message.direction === 'OUTBOUND' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'}`} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <i className={`bi bi-arrow-${message.direction === 'OUTBOUND' ? 'up' : 'down'}-right`}></i>
                                                            </div>
                                                            <div className="flex-fill">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="fw-bold text-dark small">{message.senderNumber}</span>
                                                                    <span className="text-muted" style={{ fontSize: '11px' }}>
                                                                        {new Date(message.createdAt).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="small text-dark mb-2 opacity-75">{message.messageText}</p>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className={`badge rounded-pill ${message.direction === 'OUTBOUND' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'}`}>
                                                                        {message.direction}
                                                                    </span>
                                                                    <span className="text-muted" style={{ fontSize: '10px' }}>{message.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i className="bi bi-chat-dots display-1 text-success opacity-25 mb-3 d-block"></i>
                                                    <h3 className="h5 fw-bold text-dark mb-2">No messages yet</h3>
                                                    <p className="text-muted small">Your WhatsApp messages will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hvr-float { transition: transform 0.2s ease-in-out; }
                .hvr-float:hover { transform: translateY(-3px); }
            `}</style>
        </MainLayout>
    );
}

