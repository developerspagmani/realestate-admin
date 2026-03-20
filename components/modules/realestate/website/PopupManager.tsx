'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { popupService, getAuthToken, websiteService, marketingService, widgetService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { WebsitePopup, Website, MarketingForm, Widget } from '@/types';
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
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [marketingForms, setMarketingForms] = useState<MarketingForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPopup, setEditingPopup] = useState<WebsitePopup | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'audience'>('list');
    const [activePopup, setActivePopup] = useState<WebsitePopup | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loadingAudience, setLoadingAudience] = useState(false);

    // Pagination and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadPopups();
            loadWebsites();
            loadWidgets();
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

    const loadWidgets = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await widgetService.getWidgets(token, {
                ...(tenantId && { tenantId }),
            });
            if (response.success) {
                setWidgets(response.data);
            }
        } catch (error) {
            console.error('Failed to load widgets:', error);
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
        setViewMode('form');
        setShowForm(true);
    };

    const handleViewAudience = async (popup: WebsitePopup) => {
        setActivePopup(popup);
        setViewMode('audience');
        setShowForm(false);
        loadSubmissions(popup.id);
    };

    const loadSubmissions = async (popupId: string) => {
        try {
            setLoadingAudience(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const response = await popupService.getSubmissions(token, popupId, tenantId);
            if (response.success) {
                // Robust extraction: data might be flattened or in a named property like interactions
                const data = response.data?.submissions || response.data?.interactions || (Array.isArray(response.data) ? response.data : (response.data?.list || response.submissions || []));
                setSubmissions(Array.isArray(data) ? data : []);
                setMetrics(response.metrics || response.data?.metrics);
                setCurrentPage(1); // Reset to page 1 on new load
            }
        } catch (error) {
            console.error('Failed to load submissions:', error);
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoadingAudience(false);
        }
    };

    // Derived filtered and paginated submissions
    const filteredSubmissions = submissions.filter((sub: any) => {
        const query = searchTerm.toLowerCase();
        const nameMatch = (sub.lead?.name || 'Anonymous').toLowerCase().includes(query);
        const emailMatch = (sub.lead?.email || '').toLowerCase().includes(query);
        const phoneMatch = (sub.lead?.phone || '').toLowerCase().includes(query);
        return nameMatch || emailMatch || phoneMatch;
    });

    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const paginatedSubmissions = filteredSubmissions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
        setViewMode('form');
        setShowForm(true);
    };

    return (
        <MainLayout activePage="popups" hideHeader={showForm}>
            <div className="container-fluid py-4 h-100 position-relative">
                {showForm ? (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: 100, minHeight: 'calc(100vh - 40px)' }}>
                        <PopupForm
                            popup={editingPopup}
                            websites={websites}
                            widgets={widgets}
                            marketingForms={marketingForms}
                            onClose={() => {
                                setShowForm(false);
                                setViewMode('list');
                            }}
                            onSuccess={() => {
                                setShowForm(false);
                                setViewMode('list');
                                loadPopups();
                                showToast(editingPopup?.id ? 'Popup updated successfully' : 'Popup created successfully');
                            }}
                            mode={mode}
                        />
                    </div>
                ) : viewMode === 'audience' && activePopup ? (
                    <div className="animate-fade-in">
                        <div className="d-flex align-items-center mb-4">
                            <button className="btn btn-light rounded-circle p-2 me-3 shadow-sm border" onClick={() => setViewMode('list')}>
                                <i className="bi bi-arrow-left px-1"></i>
                            </button>
                            <div>
                                <h2 className="fw-bold mb-0">Audience: {activePopup.name}</h2>
                                <p className="text-muted small mb-0">Tracking all conversions and leads captured via this popup.</p>
                            </div>
                        </div>

                        {metrics && (
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100">
                                        <div className="text-muted small fw-bold text-uppercase mb-2">Total Views</div>
                                        <div className="h1 fw-bold mb-0 text-primary">{metrics.views}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100">
                                        <div className="text-muted small fw-bold text-uppercase mb-2">Submissions</div>
                                        <div className="h1 fw-bold mb-0 text-success">{metrics.submissions}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100">
                                        <div className="text-muted small fw-bold text-uppercase mb-2">Conv. Rate</div>
                                        <div className="h1 fw-bold mb-0 text-warning">{metrics.conversionRate}%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
                            <div className="card-header bg-white border-0 p-4">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                    <h5 className="fw-bold mb-0">Conversion Log</h5>
                                    <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 w-100" style={{ maxWidth: '350px' }}>
                                        <i className="bi bi-search text-muted me-2"></i>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                                            placeholder="Search by name, email or phone..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light bg-opacity-50">
                                        <tr>
                                            <th className="px-4 py-3 border-0 small text-muted text-uppercase fw-bold">Lead Name</th>
                                            <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Contact Info</th>
                                            <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Status</th>
                                            <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Captured Date</th>
                                            <th className="py-3 border-0 text-end px-4 small text-muted text-uppercase fw-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingAudience ? (
                                            <tr>
                                                <td colSpan={5} className="py-5 text-center">
                                                    <Loader message="Fetching audience data..." />
                                                </td>
                                            </tr>
                                        ) : paginatedSubmissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-5 text-center text-muted">
                                                    <div className="py-4">
                                                        <i className="bi bi-people display-4 opacity-25 mb-3 d-block"></i>
                                                        <h6 className="fw-bold text-dark">No participants found</h6>
                                                        <p className="small mb-0 text-primary">{searchTerm ? 'Try adjusting your search query.' : 'No submissions captured yet.'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedSubmissions.map((sub: any) => (
                                                <tr key={sub.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40, minWidth: 40 }}>
                                                                {(sub.lead?.name || 'A')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold">{sub.lead?.name || 'Anonymous'}</div>
                                                                <small className="text-muted opacity-75">
                                                                    {sub.lead?.source === 5 || sub.lead?.source === 'website' || sub.lead?.source === 'website_popup' ? 'Website Visitor' : 
                                                                     (sub.lead?.source === 7 || sub.lead?.source === 'website_chatbot' ? 'Chatbot Lead' : 'Direct Lead')}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex flex-column">
                                                            <span className="small">{sub.lead?.email || <span className="text-muted small">No Email</span>}</span>
                                                            <span className="extra-small text-muted">{sub.lead?.phone || ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`badge rounded-pill pt-1.5 pb-1.5 px-3 ${sub.lead?.status === 1 ? 'bg-success-soft text-success' : 'bg-light text-muted'}`}>
                                                            {sub.lead?.status === 1 ? 'Active' : 'Unconfirmed'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="fw-bold">
                                                            {sub.occurredAt ? new Date(sub.occurredAt).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        {sub.occurredAt && (
                                                            <small className="text-muted opacity-75">{new Date(sub.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-end px-4">
                                                        <a href={`/leads/${sub.lead?.id}`} className="btn btn-sm btn-white border rounded-pill px-3 shadow-sm hvr-grow" target="_blank" rel="noopener noreferrer">
                                                            Details <i className="bi bi-box-arrow-up-right ms-1"></i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            {!loadingAudience && filteredSubmissions.length > 0 && (
                                <div className="card-footer bg-white border-top p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                    <div className="text-muted small">
                                        Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredSubmissions.length)}</strong> of <strong>{filteredSubmissions.length}</strong> results
                                    </div>
                                    <nav>
                                        <ul className="pagination pagination-sm mb-0 gap-1 border-0">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link border-0 rounded-circle shadow-sm" onClick={() => setCurrentPage(currentPage - 1)}>
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                            </li>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                                                // Show only limited page numbers for cleaner UI
                                                if (totalPages > 5 && (p < currentPage - 1 || p > currentPage + 1) && p !== 1 && p !== totalPages) {
                                                    if (p === 2 || p === totalPages - 1) return <li key={p} className="page-item disabled"><span className="page-link border-0">...</span></li>;
                                                    return null;
                                                }
                                                return (
                                                    <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                                                        <button className={`page-link border-0 rounded-circle shadow-sm px-3 ${currentPage === p ? 'bg-primary' : 'bg-white'}`} onClick={() => setCurrentPage(p)}>
                                                            {p}
                                                        </button>
                                                    </li>
                                                );
                                            })}

                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link border-0 rounded-circle shadow-sm" onClick={() => setCurrentPage(currentPage + 1)}>
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
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
                                    setViewMode('form');
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
                                                onClick={() => {
                                                    setViewMode('form');
                                                    setShowForm(true);
                                                }}
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
                                        onViewSubmissions={handleViewAudience}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
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
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
            `}</style>
        </MainLayout>
    );
}
