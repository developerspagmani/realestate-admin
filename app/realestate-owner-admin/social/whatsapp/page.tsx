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
    }, []); // Removed activeTab from dependency array as all data is loaded at once

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await whatsappApi.syncTemplates();
            if (res.success) {
                alert('Templates synced successfully');
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

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h1 className="fw-bold h2 mb-1">WhatsApp Business</h1>
                        <p className="text-muted small">Manage templates, campaigns, and messages</p>
                    </div>
                    {isConnected && (
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
                        </div>
                    )}
                </div>

                {!isConnected && !loading && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-success bg-opacity-10">
                        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                            <div>
                                <h4 className="fw-bold text-success mb-1">Connect WhatsApp Business</h4>
                                <p className="text-muted mb-0">You need to connect your WhatsApp Business account to start sending messages.</p>
                            </div>
                            <button
                                onClick={() => navigateTo('/social/accounts')}
                                className="btn btn-success px-4 rounded-pill shadow-sm"
                            >
                                Connect Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
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
                                    Messages
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
                                        {campaigns.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {campaigns.map((campaign) => (
                                                    <div key={campaign.id} className="card border rounded-4 shadow-sm hvr-float">
                                                        <div className="card-body p-4">
                                                            <div className="row align-items-center">
                                                                <div className="col">
                                                                    <h3 className="h6 fw-bold mb-3">{campaign.name}</h3>
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
                                                                <div className="col-auto">
                                                                    <button
                                                                        onClick={() => navigateTo(`/social/whatsapp/campaigns/${campaign.id}`)}
                                                                        className="btn btn-light rounded-pill border px-3"
                                                                    >
                                                                        <i className="bi bi-eye me-1"></i>
                                                                        Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-5">
                                                <i className="bi bi-megaphone display-1 text-success opacity-25 mb-3 d-block"></i>
                                                <h3 className="h5 fw-bold text-dark mb-2">No campaigns yet</h3>
                                                <p className="text-muted small mb-4">Create your first WhatsApp campaign</p>
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
            </div>

            <style jsx>{`
                .hvr-float { transition: transform 0.2s ease-in-out; }
                .hvr-float:hover { transform: translateY(-3px); }
            `}</style>
        </MainLayout>
    );
}

