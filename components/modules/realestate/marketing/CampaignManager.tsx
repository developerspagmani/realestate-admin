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

interface CampaignManagerProps {
    mode?: 'admin' | 'owner';
}

export default function CampaignManager({ mode = 'admin' }: CampaignManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'campaigns' | 'audience' | 'templates' | 'automation' | 'forms'>('campaigns');
    const [showDesigner, setShowDesigner] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [launching, setLaunching] = useState<string | null>(null);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [showHowItWorks, setShowHowItWorks] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('marketing_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('marketing_hideGuide', (!show).toString());
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const [marketingStats, setMarketingStats] = useState<any>(null);

    const loadStats = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const res = await marketingService.getMarketingStats(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (res.success) setMarketingStats(res.data);
        } catch (e) { console.error(e); }
    };

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const res = await marketingService.getCampaigns(token, { tenantId: tenantId || undefined });
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
    }, [activeTenantId, activeOwnerId, tenantType, mode, user]);

    const stats = [
        {
            label: 'Campaigns',
            value: marketingStats?.sentCampaigns || '0',
            icon: 'bi-megaphone',
            color: 'dark'
        },
        {
            label: 'Total Sent',
            value: marketingStats?.totalDelivered?.toLocaleString() || '0',
            icon: 'bi-send',
            color: 'dark'
        },
        {
            label: 'Total Opens',
            value: marketingStats?.totalOpened?.toLocaleString() || '0',
            icon: 'bi-eye',
            color: 'success'
        },
        {
            label: 'Open Rate',
            value: (marketingStats?.totalDelivered > 0)
                ? `${((marketingStats.totalOpened / marketingStats.totalDelivered) * 100).toFixed(1)}%`
                : '0%',
            icon: 'bi-envelope-open',
            color: 'success'
        },
        {
            label: 'Click Rate',
            value: (marketingStats?.totalDelivered > 0)
                ? `${((marketingStats.totalClicked / marketingStats.totalDelivered) * 100).toFixed(1)}%`
                : '0%',
            icon: 'bi-cursor',
            color: 'info'
        },
        {
            label: 'Total Clicks',
            value: marketingStats?.totalClicked?.toLocaleString() || '0',
            icon: 'bi-graph-up-arrow',
            color: 'secondary'
        },
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

    const handleLaunch = async (campaign: any) => {
        if (!campaign.groupId) {
            showToast('Please select a target group before launching.', 'error');
            return;
        }
        if (!campaign.templateId) {
            showToast('Please select a template before launching.', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to launch "${campaign.name}"? This will send emails to all leads in the "${campaign.group?.name}" group immediately.`)) return;

        setLaunching(campaign.id);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.launchCampaign(token, campaign.id);
            if (res.success) {
                showToast(res.message || 'Campaign launched successfully!');
                loadCampaigns();
                loadStats();
            } else {
                showToast(res.message || 'Failed to launch campaign', 'error');
            }
        } catch (err) {
            showToast('Error launching campaign', 'error');
        } finally {
            setLaunching(null);
        }
    };

    return (
        <MainLayout activePage="marketing">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h1 className="fw-bold h2 mb-1">
                                {mode === 'admin' ? 'Marketing Hub' : 'My Marketing Hub'}
                            </h1>
                            <p className="text-muted small mb-0">Manage your email campaigns, audience growth and automations</p>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                </div>

                {showHowItWorks && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white overflow-hidden position-relative animate-fade-in">
                        <button
                            className="btn position-absolute top-0 end-0 m-3 text-white opacity-50 hover-opacity-100 p-2"
                            style={{ zIndex: 1 }}
                            onClick={() => toggleGuide(false)}
                            title="Hide this section"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className="card-body p-4 p-lg-5">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <h3 className="fw-bold mb-3 text-white">Your Command Center for Growth</h3>
                                    <p className="opacity-75 mb-4">The Marketing Hub is where you turn leads into lifelong clients. Here is how to use it effectively:</p>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-megaphone text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">1. Email Blasts</div>
                                                    <div className="small opacity-75">Send professional updates, newsletters, and new listing alerts.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-funnel text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">2. Smart Segmentation</div>
                                                    <div className="small opacity-75">Organize leads into groups based on budget, property type, or status.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-magic text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">3. Reusable Content</div>
                                                    <div className="small opacity-75">Create high-conversion templates and forms once and use them forever.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-cpu text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">4. Automation Flows</div>
                                                    <div className="small opacity-75">Build "set and forget" workflows to nurture leads through their journey.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 d-none d-lg-block text-center">
                                    <i className="bi bi-graph-up-arrow display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                tenantId={(mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || ''}
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
                                        className="btn btn-primary rounded-4 px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                        onClick={() => { setEditingCampaign(null); setShowDesigner(true); }}
                                    >
                                        <i className="bi bi-plus-lg"></i> Create Campaign
                                    </button>
                                </div>

                                <div className="col-12">
                                    <div className="card border-0 shadow-sm rounded-4 p-0 overflow-visible">
                                        <div className="vi-table-responsive">
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
                                                                <span className={`badge rounded-4 extra-small px-3 ${campaign.status === 4 ? 'bg-success bg-opacity-10 text-success' :
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
                                                                        {campaign.status !== 4 && (
                                                                            <>
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item small d-flex align-items-center gap-2 text-primary fw-bold"
                                                                                        onClick={() => handleLaunch(campaign)}
                                                                                        disabled={launching === campaign.id}
                                                                                    >
                                                                                        {launching === campaign.id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-rocket-takeoff"></i>}
                                                                                        Launch Now
                                                                                    </button>
                                                                                </li>
                                                                                <li><hr className="dropdown-divider" /></li>
                                                                            </>
                                                                        )}
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
                        <AudienceManager tenantId={(mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || ''} />
                    )}

                    {activeTab === 'templates' && (
                        <TemplateManager tenantId={(mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || ''} />
                    )}

                    {activeTab === 'automation' && (
                        <WorkflowManager tenantId={(mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || ''} />
                    )}

                    {activeTab === 'forms' && (
                        <MarketingFormBuilder tenantId={(mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || ''} />
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
