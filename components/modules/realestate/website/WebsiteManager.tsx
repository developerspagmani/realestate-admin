'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { cmsService, getAuthToken, websiteService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { Website, CMSPage, MarketingForm, Property } from '@/types';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import WebsiteForm from '@/components/modules/realestate/website/WebsiteForm';
import WebsiteCard from '@/components/modules/realestate/website/WebsiteCard';
import WebsiteQRCodeGenerator from '@/components/modules/realestate/website/WebsiteQRCodeGenerator';
import Toast from '@/components/common/Toast';
import { cacheManager, CacheTags } from '@/app/services/cacheManager';

interface WebsiteManagerProps {
    mode?: 'admin' | 'owner';
}

const INITIAL_FORM_DATA = {
    name: '',
    slug: '',
    customDomain: '',
    propertyId: '', // Keep for backward compatibility if needed, but we'll use propertyIds
    propertyIds: [] as string[],
    configuration: {
        theme: {
            primaryColor: '#6366f1',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif'
        },
        seo: {
            title: '',
            description: '',
            keywords: '',
            ogImage: '',
            headerSnippet: '',
            footerSnippet: ''
        },
        settings: {
            propertyId: '',
            propertyIds: [] as string[],
            layout: 'builder' // builder | listing
        },
        chatbot: {
            enabled: false
        },
        builder: {
            logoUrl: '',
            heroTitle: '',
            heroSubtitle: '',
            footerText: '',
            heroBgUrl: '',
            heroTextColor: '#ffffff',
            pageTitle: '',
            showHero: true,
            showFooter: true,
            showLogo: true,
            showListing: true,
            showInquiry: true,
            gridStrategy: 'grid', // grid | list | masonry
            columns: 3,
            showPrice: true,
            showStatus: true,
            enableBooking: true,
            detailViewType: 'tabs', // tabs | scrolling
            modules: [] // [{ id, type, data: { ... } }]
        },
        footer: {
            copyright: `© ${new Date().getFullYear()} Real Estate Portal`,
            footerText: '',
            backgroundColor: '#f8f9fa',
            textColor: '#212529',
            socials: {
                facebook: '',
                instagram: '',
                twitter: '',
                linkedin: '',
                youtube: ''
            }
        },
        inquiryForm: {
            enabled: false,
            useMarketingForm: false,
            marketingFormId: '',
            title: 'Inquiry Form',
            description: 'Please fill out the form below to get in touch with us.',
            fields: [
                { id: 'f1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
                { id: 'f2', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
                { id: 'f3', type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true }
            ]
        },
        bookingForm: {
            enabled: false,
            useMarketingForm: false,
            marketingFormId: ''
        },
        menus: {
            header: [],
            footer: []
        }
    }
};

export default function WebsiteManager({ mode = 'admin' }: WebsiteManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
    const [qrWebsite, setQrWebsite] = useState<Website | null>(null);
    const [formData, setFormData] = useState<Partial<Website>>(INITIAL_FORM_DATA);
    const [properties, setProperties] = useState<Property[]>([]);
    const [marketingForms, setMarketingForms] = useState<MarketingForm[]>([]);
    const [cmsPages, setCmsPages] = useState<CMSPage[]>([]);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [showHowItWorks, setShowHowItWorks] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('website_mgmt_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('website_mgmt_hideGuide', (!show).toString());
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadWebsites();
            loadProperties();
            loadMarketingForms();
            loadCMSPages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, activeTenantId, activeOwnerId]);

    const loadCMSPages = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await cmsService.getPages(token, tenantId);
            if (response.success) {
                // Ensure array even if backend response format differs
                const pages = Array.isArray(response.data) ? response.data : (response.data?.media || response.data?.pages || []);
                setCmsPages(pages);
            }
        } catch (error) {
            console.error('Failed to load CMS pages:', error);
        }
    };

    const loadMarketingForms = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const { marketingService } = await import('@/app/services/api');
            const tenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await marketingService.getForms(token, { tenantId });
            if (response.success) {
                setMarketingForms(response.data);
            }
        } catch (error) {
            console.error('Failed to load marketing forms:', error);
        }
    };

    const loadProperties = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const { propertyService } = await import('@/app/services/api');
            const tenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await propertyService.getProperties(token, {
                ...(tenantId && { tenantId }),
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (response.success) {
                const rawProps = response.data?.properties || response.data || [];
                setProperties(rawProps);
            }
        } catch (error) {
            console.error('Failed to load properties:', error);
        }
    };

    const loadWebsites = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await websiteService.getWebsites(token, {
                ...(tenantId && { tenantId }),
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (response.success) {
                setWebsites(response.data);
            }
        } catch (error) {
            console.error('Failed to load websites:', error);
            showToast('Failed to load websites', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            if (!token) return;

            let response;
            const currentTenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;

            const finalData = {
                ...formData,
                tenantId: currentTenantId,
                slug: formData.slug || `site-${Math.random().toString(36).substr(2, 9)}`,
                configuration: {
                    ...formData.configuration,
                    settings: {
                        ...formData.configuration.settings,
                        propertyId: formData.propertyId,
                        propertyIds: formData.propertyIds,
                        layout: formData.configuration?.settings?.layout || 'builder'
                    }
                }
            };

            if (editingWebsite) {
                response = await websiteService.updateWebsite(token, editingWebsite.id, finalData, currentTenantId);
            } else {
                response = await websiteService.createWebsite(token, finalData);
            }

            if (response.success) {
                if (!editingWebsite) {
                    setShowForm(false);
                    setEditingWebsite(null);
                    setFormData(INITIAL_FORM_DATA);
                } else {
                    // Update editingWebsite state with the new data from finalData if needed
                    // or just leave it as is if websiteService doesn't return the full updated object
                    // The list refresh will handle the main state
                }
                loadWebsites();
                showToast(editingWebsite ? 'Website updated successfully' : 'Website created successfully');

                // Automate revalidation
                if (finalData.slug) {
                    cacheManager.invalidate([CacheTags.WEBSITES, `website-${finalData.slug}`]);
                }
            } else {
                showToast(response.message || 'Failed to save website', 'error');
            }
        } catch (error) {
            console.error('Failed to save website:', error);
            showToast('Error saving website. Make sure Slug is unique.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this website?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const currentTenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await websiteService.deleteWebsite(token, id, currentTenantId);
            if (response.success) {
                loadWebsites();
                showToast('Website deleted successfully');
                // Invalidate cache
                cacheManager.invalidate(CacheTags.WEBSITES);
            } else {
                showToast(response.message || 'Failed to delete website', 'error');
            }
        } catch (error) {
            console.error('Failed to delete website:', error);
            showToast('Failed to delete website', 'error');
        }
    };

    const handleEdit = (website: Website) => {
        setEditingWebsite(website);
        setFormData({
            name: website.name,
            slug: website.slug,
            customDomain: website.customDomain || '',
            propertyId: website.propertyId || '',
            propertyIds: website.propertyIds || (website.propertyId ? [website.propertyId] : []),
            configuration: {
                ...website.configuration,
                settings: website.configuration?.settings || { layout: 'builder', propertyId: website.propertyId, propertyIds: website.propertyIds }
            }
        });
        setShowForm(true);
    };

    const handleGenerateQR = (website: Website) => {
        setQrWebsite(website);
    };

    return (
        <MainLayout activePage="websites">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h1 className="fw-bold h2 mb-1 text-dark">Website Management</h1>
                            <p className="text-muted small mb-0">Create and manage standalone landing pages with custom domain support.</p>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                    <button
                        className="btn btn-primary shadow-sm px-4 rounded-4"
                        onClick={() => {
                            setEditingWebsite(null);
                            setFormData(INITIAL_FORM_DATA);
                            setShowForm(true);
                        }}
                    >
                        <i className="bi bi-window-plus me-2"></i>
                        New Website
                    </button>
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
                                    <h3 className="fw-bold mb-3 text-white">Your Property, Brand-Named</h3>
                                    <p className="opacity-75 mb-4">The Website Hub allows you to launch high-converting landing pages in seconds. Here is your builder toolkit:</p>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-lightning text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">1. Instant Builder</div>
                                                    <div className="small opacity-75">Switch between "Listing Layout" for property details or "Builder" for a custom branded experience.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-link-45deg text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">2. Custom Domains</div>
                                                    <div className="small opacity-75">Connect your own .com or .in domain to any landing page to build authority and trust.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-phone text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">3. Mobile-First Edge</div>
                                                    <div className="small opacity-75">Every site is automatically optimized for mobile buyers browsing on the move.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-graph-up text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">4. SEO & Pixels</div>
                                                    <div className="small opacity-75">Add custom headers/footers for Meta Pixels, Google Analytics, and SEO title tags.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 d-none d-lg-block text-center">
                                    <i className="bi bi-globe-central-south-asia display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showForm && (
                    <WebsiteForm
                        formData={formData}
                        setFormData={setFormData}
                        handleSubmit={handleSubmit}
                        setShowForm={setShowForm}
                        editingWebsite={editingWebsite}
                        tenantType={tenantType}
                        properties={properties}
                        marketingForms={marketingForms}
                        cmsPages={cmsPages}
                    />
                )}

                {/* QR Code Generator Modal */}
                {qrWebsite && (
                    <WebsiteQRCodeGenerator
                        website={qrWebsite}
                        onClose={() => setQrWebsite(null)}
                    />
                )}

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 py-5">
                            <Loader message="Loading website configuration..." />
                        </div>
                    ) : websites.length === 0 ? (
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                <i className="bi bi-globe display-1 text-muted opacity-25"></i>
                                <h4 className="mt-3 fw-bold text-muted">No Websites Found</h4>
                                <p className="text-muted">Create your first landing page to showcase your properties.</p>
                            </div>
                        </div>
                    ) : websites.map((website) => (
                        <WebsiteCard
                            key={website.id}
                            website={website}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onGenerateQR={handleGenerateQR}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                .pulse {
                    animation: pulse-animation 2s infinite;
                }
                @keyframes pulse-animation {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
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
