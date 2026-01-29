'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Toast from '@/components/common/Toast';
import AudienceManager from './AudienceManager';
import TemplateManager from './TemplateManager';
import MarketingFormBuilder from './MarketingFormBuilder';
import WorkflowManager from './WorkflowManager';
import CampaignDesigner from './CampaignDesigner';
import { marketingService, getAuthToken } from '@/app/services/api';

export default function CampaignManager() {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId } = useManagementContext();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'campaigns' | 'audience' | 'templates' | 'automation' | 'forms'>('campaigns');
    const [showDesigner, setShowDesigner] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const [marketingStats, setMarketingStats] = useState<any>(null);

    const loadStats = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.getMarketingStats(token);
            if (res.success) setMarketingStats(res.data);
        } catch (e) { console.error(e); }
    };

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.getCampaigns(token, { tenantId: activeTenantId });
            if (res.success) {
                setCampaigns(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
        loadStats();
    }, [activeTenantId]);

    const stats = [
        { label: 'Total Sent', value: marketingStats?.sentCampaigns?.toLocaleString() || '0', icon: 'bi-send', color: 'primary' },
        {
            label: 'Open Rate',
            value: marketingStats?.totalDelivered > 0
                ? `${((marketingStats.totalOpened / marketingStats.totalDelivered) * 100).toFixed(1)}%`
                : '0%',
            icon: 'bi-envelope-open', color: 'success'
        },
        {
            label: 'Click Rate',
            value: marketingStats?.totalOpened > 0
                ? `${((marketingStats.totalClicked / marketingStats.totalOpened) * 100).toFixed(1)}%`
                : '0%',
            icon: 'bi-cursor', color: 'info'
        },
        { label: 'Form Submissions', value: marketingStats?.totalSubmissions?.toLocaleString() || '0', icon: 'bi-file-earmark-check', color: 'warning' },
        { label: 'Total Clicks', value: marketingStats?.totalClicked?.toLocaleString() || '0', icon: 'bi-graph-up-arrow', color: 'secondary' },
    ];

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.deleteCampaign(token, id);
            if (res.success) {
                showToast('Campaign deleted');
                loadCampaigns();
            }
        } catch (err) {
            showToast('Failed to delete campaign', 'error');
        }
    };

    const handleEdit = (campaign: any) => {
        setEditingCampaign(campaign);
        setShowDesigner(true);
    };

    return (
        <MainLayout activePage="marketing">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Marketing Hub</h1>
                        <p className="text-muted small mb-0">Manage your email campaigns, audience growth and automations</p>
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="row g-4 mb-5">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 hvr-translate-up">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded-4 text-${stat.color}`}>
                                        <i className={`bi ${stat.icon} fs-4`}></i>
                                    </div>
                                    <div>
                                        <div className="text-muted extra-small fw-bold text-uppercase">{stat.label}</div>
                                        <div className="fs-4 fw-extrabold">{stat.value}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sub-navigation */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <div className="card-header bg-white border-0 p-3 pb-0">
                        <ul className="nav nav-tabs nav-tabs-custom border-0 gap-4">
                            {[
                                { id: 'campaigns', label: 'Email Campaigns', icon: 'bi-megaphone' },
                                { id: 'audience', label: 'Audience & Groups', icon: 'bi-people' },
                                { id: 'templates', label: 'Content Templates', icon: 'bi-layout-text-window' },
                                { id: 'automation', label: 'Workflows', icon: 'bi-cpu' },
                                { id: 'forms', label: 'Lead Forms', icon: 'bi-file-earmark-plus' },
                            ].map((tab) => (
                                <li className="nav-item" key={tab.id}>
                                    <button
                                        className={`nav-link border-0 px-4 py-3 fw-bold d-flex align-items-center gap-2 position-relative ${activeTab === tab.id ? 'active text-primary' : 'text-muted'}`}
                                        onClick={() => setActiveTab(tab.id as any)}
                                    >
                                        <i className={`bi ${tab.icon}`}></i>
                                        {tab.label}
                                        {activeTab === tab.id && <div className="active-line"></div>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Content Area based on Tab */}
                <div className="marketing-content">
                    {activeTab === 'campaigns' && (
                        showDesigner ? (
                            <CampaignDesigner
                                tenantId={activeTenantId || ''}
                                initialData={editingCampaign}
                                onClose={() => {
                                    setShowDesigner(false);
                                    setEditingCampaign(null);
                                    loadCampaigns();
                                }}
                            />
                        ) : (
                            <div className="row g-4">
                                <div className="col-12 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0">Recent Campaigns</h5>
                                    <button
                                        className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                        onClick={() => { setEditingCampaign(null); setShowDesigner(true); }}
                                    >
                                        <i className="bi bi-plus-lg"></i> Create Campaign
                                    </button>
                                </div>

                                <div className="col-12">
                                    <div className="card border-0 shadow-sm rounded-4 p-0 overflow-hidden">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="px-4 py-3 small text-uppercase text-muted fw-bold">Campaign Name</th>
                                                        <th className="py-3 small text-uppercase text-muted fw-bold">Target Group</th>
                                                        <th className="py-3 small text-uppercase text-muted fw-bold">Status</th>
                                                        <th className="py-3 small text-uppercase text-muted fw-bold">Open/Click</th>
                                                        <th className="px-4 py-3 small text-uppercase text-muted fw-bold text-end">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campaigns.length === 0 ? (
                                                        <tr className="border-bottom-0">
                                                            <td className="px-5 py-5 text-center text-muted" colSpan={5}>
                                                                <i className="bi bi-envelope-paper display-4 mt-3 d-block opacity-25"></i>
                                                                <p className="mt-3">No campaigns found. Start your first marketing blast today!</p>
                                                            </td>
                                                        </tr>
                                                    ) : campaigns.map(campaign => (
                                                        <tr key={campaign.id}>
                                                            <td className="px-4 py-3">
                                                                <div className="fw-bold">{campaign.name}</div>
                                                                <div className="extra-small text-muted">Sent: {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'N/A'}</div>
                                                            </td>
                                                            <td className="small">{campaign.group?.name || 'No Group'}</td>
                                                            <td>
                                                                <span className={`badge rounded-pill extra-small px-3 ${campaign.status === 4 ? 'bg-success bg-opacity-10 text-success' :
                                                                    campaign.status === 1 ? 'bg-warning bg-opacity-10 text-warning' :
                                                                        'bg-primary bg-opacity-10 text-primary'
                                                                    }`}>
                                                                    {campaign.status === 4 ? 'Sent' : campaign.status === 1 ? 'Draft' : 'Scheduled'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div className="small"><i className="bi bi-eye text-primary me-1"></i> {campaign.openedCount || 0}</div>
                                                                    <div className="small"><i className="bi bi-cursor text-info me-1"></i> {campaign.clickedCount || 0}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-end">
                                                                <div className="dropdown">
                                                                    <button className="btn btn-link btn-sm p-0 text-muted" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                                                    <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                                                        <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => handleEdit(campaign)}><i className="bi bi-pencil"></i> Edit Details</button></li>
                                                                        <li><hr className="dropdown-divider" /></li>
                                                                        <li><button className="dropdown-item small text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(campaign.id, campaign.name)}><i className="bi bi-trash"></i> Delete Campaign</button></li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'audience' && (
                        <AudienceManager tenantId={activeTenantId || ''} />
                    )}

                    {activeTab === 'templates' && (
                        <TemplateManager tenantId={activeTenantId || ''} />
                    )}

                    {activeTab === 'automation' && (
                        <WorkflowManager tenantId={activeTenantId || ''} />
                    )}

                    {activeTab === 'forms' && (
                        <MarketingFormBuilder tenantId={activeTenantId || ''} />
                    )}
                </div>
            </div>

            <style jsx>{`
                .nav-tabs-custom .nav-link {
                    background: transparent;
                    transition: all 0.3s;
                }
                .nav-link.active .active-line {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--bs-primary);
                    border-radius: 3px 3px 0 0;
                }
                .extra-small { font-size: 0.72rem; }
                .fw-extrabold { font-weight: 800; }
                .hvr-translate-up { transition: all 0.25s ease; border: 1px solid rgba(0,0,0,0.05); }
                .hvr-translate-up:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; border-color: rgba(var(--bs-primary-rgb), 0.2); }
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
