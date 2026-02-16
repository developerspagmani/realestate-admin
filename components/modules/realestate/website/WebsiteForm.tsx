'use client';

import React, { useState } from 'react';
import FormBuilder from '../widgets/FormBuilder';
import WidgetPreview from '../widgets/WidgetPreview';
import MediaSelector from '@/components/shared/MediaSelector';
import MenuBuilder from './MenuBuilder';

interface WebsiteFormProps {
    formData: any;
    setFormData: (data: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
    setShowForm: (show: boolean) => void;
    editingWebsite: any;
    tenantType: number;
    properties: any[];
    marketingForms: any[];
    cmsPages: any[];
}

export default function WebsiteForm({
    formData,
    setFormData,
    handleSubmit,
    setShowForm,
    editingWebsite,
    tenantType,
    properties,
    marketingForms,
    cmsPages
}: WebsiteFormProps) {
    const [activeTab, setActiveTab] = useState<'basics' | 'domain' | 'style' | 'builder' | 'modules' | 'navigation'>('basics');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'logoUrl' | 'heroBgUrl' | null>(null);

    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    const checkDNS = async () => {
        if (!formData.customDomain) return;
        setVerificationStatus('checking');

        try {
            // Using Google DNS API for checking CNAME
            const response = await fetch(`https://dns.google/resolve?name=${formData.customDomain}&type=CNAME`);
            const data = await response.json();

            const isValid = data.Answer?.some((record: any) => {
                const target = record.data.toLowerCase();
                // Allow our custom CNAME alias OR direct Vercel pointing
                return target.includes('virpanix.com') ||
                    target.includes('vercel.app') ||
                    target.includes('cname.virpanix');
            });

            // Simulation for development/localhost testing or allowing manual override
            const isSimulation = formData.customDomain.includes('test') || formData.customDomain.includes('dev');

            if (isValid || isSimulation) {
                setVerificationStatus('valid');
            } else {
                setVerificationStatus('invalid');
            }
        } catch (error) {
            console.error('DNS check failed', error);
            setVerificationStatus('invalid');
        }
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
        { id: 'basics', label: 'Identity', icon: 'bi-info-circle-fill' },
        { id: 'domain', label: 'Domain', icon: 'bi-globe' },
        { id: 'style', label: 'Style', icon: 'bi-palette-fill' },
        { id: 'navigation', label: 'Menus', icon: 'bi-menu-button-wide-fill' },
        { id: 'builder', label: 'Page Builder', icon: 'bi-layout-text-window-reverse' },
        { id: 'modules', label: 'Integrations', icon: 'bi-plug-fill' },
    ];

    return (
        <div className="card border-0 shadow-lg rounded-4 mb-5 animate-fade-in overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="fw-bold mb-1 text-primary">
                        {editingWebsite ? 'Edit Project Portal' : 'Create New Website'}
                    </h4>
                    <p className="text-muted extra-small mb-0">Building a premium real estate experience for your project.</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
            </div>

            <div className="card-body p-0">
                <div className="row g-0">
                    {/* Left side: Form */}
                    <div className="col-lg-7 border-end">
                        <div className="widget-form-nav bg-light-subtle p-3 border-bottom d-flex gap-2 overflow-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`btn btn-sm px-3 rounded-4 d-flex align-items-center gap-2 transition-all flex-shrink-0 ${activeTab === tab.id ? 'btn-primary shadow-sm shadow-primary' : 'btn-link text-muted text-decoration-none'}`}
                                    onClick={() => setActiveTab(tab.id as any)}
                                >
                                    <i className={`bi ${tab.icon}`}></i>
                                    <span className="fw-bold">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="tab-content min-vh-50">
                                {/* TAB 1: Basics (Identity & SEO) */}
                                {activeTab === 'basics' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">General Information</h6>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold">Internal Reference Name</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3 border-light-subtle shadow-sm"
                                                placeholder="e.g. Burj Khalifa Landing Page"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">SEO & Social Meta</h6>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold">Page Title (Metatag)</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="Luxury Residences | Project Name"
                                                value={formData.configuration.seo?.title || ''}
                                                onChange={(e) => toggleNestedConfig('seo', 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold">Meta Description</label>
                                            <textarea
                                                className="form-control rounded-3"
                                                rows={3}
                                                placeholder="Brief description for search engines..."
                                                value={formData.configuration.seo?.description || ''}
                                                onChange={(e) => toggleNestedConfig('seo', 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: Domain Settings */}
                                {activeTab === 'domain' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Access & Hosting</h6>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-primary">App URL Slug</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-light-subtle extra-small">/go/</span>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-end-3 border-light-subtle shadow-sm"
                                                    placeholder="my-project-portal"
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold">Custom White-label Domain</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3 border-light-subtle shadow-sm"
                                                    placeholder="portal.yourbrand.com"
                                                    value={formData.customDomain}
                                                    onChange={(e) => {
                                                        // Automatically strip protocol and trailing slashes
                                                        const cleanDomain = e.target.value.toLowerCase()
                                                            .replace(/^https?:\/\//, '')
                                                            .replace(/\/$/, '');
                                                        setFormData({ ...formData, customDomain: cleanDomain });
                                                        setVerificationStatus('idle');
                                                    }}
                                                />
                                                <button
                                                    className={`btn ${verificationStatus === 'valid' ? 'btn-success' : verificationStatus === 'invalid' ? 'btn-danger' : 'btn-primary'} rounded-end-3 px-3`}
                                                    type="button"
                                                    onClick={checkDNS}
                                                    disabled={verificationStatus === 'checking' || !formData.customDomain}
                                                >
                                                    {verificationStatus === 'checking' ? (
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    ) : verificationStatus === 'valid' ? (
                                                        <i className="bi bi-check-circle-fill me-2"></i>
                                                    ) : verificationStatus === 'invalid' ? (
                                                        <i className="bi bi-x-circle-fill me-2"></i>
                                                    ) : (
                                                        <i className="bi bi-lightning-charge-fill me-2"></i>
                                                    )}
                                                    {verificationStatus === 'valid' ? 'Verified' : verificationStatus === 'invalid' ? 'Failed' : 'Verify DNS'}
                                                </button>
                                            </div>
                                            <div className="extra-small text-muted mt-2 d-flex justify-content-between">
                                                <span>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Point your domain CNAME to our servers to activate white-labeling.
                                                </span>
                                                {verificationStatus === 'invalid' && (
                                                    <span className="text-danger fw-bold">CNAME record not found. Please check your DNS.</span>
                                                )}
                                            </div>

                                            {formData.customDomain && (
                                                <div className="mt-3 p-3 bg-light border border-light-subtle rounded-3 animate-fade-in">
                                                    <h6 className="fw-bold extra-small text-uppercase mb-2 text-secondary d-flex justify-content-between">
                                                        <span>DNS Configuration Required</span>
                                                        <i className="bi bi-hdd-network"></i>
                                                    </h6>
                                                    <div className="row g-2">
                                                        <div className="col-6">
                                                            <div className="p-2 bg-white rounded-2 border border-light-subtle">
                                                                <div className="extra-small text-muted mb-1">Type</div>
                                                                <div className="small fw-bold font-monospace text-primary">CNAME</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="p-2 bg-white rounded-2 border border-light-subtle">
                                                                <div className="extra-small text-muted mb-1">TTL (Duration)</div>
                                                                <div className="small fw-bold font-monospace">3600 <span className="text-muted fw-normal">(1 Hour)</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="p-2 bg-white rounded-2 border border-light-subtle">
                                                                <div className="extra-small text-muted mb-1">Host / Name</div>
                                                                <div className="small fw-bold font-monospace">{formData.customDomain.split('.')[0] || '@'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="p-2 bg-white rounded-2 border border-light-subtle">
                                                                <div className="extra-small text-muted mb-1">Value / Target</div>
                                                                <div className="small fw-bold font-monospace text-truncate" title="cname.virpanix.com">cname.virpanix.com</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="extra-small text-warning mt-2 d-flex gap-2 align-items-center">
                                                        <i className="bi bi-exclamation-triangle-fill"></i>
                                                        <span>DNS propagation may take up to 24-48 hours.</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Context Control</h6>
                                            <label className="form-label small fw-bold">Source Properties</label>
                                            <select
                                                className="form-select rounded-3 border-light-subtle shadow-sm"
                                                value={formData.propertyId}
                                                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                            >
                                                <option value="">Full Portfolio (Global)</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id}>{p.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: Style Settings */}
                                {activeTab === 'style' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Visual System</h6>
                                        </div>
                                        <div className="col-md-6">
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
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Global Typography</label>
                                            <select
                                                className="form-select rounded-3 shadow-sm border-light-subtle"
                                                value={formData.configuration.theme.fontFamily}
                                                onChange={(e) => toggleNestedConfig('theme', 'fontFamily', e.target.value)}
                                            >
                                                <option value="Inter, sans-serif">Inter (Modern)</option>
                                                <option value="'Roboto', sans-serif">Roboto (Clean)</option>
                                                <option value="'Poppins', sans-serif">Poppins (Playful)</option>
                                                <option value="'Montserrat', sans-serif">Montserrat (Bold)</option>
                                                <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: Navigation Menus */}
                                {activeTab === 'navigation' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Site Navigation</h6>
                                            <p className="text-muted small mb-4">Manage the links that appear in your website header and footer. Drag items to reorder.</p>
                                        </div>

                                        <div className="col-12">
                                            <MenuBuilder
                                                label="Header Menu"
                                                items={formData.configuration.menus?.header || []} // Handle existing websites without menus config
                                                onChange={(items) => toggleNestedConfig('menus', 'header', items)}
                                                cmsPages={cmsPages}
                                            />
                                        </div>

                                        <div className="col-12 mt-2">
                                            <MenuBuilder
                                                label="Footer Menu"
                                                items={formData.configuration.menus?.footer || []}
                                                onChange={(items) => toggleNestedConfig('menus', 'footer', items)}
                                                cmsPages={cmsPages}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: Expanded Page Builder */}
                                {activeTab === 'builder' && (
                                    <div className="row g-4 animate-fade-in overflow-auto max-vh-60 pe-2">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Header & Hero Content</h6>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Brand Logo URL</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3"
                                                    placeholder="Logo URL"
                                                    value={formData.configuration.builder?.logoUrl || ''}
                                                    onChange={(e) => toggleNestedConfig('builder', 'logoUrl', e.target.value)}
                                                />
                                                <button type="button" className="btn btn-outline-secondary rounded-end-3" onClick={() => { setMediaTarget('logoUrl'); setShowMediaSelector(true); }}>
                                                    <i className="bi bi-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Hero Cover Image</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3"
                                                    placeholder="Background URL"
                                                    value={formData.configuration.builder?.heroBgUrl || ''}
                                                    onChange={(e) => toggleNestedConfig('builder', 'heroBgUrl', e.target.value)}
                                                />
                                                <button type="button" className="btn btn-outline-secondary rounded-end-3" onClick={() => { setMediaTarget('heroBgUrl'); setShowMediaSelector(true); }}>
                                                    <i className="bi bi-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold">Hero Main Title</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                value={formData.configuration.builder?.heroTitle || ''}
                                                onChange={(e) => toggleNestedConfig('builder', 'heroTitle', e.target.value)}
                                            />
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Listing Strategy (Grid System)</h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Layout Mode</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        value={formData.configuration.builder?.gridStrategy || 'grid'}
                                                        onChange={(e) => toggleNestedConfig('builder', 'gridStrategy', e.target.value)}
                                                    >
                                                        <option value="grid">Dynamic Grid</option>
                                                        <option value="list">Detailed Horizontal List</option>
                                                        <option value="masonry">Elegant Masonry</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Columns (Desktop)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control rounded-3"
                                                        min={1} max={4}
                                                        value={formData.configuration.builder?.columns || 3}
                                                        onChange={(e) => toggleNestedConfig('builder', 'columns', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Advanced Modules Toggle</h6>
                                            <div className="row g-3 p-3 bg-light rounded-4">
                                                {[
                                                    { id: 'enable3D', label: 'Interactive 3D Plot Map' },
                                                    { id: 'enableTour', label: 'Virtual 3D Tours' },
                                                    { id: 'enableBooking', label: 'Suite Booking Engine' },
                                                    { id: 'showListing', label: 'Property Inventory Section' },
                                                    { id: 'showInquiry', label: 'Lead Capture Form' },
                                                    { id: 'showPrice', label: 'Display Unit Pricing' },
                                                ].map(item => (
                                                    <div key={item.id} className="col-md-6">
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

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Detail Page Configuration</h6>
                                            <label className="form-label small fw-bold">Navigation UX</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={formData.configuration.builder?.detailViewType || 'tabs'}
                                                onChange={(e) => toggleNestedConfig('builder', 'detailViewType', e.target.value)}
                                            >
                                                <option value="tabs">Organized Tabs</option>
                                                <option value="scrolling">Single Page Continuous Scroll</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: Modules & Integrations */}
                                {activeTab === 'modules' && (
                                    <div className="row g-4 animate-fade-in">
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Smart Conversions</h6>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="card bg-light border-0 rounded-4 p-4">
                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                    <i className="bi bi-robot h2 text-primary mb-0"></i>
                                                    <div>
                                                        <h6 className="fw-bold mb-0">Project AI Chatbot</h6>
                                                        <p className="extra-small text-muted mb-0">Lead qualification & inventory discovery assistant.</p>
                                                    </div>
                                                    <div className="form-check form-switch ms-auto">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="chatbotEnabled"
                                                            checked={formData.configuration.chatbot?.enabled || false}
                                                            onChange={(e) => toggleNestedConfig('chatbot', 'enabled', e.target.checked)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4">
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Capture Sync</h6>
                                            <div className="card border-0 bg-white shadow-sm rounded-4 p-4">
                                                <FormBuilder
                                                    config={formData.configuration.inquiryForm || { enabled: false, title: '', description: '', fields: [] }}
                                                    onChange={(formConfig) => setFormData({
                                                        ...formData,
                                                        configuration: { ...formData.configuration, inquiryForm: formConfig }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-footer mt-5 border-top pt-4 text-end">
                                <button type="button" className="btn btn-outline-secondary me-2 rounded-4 px-4 fw-bold shadow-sm" onClick={() => setShowForm(false)}>Discard</button>
                                <button type="submit" className="btn btn-primary rounded-4 px-5 fw-bold shadow-lg hvr-grow">
                                    <i className="bi bi-lightning-charge-fill me-2"></i>
                                    {editingWebsite ? 'Sync Portal Changes' : 'Publish Live Portal'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right side: Preview */}
                    <div className="col-lg-5 bg-light-subtle p-4 d-none d-lg-block">
                        <div className="sticky-top" style={{ top: '20px' }}>
                            <label className="extra-small fw-bold text-muted text-uppercase mb-3 d-block">Device Simulation (iPhone 14)</label>
                            <div className="preview-container bg-dark rounded-5 border border-dark border-4 shadow-2xl p-2 mx-auto" style={{ maxWidth: '300px', height: '600px' }}>
                                <div className="rounded-4 overflow-hidden bg-white h-100 position-relative">
                                    <WidgetPreview formData={formData} tenantType={tenantType} />
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-4 border border-light-subtle shadow-sm">
                                <h6 className="fw-bold small mb-2">Omnichannel Strategy</h6>
                                <p className="extra-small text-muted mb-0">Your portal is automatically optimized for QR displays, email campaigns, and social media embedding.</p>
                            </div>
                        </div>
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
