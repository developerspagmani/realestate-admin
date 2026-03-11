'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { cmsService, getAuthToken, widgetService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { Widget, Property, MarketingForm } from '@/types';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import WidgetForm from './WidgetForm';
import WidgetCard from './WidgetCard';
import QRCodeGenerator from './QRCodeGenerator';
import Toast from '@/components/common/Toast';

interface WidgetManagerProps {
    mode?: 'admin' | 'owner';
}

const INITIAL_FORM_DATA = {
    name: '',
    type: 'listing',
    uniqueId: '',
    propertyId: '',
    configuration: {
        theme: {
            primaryColor: '#6366f1',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif'
        },
        display: {
            layout: 'grid',
            columns: 1,
            showPrice: true,
            showBookingButton: true
        },
        settings: {
            startView: 'listing',
            propertyId: '',
            layout: 'grid'
        },
        chatbot: {
            enabled: false
        },
        workspace3D: {
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
            showSearch: true
        },
        inquiryForm: {
            enabled: false,
            useMarketingForm: false,
            marketingFormId: '',
            title: 'Inquiry Form',
            description: 'Please fill out the form below to get in touch with us.',
            fields: [
                { id: 'inq_f1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
                { id: 'inq_f2', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
                { id: 'inq_f3', type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true }
            ]
        },
        bookingForm: {
            enabled: false,
            useMarketingForm: false,
            marketingFormId: '',
            title: 'Book This Selection',
            description: 'Provide your details to initiate the booking process.',
            fields: [
                { id: 'bk_f1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
                { id: 'bk_f2', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
                { id: 'bk_f3', type: 'phone', label: 'Phone Number', placeholder: 'For booking confirmation', required: true }
            ]
        }
    }
};

export default function WidgetManager({ mode = 'admin' }: WidgetManagerProps) {
    const { user, isAuthenticated, hasModule, activeModules } = useAuthContext();
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [properties, setProperties] = useState<Property[]>([]);
    const [marketingForms, setMarketingForms] = useState<MarketingForm[]>([]);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrWidget, setQRWidget] = useState<Widget | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('widget_mgmt_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('widget_mgmt_hideGuide', (!show).toString());
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadWidgets();
            loadProperties();
            if (hasModule('marketing_hub')) {
                loadMarketingForms();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, activeTenantId, activeOwnerId, activeModules]);

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

    const loadWidgets = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await widgetService.getWidgets(token, {
                ...(tenantId && { tenantId }),
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (response.success) {
                setWidgets(response.data);
            }
        } catch (error) {
            console.error('Failed to load widgets:', error);
            showToast('Failed to load widgets', 'error');
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
                uniqueId: formData.uniqueId || (editingWidget ? editingWidget.uniqueId : `wid-${Math.random().toString(36).substr(2, 9)}`),
                configuration: {
                    ...formData.configuration,
                    settings: {
                        ...formData.configuration.settings,
                        propertyId: formData.propertyId
                    }
                }
            };

            if (editingWidget) {
                response = await widgetService.updateWidget(token, editingWidget.id, finalData, currentTenantId);
            } else {
                response = await widgetService.createWidget(token, finalData);
            }

            if (response.success) {
                // If it was a create operation, transition to edit mode so we stay on the page
                if (!editingWidget && response.data) {
                    setEditingWidget(response.data);
                }
                loadWidgets();
                showToast(editingWidget ? 'Widget changes synchronized' : 'Widget published successfully');
            } else {
                showToast(response.message || 'Failed to save widget', 'error');
            }
        } catch (error) {
            console.error('Failed to save widget:', error);
            showToast('Error saving widget. Make sure Unique ID is unique.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const currentTenantId = mode === 'admin' ? (activeTenantId || (user as { tenantId: string })?.tenantId) : (user as { tenantId: string })?.tenantId;
            const response = await widgetService.deleteWidget(token, id, currentTenantId);
            if (response.success) {
                loadWidgets();
                showToast('Widget deleted successfully');
            } else {
                showToast(response.message || 'Failed to delete widget', 'error');
            }
        } catch (error) {
            console.error('Failed to delete widget:', error);
            showToast('Failed to delete widget', 'error');
        }
    };

    const copyEmbedCode = (uniqueId: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const loaderUrl = `${baseUrl}/widgets/loader.js`;
        const code = `<!-- CoWorking Hub Widget -->\n<div id="cw-booking-portal" data-widget="${uniqueId}"></div>\n<script src="${loaderUrl}" async></script>`;

        navigator.clipboard.writeText(code);
        showToast('Universal JS Embed Code copied to clipboard!');
    };

    const copyShortLink = (uniqueId: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const shortUrl = `${baseUrl}/go/${uniqueId}`;
        navigator.clipboard.writeText(shortUrl);
        showToast('Short Link copied to clipboard!');
    };

    const handleEdit = (widget: Widget) => {
        setEditingWidget(widget);
        setFormData({
            name: widget.name,
            type: widget.type,
            uniqueId: widget.uniqueId,
            propertyId: widget.propertyId || '',
            configuration: {
                ...widget.configuration,
                settings: widget.configuration.settings || { startView: 'listing', propertyId: widget.propertyId }
            }
        });
        setShowForm(true);
    };

    return (
        <MainLayout activePage="widgets">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h1 className="fw-bold h2 mb-1">Widget Management</h1>
                            <p className="text-muted small mb-0">Create and manage embeddable booking widgets for your websites.</p>
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
                            setEditingWidget(null);
                            setFormData(INITIAL_FORM_DATA);
                            setShowForm(true);
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Widget
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
                                    <h3 className="fw-bold mb-3 text-white">Capture Leads Everywhere</h3>
                                    <p className="opacity-75 mb-4">Virpanix Widgets turn any external website into a lead machine. Here is how to use them:</p>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-code-square text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">1. Universal Embed</div>
                                                    <div className="small opacity-75">Copy a single <code>&lt;script&gt;</code> tag to place your property listings on WordPress, Wix, or custom sites.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-filter-square text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">2. Specific Property Sync</div>
                                                    <div className="small opacity-75">Bind a widget to a single property or project to show specific availability and pricing.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-calendar-check text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">3. Shared Forms</div>
                                                    <div className="small opacity-75">Connect your Marketing Hub forms to capture custom data directly into your CRM.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-palette text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">4. Live Styling</div>
                                                    <div className="small opacity-75">Customize colors and fonts to match the host website without changing a single line of code.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 d-none d-lg-block text-center">
                                    <i className="bi bi-code-slash display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showForm && (
                    <WidgetForm
                        formData={formData}
                        setFormData={setFormData}
                        handleSubmit={handleSubmit}
                        setShowForm={setShowForm}
                        editingWidget={editingWidget}
                        tenantType={tenantType}
                        properties={properties}
                        marketingForms={marketingForms}
                    />
                )}

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 py-5">
                            <Loader message="Loading widget configuration..." />
                        </div>
                    ) : widgets.length === 0 ? (
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                <i className="bi bi-code-slash display-1 text-muted opacity-25"></i>
                                <h4 className="mt-3 fw-bold text-muted">No Widgets Found</h4>
                                <p className="text-muted">Create your first widget and start accepting bookings on any website.</p>
                            </div>
                        </div>
                    ) : widgets.map((widget) => (
                        <WidgetCard
                            key={widget.id}
                            widget={widget}
                            tenantType={tenantType}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onCopyEmbed={copyEmbedCode}
                            onCopyShortLink={copyShortLink}
                            onShowQR={(w) => {
                                setQRWidget(w);
                                setShowQRModal(true);
                            }}
                        />
                    ))}
                </div>
            </div>

            {showQRModal && qrWidget && (
                <QRCodeGenerator
                    widget={qrWidget}
                    onClose={() => setShowQRModal(false)}
                />
            )}
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
