'use client';

import React from 'react';
import FormBuilder from './FormBuilder';

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
    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4 animate-fade-in">
            <div className="card-header bg-white border-0 p-4">
                <h5 className="fw-bold mb-0">{editingWidget ? 'Edit Widget' : 'New Widget'}</h5>
            </div>
            <div className="card-body p-4 pt-0">
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Widget Name</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="e.g. Website Home Sidebar"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Unique ID (Slug)</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="e.g. homepage-widget (Optional)"
                                value={formData.uniqueId}
                                onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Select {tenantType === 1 ? 'Property' : 'Property'}</label>
                            <select
                                className="form-select rounded-3"
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
                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Widget Mode</label>
                            <select
                                className="form-select rounded-3"
                                value={formData.configuration.settings?.startView || 'listing'}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        settings: { ...formData.configuration.settings, startView: e.target.value }
                                    }
                                })}
                            >
                                <option value="listing">{tenantType === 1 ? 'Multi-Property' : 'Multi-Workspace'} Listing</option>
                                <option value="property">{tenantType === 1 ? 'Single Property' : 'Single Workspace'} Direct</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Grid Columns</label>
                            <select
                                className="form-select rounded-3"
                                value={formData.configuration.display.columns || 1}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        display: { ...formData.configuration.display, columns: parseInt(e.target.value) }
                                    }
                                })}
                            >
                                <option value={1}>1 Column (List)</option>
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Primary Color</label>
                            <input
                                type="color"
                                className="form-control form-control-color w-100 rounded-3"
                                value={formData.configuration.theme.primaryColor}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        theme: { ...formData.configuration.theme, primaryColor: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Typography (Font)</label>
                            <select
                                className="form-select rounded-3"
                                value={formData.configuration.theme.fontFamily}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        theme: { ...formData.configuration.theme, fontFamily: e.target.value }
                                    }
                                })}
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
                            <label className="form-label small fw-bold">Landing Page Layout</label>
                            <select
                                className="form-select rounded-3"
                                value={formData.configuration.settings?.layout || 'grid'}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        settings: { ...formData.configuration.settings, layout: e.target.value }
                                    }
                                })}
                            >
                                <option value="grid">Default Grid</option>
                                <option value="builder">Page Builder</option>
                            </select>
                        </div>

                        <div className="col-12 mt-4">
                            <h6 className="fw-bold border-bottom pb-2 text-primary d-flex align-items-center">
                                <i className="bi bi-layout-text-window-reverse me-2"></i>
                                Page Builder Settings (Active if layout is Page Builder)
                            </h6>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Logo URL</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="https://example.com/logo.png"
                                value={formData.configuration.builder?.logoUrl || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, logoUrl: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Hero Title</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="Find Your Perfect Space"
                                value={formData.configuration.builder?.heroTitle || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, heroTitle: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Hero Subtitle</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="Flexible workspaces for modern teams"
                                value={formData.configuration.builder?.heroSubtitle || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, heroSubtitle: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Footer Text</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="© 2026 Your Company. All rights reserved."
                                value={formData.configuration.builder?.footerText || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, footerText: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Hero Background Image URL</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="https://example.com/banner.jpg"
                                value={formData.configuration.builder?.heroBgUrl || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, heroBgUrl: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Hero Text Color</label>
                            <input
                                type="color"
                                className="form-control form-control-color w-100 rounded-3"
                                value={formData.configuration.builder?.heroTextColor || '#ffffff'}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, heroTextColor: e.target.value }
                                    }
                                })}
                            />
                        </div>

                        <div className="col-md-4 d-flex align-items-end pb-1">
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="chatbotEnabled"
                                    checked={formData.configuration.chatbot?.enabled || false}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            chatbot: { ...formData.configuration.chatbot, enabled: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="chatbotEnabled">Enable Smart Assistant (Chatbot)</label>
                            </div>
                        </div>
                        <div className="col-md-4 d-flex align-items-end pb-1">
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="workspace3DEnabled"
                                    checked={formData.configuration.workspace3D?.enabled || false}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            workspace3D: { ...formData.configuration.workspace3D, enabled: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="workspace3DEnabled">Enable {tenantType === 1 ? '3D Property' : '3D Workspace'} View</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Landing Page Title</label>
                            <input
                                type="text"
                                className="form-control rounded-3"
                                placeholder="e.g. My Awesome Workspace"
                                value={formData.configuration.builder?.pageTitle || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                        ...formData.configuration,
                                        builder: { ...formData.configuration.builder, pageTitle: e.target.value }
                                    }
                                })}
                            />
                        </div>

                        <div className="col-md-2">
                            <div className="form-check form-switch mt-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="showLogo"
                                    checked={formData.configuration.builder?.showLogo ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            builder: { ...formData.configuration.builder, showLogo: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="showLogo">Show Logo</label>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="form-check form-switch mt-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="showHero"
                                    checked={formData.configuration.builder?.showHero ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            builder: { ...formData.configuration.builder, showHero: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="showHero">Show Hero Section</label>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="form-check form-switch mt-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="showListing"
                                    checked={formData.configuration.builder?.showListing ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            builder: { ...formData.configuration.builder, showListing: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="showListing">Show Properties</label>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="form-check form-switch mt-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="showInquiry"
                                    checked={formData.configuration.builder?.showInquiry ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            builder: { ...formData.configuration.builder, showInquiry: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="showInquiry">Show Inquiry Form</label>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="form-check form-switch mt-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="showFooter"
                                    checked={formData.configuration.builder?.showFooter ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuration: {
                                            ...formData.configuration,
                                            builder: { ...formData.configuration.builder, showFooter: e.target.checked }
                                        }
                                    })}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="showFooter">Show Footer</label>
                            </div>
                        </div>
                        <div className="col-12 mt-4">
                            <h6 className="fw-bold border-bottom pb-2 text-info d-flex align-items-center">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                Inquiry Management System
                            </h6>
                        </div>

                        <div className="col-12">
                            <div className="card bg-light border-0 rounded-4 p-4 mb-3">
                                <label className="form-label small fw-bold">Form Strategy</label>
                                <div className="d-flex gap-3 mb-3">
                                    <div className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all ${!formData.configuration.inquiryForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed text-muted'}`}
                                        onClick={() => setFormData({
                                            ...formData,
                                            configuration: {
                                                ...formData.configuration,
                                                inquiryForm: { ...formData.configuration.inquiryForm, useMarketingForm: false }
                                            }
                                        })}>
                                        <div className="fw-bold small mb-1">Custom Builder</div>
                                        <div className="extra-small opacity-75">Build a unique form for this widget</div>
                                    </div>
                                    <div className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all ${formData.configuration.inquiryForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed text-muted'}`}
                                        onClick={() => setFormData({
                                            ...formData,
                                            configuration: {
                                                ...formData.configuration,
                                                inquiryForm: { ...formData.configuration.inquiryForm, useMarketingForm: true }
                                            }
                                        })}>
                                        <div className="fw-bold small mb-1">Marketing Hub Form</div>
                                        <div className="extra-small opacity-75">Sync with centrally managed forms</div>
                                    </div>
                                </div>

                                {formData.configuration.inquiryForm?.useMarketingForm ? (
                                    <div className="animate-fade-in">
                                        <label className="form-label extra-small fw-bold text-muted text-uppercase">Select Managed Form</label>
                                        <select
                                            className="form-select border-0 shadow-none py-2"
                                            value={formData.configuration.inquiryForm?.marketingFormId || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                configuration: {
                                                    ...formData.configuration,
                                                    inquiryForm: { ...formData.configuration.inquiryForm, marketingFormId: e.target.value }
                                                }
                                            })}
                                        >
                                            <option value="">-- Choose a Marketing Form --</option>
                                            {marketingForms.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                        <p className="extra-small text-info mt-2 mb-0">
                                            <i className="bi bi-info-circle me-1"></i>
                                            This widget will automatically use the fields and target groups defined in the Marketing Hub.
                                        </p>
                                    </div>
                                ) : (
                                    <FormBuilder
                                        config={formData.configuration.inquiryForm || { enabled: false, title: '', description: '', fields: [] }}
                                        onChange={(formConfig) => setFormData({
                                            ...formData,
                                            configuration: {
                                                ...formData.configuration,
                                                inquiryForm: formConfig
                                            }
                                        })}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="col-md-12 text-end mt-4 border-top pt-3">
                            <button type="button" className="btn btn-light me-2 rounded-pill px-4" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm">
                                {editingWidget ? 'Update Widget' : 'Create Widget'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
