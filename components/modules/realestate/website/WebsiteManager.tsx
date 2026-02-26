'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { cmsService, getAuthToken, websiteService, marketingService, propertyService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import WebsiteForm from '@/components/modules/realestate/website/WebsiteForm';
import WebsiteCard from '@/components/modules/realestate/website/WebsiteCard';
import WebsiteQRCodeGenerator from '@/components/modules/realestate/website/WebsiteQRCodeGenerator';
import Toast from '@/components/common/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
            ogImage: ''
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
            enable3D: true,
            enableTour: true,
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
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();
    const [showForm, setShowForm] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<any>(null);
    const [qrWebsite, setQrWebsite] = useState<any>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const token = typeof window !== 'undefined' ? getAuthToken() || '' : '';
    const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;

    const { data: websitesRes, isLoading: loading } = useQuery({
        queryKey: ['websites', tenantId, activeOwnerId],
        queryFn: () => websiteService.getWebsites(token, {
            ...(tenantId && { tenantId }),
            ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
        }),
        enabled: isAuthenticated && !!token,
    });

    const { data: propertiesRes } = useQuery({
        queryKey: ['properties-list', tenantId, activeOwnerId],
        queryFn: () => propertyService.getProperties(token, {
            ...(tenantId && { tenantId }),
            ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
        }),
        enabled: isAuthenticated && !!token,
    });

    const { data: marketingFormsRes } = useQuery({
        queryKey: ['marketing-forms', tenantId],
        queryFn: () => marketingService.getForms(token, { tenantId }),
        enabled: isAuthenticated && !!token,
    });

    const { data: cmsPagesRes } = useQuery({
        queryKey: ['cms-pages', tenantId],
        queryFn: () => cmsService.getPages(token, tenantId),
        enabled: isAuthenticated && !!token,
    });

    const websites = websitesRes?.data || [];
    const properties = useMemo(() => propertiesRes?.data?.properties || propertiesRes?.data || [], [propertiesRes]);
    const marketingForms = marketingFormsRes?.data || [];
    const cmsPages = useMemo(() => {
        if (!cmsPagesRes?.success) return [];
        return Array.isArray(cmsPagesRes.data) ? cmsPagesRes.data : (cmsPagesRes.data?.media || cmsPagesRes.data?.pages || []);
    }, [cmsPagesRes]);

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            const currentTenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const finalData = {
                ...data,
                tenantId: currentTenantId,
                slug: data.slug || `site-${Math.random().toString(36).substr(2, 9)}`,
                configuration: {
                    ...data.configuration,
                    settings: {
                        ...data.configuration.settings,
                        propertyId: data.propertyId,
                        propertyIds: data.propertyIds,
                        layout: data.configuration?.settings?.layout || 'builder'
                    }
                }
            };
            if (editingWebsite) return websiteService.updateWebsite(token, editingWebsite.id, finalData, currentTenantId);
            return websiteService.createWebsite(token, finalData);
        },
        onSuccess: (res) => {
            if (res.success) {
                if (!editingWebsite) {
                    setShowForm(false);
                    setEditingWebsite(null);
                    setFormData(INITIAL_FORM_DATA);
                }
                queryClient.invalidateQueries({ queryKey: ['websites'] });
                showToast(editingWebsite ? 'Website updated successfully' : 'Website created successfully');
            } else {
                showToast(res.message || 'Failed to save website', 'error');
            }
        },
        onError: (error) => {
            console.error('Failed to save website:', error);
            showToast('Error saving website. Make sure Slug is unique.', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const currentTenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            return websiteService.deleteWebsite(token, id, currentTenantId);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['websites'] });
                showToast('Website deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete website', 'error');
            }
        },
        onError: (error) => {
            console.error('Failed to delete website:', error);
            showToast('Failed to delete website', 'error');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this website?')) return;
        deleteMutation.mutate(id);
    };

    const handleEdit = (website: any) => {
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

    const handleGenerateQR = (website: any) => {
        setQrWebsite(website);
    };

    return (
        <MainLayout activePage="websites">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Website Management</h1>
                        <p className="text-muted small">Create and manage standalone landing pages with custom domain support.</p>
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
                    ) : websites.map((website: any) => (
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
