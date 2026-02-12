'use client';

import React, { useState } from 'react';
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
    const [activeTab, setActiveTab] = useState<'basics' | 'style' | 'builder' | 'modules'>('basics');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'logoUrl' | 'heroBgUrl' | null>(null);

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
        { id: 'builder', label: 'Page Builder', icon: 'bi-layout-text-window-reverse' },
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

                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Architectural Layout</label>
                                            <div className="d-flex gap-3">
                                                <div
                                                    className={`card flex-grow-1 cursor-pointer transition-all border-2 ${formData.configuration.settings?.layout === 'grid' ? 'border-primary bg-primary bg-opacity-10 text-white' : 'border-light-subtle bg-white text-muted opacity-50'}`}
                                                    onClick={() => toggleNestedConfig('settings', 'layout', 'grid')}
                                                >
                                                    <div className="card-body p-3 text-center">
                                                        <i className="bi bi-grid-3x3-gap fs-4"></i>
                                                        <div className="fw-bold small mt-2">Standard Grid</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`card flex-grow-1 cursor-pointer transition-all border-2 ${formData.configuration.settings?.layout === 'builder' ? 'border-primary bg-primary bg-opacity-10 text-white' : 'border-light-subtle bg-white text-muted opacity-50'}`}
                                                    onClick={() => toggleNestedConfig('settings', 'layout', 'builder')}
                                                >
                                                    <div className="card-body p-3 text-center">
                                                        <i className="bi bi-palette fs-4"></i>
                                                        <div className="fw-bold small mt-2">Page Builder</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: Builder Settings */}
                                {activeTab === 'builder' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <div className="d-flex align-items-center gap-3">
                                                <h6 className="fw-bold mb-0 text-secondary text-uppercase extra-small">Header & Hero Content</h6>
                                                {formData.configuration.settings?.layout !== 'builder' && (
                                                    <span className="badge bg-warning-subtle text-warning-emphasis fw-normal px-3 py-1 border border-warning-subtle rounded-4">
                                                        <i className="bi bi-exclamation-circle me-1"></i>
                                                        Builder Layout Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Brand Logo URL</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3"
                                                    placeholder="https://example.com/logo.png"
                                                    value={formData.configuration.builder?.logoUrl || ''}
                                                    onChange={(e) => toggleNestedConfig('builder', 'logoUrl', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary rounded-end-3"
                                                    onClick={() => {
                                                        setMediaTarget('logoUrl');
                                                        setShowMediaSelector(true);
                                                    }}
                                                >
                                                    <i className="bi bi-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Landing Page Title</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. My Awesome Workspace"
                                                value={formData.configuration.builder?.pageTitle || ''}
                                                onChange={(e) => toggleNestedConfig('builder', 'pageTitle', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Hero Headline</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="Find Your Perfect Space"
                                                value={formData.configuration.builder?.heroTitle || ''}
                                                onChange={(e) => toggleNestedConfig('builder', 'heroTitle', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Hero Sub-headline</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="Flexible workspaces for modern teams"
                                                value={formData.configuration.builder?.heroSubtitle || ''}
                                                onChange={(e) => toggleNestedConfig('builder', 'heroSubtitle', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Hero Cover Image</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3"
                                                    placeholder="https://example.com/banner.jpg"
                                                    value={formData.configuration.builder?.heroBgUrl || ''}
                                                    onChange={(e) => toggleNestedConfig('builder', 'heroBgUrl', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary rounded-end-3"
                                                    onClick={() => {
                                                        setMediaTarget('heroBgUrl');
                                                        setShowMediaSelector(true);
                                                    }}
                                                >
                                                    <i className="bi bi-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Hero Text Color</label>
                                            <input
                                                type="color"
                                                className="form-control form-control-color w-100 rounded-3 border-0 bg-transparent"
                                                value={formData.configuration.builder?.heroTextColor || '#ffffff'}
                                                onChange={(e) => toggleNestedConfig('builder', 'heroTextColor', e.target.value)}
                                            />
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Module Visibility Toggles</h6>
                                            <div className="row g-3 p-3 bg-light rounded-4">
                                                {[
                                                    { id: 'showLogo', label: 'Display Logo' },
                                                    { id: 'showHero', label: 'Display Hero' },
                                                    { id: 'showListing', label: 'Property Listings' },
                                                    { id: 'showInquiry', label: 'Inquiry Form' },
                                                    { id: 'showFooter', label: 'Display Footer' },
                                                ].map(item => (
                                                    <div key={item.id} className="col-md-4">
                                                        <div className="form-check form-switch p-2 hover-bg-light transition-all rounded-3">
                                                            <input
                                                                className="form-check-input ms-0 me-3"
                                                                type="checkbox"
                                                                id={item.id}
                                                                checked={formData.configuration.builder?.[item.id] ?? true}
                                                                onChange={(e) => toggleNestedConfig('builder', item.id, e.target.checked)}
                                                            />
                                                            <label className="form-check-label small fw-bold" htmlFor={item.id}>{item.label}</label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold">Footer Signature</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="© 2026 Your Company. All rights reserved."
                                                value={formData.configuration.builder?.footerText || ''}
                                                onChange={(e) => toggleNestedConfig('builder', 'footerText', e.target.value)}
                                            />
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
                                                    <div className="card border-0 shadow-sm rounded-4 px-5 py-3 bg-white h-100">
                                                        <div className="form-check form-switch p-1 mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="chatbotEnabled"
                                                                checked={formData.configuration.chatbot?.enabled || false}
                                                                onChange={(e) => toggleNestedConfig('chatbot', 'enabled', e.target.checked)}
                                                            />
                                                            <label className="form-check-label small fw-bold" htmlFor="chatbotEnabled">AI Discovery Assistant</label>
                                                        </div>
                                                        <p className="extra-small text-muted mb-0">Enables a floating chatbot to help visitors find matching properties automatically.</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card border-0 shadow-sm rounded-4 px-5 py-3 bg-white h-100">
                                                        <div className="form-check form-switch p-1 mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="workspace3DEnabled"
                                                                checked={formData.configuration.workspace3D?.enabled || false}
                                                                onChange={(e) => toggleNestedConfig('workspace3D', 'enabled', e.target.checked)}
                                                            />
                                                            <label className="form-check-label small fw-bold" htmlFor="workspace3DEnabled">Virtual 3D Touring</label>
                                                        </div>
                                                        <p className="extra-small text-muted mb-0">Allows users to see the interactive 3D map for property floor plans.</p>
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
                                                        className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center ${formData.configuration.inquiryForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'}`}
                                                        onClick={() => toggleNestedConfig('inquiryForm', 'useMarketingForm', true)}
                                                    >
                                                        <i className="bi bi-cloud-check d-block mb-1"></i>
                                                        <div className="fw-bold extra-small">Marketing Hub Sync</div>
                                                    </div>
                                                </div>

                                                {formData.configuration.inquiryForm?.useMarketingForm ? (
                                                    <div className="animate-fade-in">
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
