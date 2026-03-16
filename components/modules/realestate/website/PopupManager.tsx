'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { popupService, getAuthToken, websiteService, marketingService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { WebsitePopup, Website, MarketingForm } from '@/types';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import PopupForm from '@/components/modules/realestate/website/PopupForm';
import PopupCard from '@/components/modules/realestate/website/PopupCard';

interface PopupManagerProps {
    mode?: 'admin' | 'owner';
}

export default function PopupManager({ mode = 'admin' }: PopupManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId, activeOwnerId } = useManagementContext();
    const [popups, setPopups] = useState<WebsitePopup[]>([]);
    const [websites, setWebsites] = useState<Website[]>([]);
    const [marketingForms, setMarketingForms] = useState<MarketingForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPopup, setEditingPopup] = useState<WebsitePopup | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadPopups();
            loadWebsites();
            loadMarketingForms();
        }
    }, [isAuthenticated, activeTenantId, activeOwnerId]);

    const loadPopups = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await popupService.getPopups(token, {
                ...(tenantId && { tenantId }),
            });
            if (response.success) {
                setPopups(response.data);
            }
        } catch (error) {
            console.error('Failed to load popups:', error);
            showToast('Failed to load popups', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadWebsites = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await websiteService.getWebsites(token, {
                ...(tenantId && { tenantId }),
            });
            if (response.success) {
                setWebsites(response.data);
            }
        } catch (error) {
            console.error('Failed to load websites:', error);
        }
    };

    const loadMarketingForms = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await marketingService.getForms(token, { tenantId });
            if (response.success) {
                setMarketingForms(response.data);
            }
        } catch (error) {
            console.error('Failed to load marketing forms:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this popup?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await popupService.deletePopup(token, id, tenantId);
            if (response.success) {
                loadPopups();
                showToast('Popup deleted successfully');
            } else {
                showToast(response.message || 'Failed to delete popup', 'error');
            }
        } catch (error) {
            console.error('Failed to delete popup:', error);
            showToast('Failed to delete popup', 'error');
        }
    };

    const handleToggleStatus = async (popup: WebsitePopup) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await popupService.updatePopup(token, popup.id, { isActive: !popup.isActive }, tenantId);
            if (response.success) {
                loadPopups();
                showToast(`Popup ${!popup.isActive ? 'activated' : 'deactivated'} successfully`);
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            showToast('Failed to update status', 'error');
        }
    };

    const handleEdit = (popup: WebsitePopup) => {
        setEditingPopup(popup);
        setShowForm(true);
    };

    const POPUP_TEMPLATES = [
        {
            name: 'Special Discount Offer',
            description: 'Convert visitors with a limited time discount.',
            icon: 'bi-percent',
            color: '#FF5733',
            data: {
                name: 'Summer Sale Template',
                type: 'modal',
                trigger: 'delay',
                triggerValue: '5',
                content: {
                    title: 'Exclusive 10% Off!',
                    body: 'Book your dream stay today and get an instant 10% discount. Valid for the next 24 hours only.',
                    ctaText: 'Claim Discount',
                    ctaUrl: '#',
                    backgroundColor: '#ffffff',
                    textColor: '#1a1a1a',
                    buttonColor: '#ff5733',
                    buttonTextColor: '#ffffff'
                }
            }
        },
        {
            name: 'Newsletter Subscription',
            description: 'Grow your email list for property updates.',
            icon: 'bi-envelope-paper',
            color: '#2ECC71',
            data: {
                name: 'Weekly Digest Template',
                type: 'slide_in',
                trigger: 'scroll',
                triggerValue: '30',
                content: {
                    title: 'Join Our Property VIPs',
                    body: 'Get early access to exclusive listings and market insights delivered straight to your inbox.',
                    ctaText: 'Subscribe Now',
                    ctaUrl: '#',
                    backgroundColor: '#f8f9fa',
                    textColor: '#2c3e50',
                    buttonColor: '#2ecc71',
                    buttonTextColor: '#ffffff'
                }
            }
        },
        {
            name: 'Exit Help Assistance',
            description: 'Capture leads before they leave your site.',
            icon: 'bi-chat-dots',
            color: '#3498DB',
            data: {
                name: 'Exit Help Template',
                type: 'modal',
                trigger: 'exit_intent',
                content: {
                    title: 'Wait! Still Looking?',
                    body: 'Our property experts are online and ready to help you find the perfect match. Don\'t miss out!',
                    ctaText: 'Talk to an Expert',
                    ctaUrl: '#',
                    backgroundColor: '#ffffff',
                    textColor: '#2c3e50',
                    buttonColor: '#3498db',
                    buttonTextColor: '#ffffff'
                }
            }
        }
    ];

    const handleCreateFromTemplate = (templateData: any) => {
        setEditingPopup({
            ...templateData,
            id: '', // New popup
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            websiteId: websites[0]?.id || ''
        } as WebsitePopup);
        setShowForm(true);
    };

    return (
        <MainLayout activePage="popups" hideHeader={showForm}>
            <div className="container-fluid py-4 h-100 position-relative">
                {!showForm ? (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h1 className="fw-bold h2 mb-1 text-dark">Website Popups</h1>
                                <p className="text-muted small mb-0">Increase conversions with targeted modals and banners on your property sites.</p>
                            </div>
                            <button
                                className="btn btn-primary shadow-sm px-4 rounded-4"
                                onClick={() => {
                                    setEditingPopup(null);
                                    setShowForm(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                New Popup
                            </button>
                        </div>

                        {/* Pre-built Templates Section */}
                        <div className="mb-5">
                            <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-magic text-primary me-2 fs-4"></i>
                                <h4 className="fw-bold mb-0">Design Templates</h4>
                            </div>
                            <div className="row g-3">
                                {POPUP_TEMPLATES.map((tmpl, idx) => (
                                    <div key={idx} className="col-lg-4">
                                        <div 
                                            className="card border-0 shadow-sm rounded-4 h-100 template-card p-4"
                                            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                            onClick={() => handleCreateFromTemplate(tmpl.data)}
                                        >
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="icon-wrapper rounded-circle p-3 me-3" style={{ backgroundColor: `${tmpl.color}15`, color: tmpl.color }}>
                                                    <i className={`bi ${tmpl.icon} fs-4`}></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{tmpl.name}</h6>
                                                    <small className="text-muted">{tmpl.description}</small>
                                                </div>
                                            </div>
                                            <button className="btn btn-sm btn-light rounded-pill w-100 fw-bold">Use This Design</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="row g-4">
                            {loading ? (
                                <div className="col-12 py-5">
                                    <Loader message="Loading popups..." />
                                </div>
                            ) : popups.length === 0 ? (
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                        <i className="bi bi-megaphone display-1 text-muted opacity-25"></i>
                                        <h4 className="mt-3 fw-bold text-muted">No Popups Found</h4>
                                        <p className="text-muted">Create your first conversion-focused popup to engage your visitors.</p>
                                        <div className="mt-3">
                                            <button
                                                className="btn btn-outline-primary rounded-pill px-4"
                                                onClick={() => setShowForm(true)}
                                            >
                                                Get Started
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : popups.map((popup) => (
                                <div key={popup.id} className="col-md-6 col-lg-4">
                                    <PopupCard
                                        popup={popup}
                                        websiteName={websites.find(w => w.id === popup.websiteId)?.name || 'Unknown Website'}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: 100, minHeight: 'calc(100vh - 40px)' }}>
                        <PopupForm
                            popup={editingPopup}
                            websites={websites}
                            marketingForms={marketingForms}
                            onClose={() => setShowForm(false)}
                            onSuccess={() => {
                                setShowForm(false);
                                loadPopups();
                                showToast(editingPopup?.id ? 'Popup updated successfully' : 'Popup created successfully');
                            }}
                            mode={mode}
                        />
                    </div>
                )}
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .template-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
                    border: 1px solid var(--bs-primary) !important;
                }
                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 54px;
                    height: 54px;
                }
            `}</style>
        </MainLayout>
    );
}
