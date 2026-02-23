'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';

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

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadData();
    }, []);

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await whatsappApi.syncTemplates();
            if (res.success) {
                alert('Templates synced successfully with Meta');
                loadData();
            } else {
                alert(res.message || 'Failed to sync templates');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('An error occurred while syncing');
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
            if (accountsRes.success) setAccounts(accountsRes.data.accounts || []);
        } catch (error) {
            console.error('Error loading WhatsApp data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isConnected = accounts.length > 0;

    if (loading && !syncing) {
        return (
            <MainLayout activePage="social-whatsapp">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1 text-dark">WhatsApp Business</h1>
                        <p className="text-muted small">Manage WhatsApp templates, campaigns, and direct messages</p>
                    </div>
                    {isConnected && (
                        <div className="d-flex gap-2">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="btn btn-outline-success px-4 rounded-pill shadow-sm d-flex align-items-center gap-2 border-0 bg-success bg-opacity-10"
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
                                className="btn btn-success px-4 rounded-pill shadow-sm d-flex align-items-center gap-2"
                            >
                                <i className="bi bi-plus-lg"></i>
                                Create Template
                            </button>
                        </div>
                    )}
                </div>

                {!isConnected && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-success bg-opacity-10">
                        <div className="card-body p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold text-success mb-1">WhatsApp Not Connected</h5>
                                <p className="text-muted small mb-0">Link your WhatsApp Business API account to start managing communication</p>
                            </div>
                            <button
                                onClick={() => navigateTo('/social/accounts')}
                                className="btn btn-success px-4 rounded-pill shadow-sm fw-bold"
                            >
                                Connect Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs & Content */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4 pb-0">
                        <ul className="nav nav-pills gap-2" id="whatsappTabs" role="tablist">
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'templates' ? 'active bg-success shadow-sm' : 'text-muted'}`}
                                    onClick={() => setActiveTab('templates')}
                                >
                                    <i className="bi bi-file-earmark-text me-2"></i> Templates
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'campaigns' ? 'active bg-success shadow-sm' : 'text-muted'}`}
                                    onClick={() => setActiveTab('campaigns')}
                                >
                                    <i className="bi bi-megaphone me-2"></i> Campaigns
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'messages' ? 'active bg-success shadow-sm' : 'text-muted'}`}
                                    onClick={() => setActiveTab('messages')}
                                >
                                    <i className="bi bi-chat-left-text me-2"></i> Messages
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className="nav-link rounded-pill px-4 fw-bold text-muted border-0 bg-transparent"
                                    onClick={() => navigateTo('/social/whatsapp/bot-builder')}
                                >
                                    <i className="bi bi-robot me-2"></i> Bot Funnel
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className="nav-link rounded-pill px-4 fw-bold text-muted border-0 bg-transparent"
                                    onClick={() => navigateTo('/social/whatsapp/webhooks')}
                                >
                                    <i className="bi bi-gear me-2"></i> Webhooks
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="card-body p-4">
                        {activeTab === 'templates' && (
                            <div className="row g-4">
                                {templates.length > 0 ? (
                                    templates.map((template) => (
                                        <div key={template.id} className="col-md-6 col-lg-4">
                                            <div className="card border h-100 rounded-4 transition-all hover-shadow bg-light bg-opacity-25">
                                                <div className="card-body p-4">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <h6 className="fw-bold mb-0 text-dark text-truncate" style={{ maxWidth: '180px' }}>{template.name}</h6>
                                                        <span className={`badge rounded-pill ${template.status === 'APPROVED' ? 'bg-success-subtle text-success' :
                                                            template.status === 'PENDING' ? 'bg-warning-subtle text-warning' :
                                                                'bg-danger-subtle text-danger'
                                                            }`}>
                                                            {template.status}
                                                        </span>
                                                    </div>
                                                    <div className="small text-muted mb-4">
                                                        <div className="mb-1"><i className="bi bi-tag-fill me-2 text-success opacity-50"></i>{template.category}</div>
                                                        <div><i className="bi bi-translate me-2 text-success opacity-50"></i>{template.language}</div>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            onClick={() => navigateTo(`/social/whatsapp/templates/${template.id}`)}
                                                            className="btn btn-white btn-sm flex-fill border rounded-pill shadow-sm fw-bold"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => navigateTo(`/social/whatsapp/campaigns/create?template=${template.id}`)}
                                                            className="btn btn-outline-success btn-sm flex-fill rounded-pill fw-bold"
                                                        >
                                                            Use
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="display-4 text-success opacity-25 mb-3"><i className="bi bi-phone"></i></div>
                                        <h6 className="fw-bold mb-2">No WhatsApp templates found</h6>
                                        <p className="text-muted small mb-4">Click Sync Meta to import existing templates or create a new one</p>
                                        <button
                                            onClick={() => navigateTo('/social/whatsapp/templates/create')}
                                            className="btn btn-success rounded-pill px-4"
                                        >
                                            Create Template
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'campaigns' && (
                            <div className="row g-3">
                                {campaigns.length > 0 ? (
                                    campaigns.map((campaign) => (
                                        <div key={campaign.id} className="col-12">
                                            <div className="card border rounded-4 bg-light bg-opacity-25 hover-shadow transition-all">
                                                <div className="card-body p-4">
                                                    <div className="row align-items-center">
                                                        <div className="col">
                                                            <h6 className="fw-bold mb-3 text-dark">{campaign.name}</h6>
                                                            <div className="row g-4 text-center">
                                                                <div className="col-3">
                                                                    <div className="small text-muted mb-1">Sent</div>
                                                                    <div className="fw-bold h5 mb-0">{campaign.sentCount}</div>
                                                                </div>
                                                                <div className="col-3 border-start">
                                                                    <div className="small text-muted mb-1">Delivered</div>
                                                                    <div className="fw-bold h5 mb-0 text-success">{campaign.deliveredCount}</div>
                                                                </div>
                                                                <div className="col-3 border-start">
                                                                    <div className="small text-muted mb-1">Read</div>
                                                                    <div className="fw-bold h5 mb-0 text-primary">{campaign.readCount}</div>
                                                                </div>
                                                                <div className="col-3 border-start">
                                                                    <div className="small text-muted mb-1">Failed</div>
                                                                    <div className="fw-bold h5 mb-0 text-danger">{campaign.failedCount}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-auto">
                                                            <button
                                                                onClick={() => navigateTo(`/social/whatsapp/campaigns/${campaign.id}`)}
                                                                className="btn btn-light rounded-pill border px-3 shadow-sm fw-bold"
                                                            >
                                                                <i className="bi bi-graph-up me-2"></i> Analytics
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="display-4 text-success opacity-25 mb-3"><i className="bi bi-megaphone-fill"></i></div>
                                        <h6 className="fw-bold mb-2">No active campaigns</h6>
                                        <p className="text-muted small mb-4">Start your first WhatsApp broadcast to reach your audience</p>
                                        <button
                                            onClick={() => navigateTo('/social/whatsapp/campaigns/create')}
                                            className="btn btn-success rounded-pill px-4"
                                        >
                                            Start Campaign
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light border-0">
                                        <tr>
                                            <th className="border-0 px-4 py-3 small">Direction</th>
                                            <th className="border-0 px-4 py-3 small">Number</th>
                                            <th className="border-0 px-4 py-3 small">Message</th>
                                            <th className="border-0 px-4 py-3 small">Status</th>
                                            <th className="border-0 px-4 py-3 small text-end">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-0">
                                        {messages.length > 0 ? (
                                            messages.map((msg) => (
                                                <tr key={msg.id}>
                                                    <td className="px-4 border-0">
                                                        <span className={`badge rounded-pill ${msg.direction === 'OUTBOUND' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'}`}>
                                                            {msg.direction}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 border-0 fw-medium">{msg.senderNumber}</td>
                                                    <td className="px-4 border-0 text-truncate" style={{ maxWidth: '250px' }}>{msg.messageText}</td>
                                                    <td className="px-4 border-0">
                                                        <span className={`badge rounded-pill ${msg.status === 'SENT' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 border-0 text-end small text-muted">
                                                        {new Date(msg.createdAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-5 text-muted small">No message history yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .hover-shadow:hover { 
                    transform: translateY(-5px);
                    box-shadow: 0 .5rem 1rem rgba(0,0,0,.1) !important;
                }
                .transition-all { transition: all 0.2s ease-in-out; }
            `}</style>
        </MainLayout>
    );
}
