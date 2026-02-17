'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { useAuthContext } from '@/app/contexts/AuthContext';
import FormBuilder from './FormBuilder';
import WidgetPreview from './WidgetPreview';
import MediaSelector from '@/components/shared/MediaSelector';

interface WidgetFormProps {
    formData: any;
    setFormData: (data: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
    setShowForm: (show: boolean) => void;
    editingWidget: any;
    tenantType: number;
    properties: any[];
    marketingForms: any[];
}

export default function WidgetForm({
    formData,
    setFormData,
    handleSubmit,
    setShowForm,
    editingWidget,
    tenantType,
    properties,
    marketingForms
}: WidgetFormProps) {
    const router = useRouter();
    const { activeTenant } = useManagementContext();
    const { hasModule } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'basics' | 'style' | 'builder' | 'modules'>('basics');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'logoUrl' | 'heroBgUrl' | null>(null);

    const hasPlanFeature = (featureName: string) => {
        const features = activeTenant?.plan?.features || {};
        return features[featureName] === true || features[featureName] === 'true' || !!features[featureName];
    };

    const handleMediaSelect = (media: any) => {
        if (media && mediaTarget) {
            toggleNestedConfig('builder', mediaTarget, media.url);
        }
        setShowMediaSelector(false);
        setMediaTarget(null);
    };

    const toggleNestedConfig = (parent: string, child: string, value: any) => {
        setFormData({
            ...formData,
            configuration: {
                ...formData.configuration,
                [parent]: {
                    ...formData.configuration[parent],
                    [child]: value
                }
            }
        });
    };

    const tabs = [
        { id: 'basics', label: 'General Info', icon: 'bi-gear-fill' },
        { id: 'style', label: 'Appearance', icon: 'bi-palette-fill' },
        { id: 'modules', label: 'Engagement', icon: 'bi-chat-dots-fill' },
    ];

    return (
        <div className="card border-0 shadow-lg rounded-4 mb-5 animate-fade-in overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="fw-bold mb-1 text-primary">
                        {editingWidget ? 'Edit Widget Instance' : 'Project: New Widget'}
                    </h4>
                    <p className="text-muted extra-small mb-0">Configure your embeddable portal settings below.</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
            </div>

            <div className="card-body p-0">
                <div className="row g-0">
                    {/* Left side: Form */}
                    <div className="col-lg-7 border-end">
                        <div className="widget-form-nav bg-light-subtle p-3 border-bottom d-flex gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`btn btn-sm px-3 rounded-4 d-flex align-items-center gap-2 transition-all ${activeTab === tab.id ? 'btn-primary shadow-sm shadow-primary' : 'btn-link text-muted text-decoration-none'}`}
                                    onClick={() => setActiveTab(tab.id as any)}
                                >
                                    <i className={`bi ${tab.icon}`}></i>
                                    <span className="fw-bold">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="tab-content min-vh-50">
                                {/* TAB 1: Basics */}
                                {activeTab === 'basics' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Identity & Context</h6>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Internal Widget Name</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3 border-light-subtle shadow-sm"
                                                placeholder="e.g. Website Home Sidebar"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Unique ID / Slug</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3 border-light-subtle shadow-sm"
                                                placeholder="e.g. homepage-widget"
                                                value={formData.uniqueId}
                                                onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                                            />
                                            <div className="extra-small text-muted mt-1 px-1">Used in hosted URLs as /go/[slug]</div>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-primary">Target Selection</label>
                                            <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4">
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="extra-small fw-bold text-muted">Primary Domain/Workspace</label>
                                                        <select
                                                            className="form-select rounded-3 border-0 shadow-sm"
                                                            value={formData.propertyId}
                                                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                                            required
                                                        >
                                                            <option value="">Choose {tenantType === 1 ? 'Property' : 'Workspace'}...</option>
                                                            {properties.map(p => (
                                                                <option key={p.id} value={p.id}>{p.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="extra-small fw-bold text-muted">Initial Routing Mode</label>
                                                        <select
                                                            className="form-select rounded-3 border-0 shadow-sm"
                                                            value={formData.configuration.settings?.startView || 'listing'}
                                                            onChange={(e) => toggleNestedConfig('settings', 'startView', e.target.value)}
                                                        >
                                                            <option value="listing">{tenantType === 1 ? 'Portfolio Grid (Multi)' : 'Workspace Grid'}</option>
                                                            <option value="property">{tenantType === 1 ? 'Focus View (Single)' : 'Workspace Detail'}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: Style */}
                                {activeTab === 'style' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Branding & Layout</h6>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold">Primary Brand Color</label>
                                            <div className="d-flex gap-2 align-items-center p-2 border rounded-3 bg-white">
                                                <input
                                                    type="color"
                                                    className="form-control-color border-0 bg-transparent cursor-pointer"
                                                    value={formData.configuration.theme.primaryColor}
                                                    onChange={(e) => toggleNestedConfig('theme', 'primaryColor', e.target.value)}
                                                />
                                                <span className="small font-monospace text-uppercase text-muted">{formData.configuration.theme.primaryColor}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold">Typography</label>
                                            <select
                                                className="form-select rounded-3 shadow-sm border-light-subtle"
                                                value={formData.configuration.theme.fontFamily}
                                                onChange={(e) => toggleNestedConfig('theme', 'fontFamily', e.target.value)}
                                            >
                                                <option value="Inter, sans-serif">Inter (Modern)</option>
                                                <option value="'Roboto', sans-serif">Roboto (Clean)</option>
                                                <option value="'Poppins', sans-serif">Poppins (Playful)</option>
                                                <option value="'Montserrat', sans-serif">Montserrat (Bold)</option>
                                                <option value="'Playfair Display', serif">Playfair (Elegant)</option>
                                                <option value="system-ui, sans-serif">System Default</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold">Grid Strategy</label>
                                            <select
                                                className="form-select rounded-3 shadow-sm border-light-subtle"
                                                value={formData.configuration.display.columns || 1}
                                                onChange={(e) => toggleNestedConfig('display', 'columns', parseInt(e.target.value))}
                                            >
                                                <option value={1}>List View (1 Col)</option>
                                                <option value={2}>Split View (2 Cols)</option>
                                                <option value={3}>Classic Grid (3 Cols)</option>
                                            </select>
                                        </div>

                                    </div>
                                )}

                                {/* TAB 4: Modules & Enrichment */}
                                {activeTab === 'modules' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Smart Engagement Modules</h6>
                                        </div>

                                        <div className="col-md-12">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <div className={`card border-0 shadow-sm rounded-4 px-5 py-3 bg-white h-100 ${!hasModule('discovery') ? 'opacity-75 grayscale' : ''}`}>
                                                        <div className="form-check form-switch p-1 mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="chatbotEnabled"
                                                                checked={formData.configuration.chatbot?.enabled || false}
                                                                onChange={(e) => toggleNestedConfig('chatbot', 'enabled', e.target.checked)}
                                                                disabled={!hasModule('discovery')}
                                                            />
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="form-check-label small fw-bold" htmlFor="chatbotEnabled">AI Discovery Assistant</label>
                                                                {!hasModule('discovery') && (
                                                                    <span className="badge bg-warning-subtle text-warning extra-small border border-warning-subtle">PRO</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="extra-small text-muted mb-0">Enables a floating chatbot to help visitors find matching properties automatically.</p>
                                                        {!hasModule('discovery') && (
                                                            <div className="extra-small text-danger mt-2 fw-bold">Upgrade your plan to unlock AI features.</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className={`card border-0 shadow-sm rounded-4 px-5 py-3 bg-white h-100 ${!hasModule('3d_viewer') ? 'opacity-75 grayscale' : ''}`}>
                                                        <div className="form-check form-switch p-1 mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="workspace3DEnabled"
                                                                checked={formData.configuration.workspace3D?.enabled || false}
                                                                onChange={(e) => toggleNestedConfig('workspace3D', 'enabled', e.target.checked)}
                                                                disabled={!hasModule('3d_viewer')}
                                                            />
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="form-check-label small fw-bold" htmlFor="workspace3DEnabled">Virtual 3D Touring</label>
                                                                {!hasModule('3d_viewer') && (
                                                                    <span className="badge bg-warning-subtle text-warning extra-small border border-warning-subtle">PRO</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="extra-small text-muted mb-0">Allows users to see the interactive 3D map for property floor plans.</p>
                                                        {!hasModule('3d_viewer') && (
                                                            <div className="extra-small text-danger mt-2 fw-bold">Upgrade your plan to unlock 3D touring.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Lead Acquisition System</h6>
                                            <div className="card bg-light border-0 rounded-4 p-4">
                                                <label className="form-label small fw-bold mb-3">Form Strategy Strategy</label>
                                                <div className="d-flex gap-3 mb-4">
                                                    <div
                                                        className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center ${!formData.configuration.inquiryForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'}`}
                                                        onClick={() => toggleNestedConfig('inquiryForm', 'useMarketingForm', false)}
                                                    >
                                                        <i className="bi bi-tools d-block mb-1"></i>
                                                        <div className="fw-bold extra-small">Custom Form Builder</div>
                                                    </div>
                                                    <div
                                                        className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center position-relative ${formData.configuration.inquiryForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'} ${!hasModule('marketing_hub') ? 'opacity-50' : ''}`}
                                                        onClick={() => hasModule('marketing_hub') && toggleNestedConfig('inquiryForm', 'useMarketingForm', true)}
                                                    >
                                                        {!hasModule('marketing_hub') && (
                                                            <div className="position-absolute top-0 end-0 p-2">
                                                                <i className="bi bi-lock-fill text-warning"></i>
                                                            </div>
                                                        )}
                                                        <i className="bi bi-cloud-check d-block mb-1"></i>
                                                        <div className="fw-bold extra-small">Marketing Hub Sync</div>
                                                        {!hasModule('marketing_hub') && (
                                                            <div className="extra-small text-danger italic mt-1" style={{ fontSize: '9px' }}>UPGRADE REQUIRED</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {formData.configuration.inquiryForm?.useMarketingForm ? (
                                                    <div className="animate-fade-in">
                                                        {!hasModule('marketing_hub') ? (
                                                            <div className="p-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 text-center">
                                                                <i className="bi bi-gem display-6 text-warning mb-3 d-block"></i>
                                                                <h6 className="fw-bold">Premium Marketing Integration</h6>
                                                                <p className="extra-small text-muted mb-3">Syncing widget leads directly into Marketing Hub is a premium feature. Upgrade to our Professional or Business plan to unlock this.</p>
                                                                <button type="button" className="btn btn-warning btn-sm fw-bold px-4 rounded-3 shadow-sm" onClick={() => router.push('/realestate-owner-admin/subscriptions')}>
                                                                    View Upgrade Plans
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-2">Select Target Managed Form</label>
                                                                <select
                                                                    className="form-select border-0 shadow-sm py-2 rounded-3"
                                                                    value={formData.configuration.inquiryForm?.marketingFormId || ''}
                                                                    onChange={(e) => toggleNestedConfig('inquiryForm', 'marketingFormId', e.target.value)}
                                                                >
                                                                    <option value="">-- Choose a Marketing Form --</option>
                                                                    {marketingForms.map(f => (
                                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="p-3 bg-white mt-3 rounded-3 border border-info border-opacity-25 shadow-sm">
                                                                    <p className="extra-small text-info mb-0 d-flex align-items-center">
                                                                        <i className="bi bi-info-circle-fill me-2 fs-6"></i>
                                                                        Data collected will be automatically routed to the Marketing Campaigns and defined target audiences.
                                                                    </p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <FormBuilder
                                                        config={formData.configuration.inquiryForm || { enabled: false, title: '', description: '', fields: [] }}
                                                        onChange={(formConfig) => setFormData({
                                                            ...formData,
                                                            configuration: { ...formData.configuration, inquiryForm: formConfig }
                                                        })}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Booking & Reservation Module</h6>
                                            <div className="card bg-light border-0 rounded-4 p-4 border-start border-success border-4">
                                                <div className="form-check form-switch mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="bookingEnabled"
                                                        checked={formData.configuration.bookingForm?.enabled || false}
                                                        onChange={(e) => toggleNestedConfig('bookingForm', 'enabled', e.target.checked)}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="bookingEnabled">Enable "Book Now" Button</label>
                                                </div>

                                                {formData.configuration.bookingForm?.enabled && (
                                                    <div className="animate-fade-in">
                                                        <label className="form-label small fw-bold mb-3">Booking Strategy</label>
                                                        <div className="d-flex gap-3 mb-4">
                                                            <div
                                                                className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center ${!formData.configuration.bookingForm?.useMarketingForm ? 'border-success bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'}`}
                                                                onClick={() => toggleNestedConfig('bookingForm', 'useMarketingForm', false)}
                                                            >
                                                                <i className="bi bi-calendar-plus d-block mb-1"></i>
                                                                <div className="fw-bold extra-small">Booking Form Builder</div>
                                                            </div>
                                                            <div
                                                                className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center position-relative ${formData.configuration.bookingForm?.useMarketingForm ? 'border-success bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'} ${!hasModule('marketing_hub') ? 'opacity-50' : ''}`}
                                                                onClick={() => hasModule('marketing_hub') && toggleNestedConfig('bookingForm', 'useMarketingForm', true)}
                                                            >
                                                                {!hasModule('marketing_hub') && (
                                                                    <div className="position-absolute top-0 end-0 p-2">
                                                                        <i className="bi bi-lock-fill text-warning"></i>
                                                                    </div>
                                                                )}
                                                                <i className="bi bi-link-45deg d-block mb-1"></i>
                                                                <div className="fw-bold extra-small">Marketing Form Link</div>
                                                                {!hasModule('marketing_hub') && (
                                                                    <div className="extra-small text-danger italic mt-1" style={{ fontSize: '9px' }}>UPGRADE REQUIRED</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {formData.configuration.bookingForm?.useMarketingForm ? (
                                                            <div className="animate-fade-in">
                                                                {!hasModule('marketing_hub') ? (
                                                                    <div className="p-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 text-center">
                                                                        <i className="bi bi-gem display-6 text-warning mb-3 d-block"></i>
                                                                        <h6 className="fw-bold">Premium Marketing Integration</h6>
                                                                        <p className="extra-small text-muted mb-3">Connecting booking forms to the Marketing Hub is a premium feature. Upgrade to unlock advanced lead tracking.</p>
                                                                        <button type="button" className="btn btn-warning btn-sm fw-bold px-4 rounded-3 shadow-sm" onClick={() => router.push('/realestate-owner-admin/subscriptions')}>
                                                                            View Upgrade Plans
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <label className="form-label extra-small fw-bold text-muted text-uppercase mb-2">Select Booking Form</label>
                                                                        <select
                                                                            className="form-select border-0 shadow-sm py-2 rounded-3"
                                                                            value={formData.configuration.bookingForm?.marketingFormId || ''}
                                                                            onChange={(e) => toggleNestedConfig('bookingForm', 'marketingFormId', e.target.value)}
                                                                        >
                                                                            <option value="">-- Choose a Marketing Form --</option>
                                                                            {marketingForms.map(f => (
                                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <FormBuilder
                                                                config={formData.configuration.bookingForm || { enabled: false, title: '', description: '', fields: [] }}
                                                                onChange={(formConfig) => setFormData({
                                                                    ...formData,
                                                                    configuration: { ...formData.configuration, bookingForm: formConfig }
                                                                })}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-footer mt-5 border-top pt-4 text-end">
                                <button type="button" className="btn btn-outline-secondary me-2 rounded-4 px-4 fw-bold" onClick={() => setShowForm(false)}>Discard</button>
                                <button type="submit" className="btn btn-primary rounded-4 px-5 fw-bold shadow-lg hvr-grow">
                                    <i className="bi bi-check-lg me-2"></i>
                                    {editingWidget ? 'Finalize Changes' : 'Publish Widget'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right side: Preview */}
                    <div className="col-lg-5 bg-light-subtle p-4 d-none d-lg-block">
                        <WidgetPreview formData={formData} tenantType={tenantType} />
                    </div>
                </div>
            </div>

            <MediaSelector
                show={showMediaSelector}
                onClose={() => {
                    setShowMediaSelector(false);
                    setMediaTarget(null);
                }}
                onSelect={handleMediaSelect}
                title={`Select ${mediaTarget === 'logoUrl' ? 'Brand Logo' : 'Hero Cover'}`}
            />

            <style jsx>{`
                .extra-small { font-size: 0.72rem; }
                .shadow-primary { box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25) !important; }
                .border-dashed { border: 2px dashed rgba(0,0,0,0.1) !important; }
                .cursor-pointer { cursor: pointer; }
                .font-monospace { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .hvr-grow { transition: all 0.2s; }
                .hvr-grow:hover { transform: scale(1.05); }
                .min-vh-50 { min-height: 500px; }
            `}</style>
        </div>
    );
}
