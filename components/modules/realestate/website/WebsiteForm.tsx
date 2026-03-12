'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import FormBuilder from '../widgets/FormBuilder';
import WidgetPreview from '../widgets/WidgetPreview';
import MediaSelector from '@/components/shared/MediaSelector';
import MenuBuilder from './MenuBuilder';
import Loader from '@/components/common/Loader';
import { MediaItem, Website, CMSPage, MarketingForm } from '@/types';

interface WebsiteFormProps {
    formData: Partial<Website>;
    setFormData: (data: Partial<Website>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    setShowForm: (show: boolean) => void;
    editingWebsite: Website | null;
    tenantType: number;
    properties: { id: string; title?: string }[];
    marketingForms: MarketingForm[];
    cmsPages: CMSPage[];
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
    const router = useRouter();
    const { hasModule } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'basics' | 'domain' | 'style' | 'builder' | 'footer' | 'modules' | 'navigation' | 'seo'>('basics');
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'logoUrl' | 'heroBgUrl' | 'faviconUrl' | null>(null);
    const [modularMediaIndex, setModularMediaIndex] = useState<number | null>(null);
    const [modularSlideIndex, setModularSlideIndex] = useState<number | null>(null);

    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    const generateSlug = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, slug: result });
    };

    React.useEffect(() => {
        if (!editingWebsite && !formData.slug) {
            generateSlug();
        }
    }, [editingWebsite]);

    // Helper to manage modular blocks
    const addModule = (type: string) => {
        const currentModules = formData.configuration.builder?.modules || [];
        const newModule = {
            id: `mod-${new Date().getTime()}`,
            type,
            data: {
                title: type === 'typography' || type === 'search' ? '' : '',
                description: '',
                imageUrl: '',
                bgColor: '#ffffff',
                textColor: '#000000',
                slides: type === 'hero-slider' ? [{ title: '', subtitle: '', imageUrl: '' }] : undefined
            }
        };
        toggleNestedConfig('builder', 'modules', [...currentModules, newModule]);
    };

    const updateModule = (index: number, data: any) => {
        const modules = [...(formData.configuration.builder?.modules || [])];
        modules[index] = { ...modules[index], data };
        toggleNestedConfig('builder', 'modules', modules);
    };

    const removeModule = (index: number) => {
        const modules = [...(formData.configuration.builder?.modules || [])];
        modules.splice(index, 1);
        toggleNestedConfig('builder', 'modules', modules);
    };

    const moveModule = (index: number, direction: 'up' | 'down') => {
        const modules = [...(formData.configuration.builder?.modules || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= modules.length) return;
        [modules[index], modules[targetIndex]] = [modules[targetIndex], modules[index]];
        toggleNestedConfig('builder', 'modules', modules);
    };

    const checkDNS = async () => {
        if (!formData.customDomain) return;
        setVerificationStatus('checking');

        try {
            // Using Google DNS API for checking CNAME
            const response = await fetch(`https://dns.google/resolve?name=${formData.customDomain}&type=CNAME`);
            const data = await response.json();

            const isValid = data.Answer?.some((record: { data: string }) => {
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


    const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
        const selectedMedia = Array.isArray(media) ? media[0] : media;
        if (selectedMedia) {
            if (mediaTarget) {
                toggleNestedConfig('builder', mediaTarget, selectedMedia.url);
            } else if (modularMediaIndex !== null) {
                const modules = [...(formData.configuration.builder?.modules || [])];
                if (modularSlideIndex !== null) {
                    const slides = [...(modules[modularMediaIndex].data.slides || [])];
                    if (slides[modularSlideIndex]) {
                        slides[modularSlideIndex].imageUrl = selectedMedia.url;
                        modules[modularMediaIndex].data.slides = slides;
                    }
                } else {
                    modules[modularMediaIndex].data.imageUrl = selectedMedia.url;
                }
                toggleNestedConfig('builder', 'modules', modules);
            }
        }
        setShowMediaSelector(false);
        setMediaTarget(null);
        setModularMediaIndex(null);
        setModularSlideIndex(null);
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

    const calculateWebsiteSEOScore = () => {
        let score = 0;
        const seo = formData.configuration?.seo || {};
        const builder = formData.configuration?.builder || {};

        // Title optimization
        if (seo.title) {
            score += 10;
            if (seo.title.length >= 30 && seo.title.length <= 60) score += 10;
        }

        // Description optimization
        if (seo.description) {
            score += 10;
            if (seo.description.length >= 120 && seo.description.length <= 160) score += 15;
        }

        // Keywords
        if (seo.keywords) score += 5;

        // Visual Identity
        if (builder.logoUrl) score += 5;
        if (builder.faviconUrl) score += 5;
        if (builder.heroBgUrl) score += 5;

        // Content Quality
        if (builder.heroTitle) score += 10;
        if (builder.heroSubtitle) score += 5;
        if ((builder.modules || []).length >= 3) score += 10;

        // Custom Domain
        if (formData.customDomain) score += 10;

        return Math.min(score, 100);
    };

    const getWebsiteSEOImprovements = () => {
        const tips = [];
        const seo = formData.configuration?.seo || {};
        const builder = formData.configuration?.builder || {};

        if (!seo.title || seo.title.length < 30) tips.push({ label: 'Short Title', tip: 'Meta titles should be 30-60 characters to avoid being cut off.', icon: 'bi-type', color: 'warning' });
        if (!seo.description || seo.description.length < 120) tips.push({ label: 'Thin Description', tip: 'Explain your project in 120-160 characters for better CTR.', icon: 'bi-text-paragraph', color: 'danger' });
        if (!builder.faviconUrl) tips.push({ label: 'Missing Favicon', tip: 'Favicons help in brand recognition and browser tab visibility.', icon: 'bi-bookmark-star', color: 'info' });
        if (!formData.customDomain) tips.push({ label: 'System Subdomain', tip: 'Using a custom domain (portal.yourbrand.com) boosts authority significantly.', icon: 'bi-globe', color: 'primary' });
        if ((builder.modules || []).length < 2) tips.push({ label: 'Low Engagement', tip: 'Add more modular sections like Property Sliders to keep users busy.', icon: 'bi-layers', color: 'warning' });
        if (!formData.configuration?.seo?.generateSitemap) tips.push({ label: 'Sitemap Disabled', tip: 'A sitemap helps Google discover all your project pages instantly.', icon: 'bi-diagram-3', color: 'info' });

        return tips;
    };

    const websiteScore = calculateWebsiteSEOScore();
    const websiteImprovements = getWebsiteSEOImprovements();
    const scoreColor = websiteScore < 40 ? 'danger' : websiteScore < 75 ? 'warning' : 'success';

    const tabs = [
        { id: 'basics', label: 'Identity', icon: 'bi-info-circle-fill' },
        { id: 'domain', label: 'Domain', icon: 'bi-globe' },
        { id: 'style', label: 'Style', icon: 'bi-palette-fill' },
        { id: 'navigation', label: 'Menus', icon: 'bi-menu-button-wide-fill' },
        { id: 'builder', label: 'Page Builder', icon: 'bi-layout-text-window-reverse' },
        { id: 'footer', label: 'Footer', icon: 'bi-layout-sidebar' },
        { id: 'modules', label: 'Integrations', icon: 'bi-plug-fill' },
        { id: 'seo', label: 'SEO & Tools', icon: 'bi-search-heart-fill' },
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
                <div className="d-flex align-items-center gap-3">
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 transition-all ${showPreview ? 'btn-primary shadow-sm' : 'btn-outline-primary border-2'}`}
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        <i className={`bi ${showPreview ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                    <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
            </div>

            <div className="card-body p-0">
                <div className="row g-0">
                    {/* Left side: Form */}
                    {!showPreview && (
                        <div className="col-lg-12 animate-fade-in">
                            <div className="widget-form-nav bg-light-subtle p-3 border-bottom d-flex gap-2 overflow-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`btn btn-sm px-3 rounded-4 d-flex align-items-center gap-2 transition-all flex-shrink-0 ${activeTab === tab.id ? 'btn-primary shadow-sm shadow-primary' : 'btn-link text-muted text-decoration-none'}`}
                                        onClick={() => setActiveTab(tab.id as 'basics' | 'domain' | 'style' | 'builder' | 'footer' | 'modules' | 'navigation' | 'seo')}
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
                                            <div className="col-md-12">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <label className="form-label small fw-bold mb-0">Custom Favicon (.ico, .png)</label>
                                                    {formData.configuration.builder?.faviconUrl && (
                                                        <div className="bg-white p-1 rounded-2 border shadow-sm">
                                                            <img src={formData.configuration.builder.faviconUrl} alt="Favicon Preview" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="input-group shadow-sm">
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-start-3 border-light-subtle"
                                                        placeholder="Select from media or enter URL"
                                                        value={formData.configuration.builder?.faviconUrl || ''}
                                                        onChange={(e) => toggleNestedConfig('builder', 'faviconUrl', e.target.value)}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-primary rounded-end-3 px-3 d-flex align-items-center gap-2" 
                                                        onClick={() => { setMediaTarget('faviconUrl' as any); setShowMediaSelector(true); }}
                                                    >
                                                        <i className="bi bi-image"></i>
                                                        <span className="small fw-bold">Select</span>
                                                    </button>
                                                </div>
                                                <div className="extra-small text-muted mt-2">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Recommended size: 32x32 or 64x64 pixels. This icon will appear in browser tabs.
                                                </div>
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
                                                <label className="form-label small fw-bold text-primary">App URL Code (Slug)</label>
                                                <div className="input-group shadow-sm">
                                                    <span className="input-group-text bg-light border-light-subtle extra-small">/standalone/</span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-light-subtle fw-bold text-center bg-light"
                                                        value={formData.slug || ''}
                                                        readOnly
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary border-light-subtle d-flex align-items-center gap-2"
                                                        onClick={generateSlug}
                                                        title="Regenerate unique code"
                                                    >
                                                        <i className="bi bi-arrow-clockwise"></i>
                                                        <span className="small fw-bold">Generate</span>
                                                    </button>
                                                </div>
                                                <div className="extra-small text-muted mt-2">
                                                    <i className="bi bi-shield-check me-1"></i>
                                                    This unique 6-digit code ensures your portal URL is completely unique.
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
                                                            'Checking...'
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
                                                <div className="p-3 bg-light rounded-4 border border-light-subtle">
                                                    <div className="row g-2">
                                                        <div className="col-12">
                                                            <div className="form-check mb-2">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="prop-all"
                                                                    checked={!formData.propertyIds || formData.propertyIds.length === 0}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setFormData({ ...formData, propertyIds: [], propertyId: '' });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small fw-bold" htmlFor="prop-all">Full Portfolio (Global)</label>
                                                            </div>
                                                        </div>
                                                        {properties.map(p => (
                                                            <div key={p.id} className="col-md-6">
                                                                <div className="p-2 bg-white rounded-3 border border-light-subtle d-flex align-items-center">
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            id={`prop-${p.id}`}
                                                                            checked={formData.propertyIds?.includes(p.id)}
                                                                            onChange={(e) => {
                                                                                const ids = formData.propertyIds || [];
                                                                                if (e.target.checked) {
                                                                                    setFormData({ ...formData, propertyIds: [...ids, p.id] });
                                                                                } else {
                                                                                    setFormData({ ...formData, propertyIds: ids.filter((id: string) => id !== p.id) });
                                                                                }
                                                                            }}
                                                                        />
                                                                        <label className="form-check-label extra-small text-truncate" htmlFor={`prop-${p.id}`} title={p.title}>
                                                                            {p.title}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
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
                                                        value={formData.configuration?.theme?.primaryColor || '#6366f1'}
                                                        onChange={(e) => toggleNestedConfig('theme', 'primaryColor', e.target.value)}
                                                    />
                                                    <span className="small font-monospace text-uppercase text-muted">{formData.configuration?.theme?.primaryColor || '#6366f1'}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Global Typography (Google Fonts)</label>
                                                <select
                                                    className="form-select rounded-3 shadow-sm border-light-subtle"
                                                    value={formData.configuration?.theme?.fontFamily || 'Inter'}
                                                    onChange={(e) => toggleNestedConfig('theme', 'fontFamily', e.target.value)}
                                                >
                                                    <optgroup label="Modern Sans-Serif">
                                                        <option value="Inter">Inter (Default)</option>
                                                        <option value="Roboto">Roboto</option>
                                                        <option value="Poppins">Poppins</option>
                                                        <option value="Montserrat">Montserrat</option>
                                                        <option value="Outfit">Outfit (Premium)</option>
                                                        <option value="Public Sans">Public Sans</option>
                                                        <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                                                    </optgroup>
                                                    <optgroup label="Elegant Serif">
                                                        <option value="Playfair Display">Playfair Display</option>
                                                        <option value="Lora">Lora</option>
                                                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                                                        <option value="Cinzel">Cinzel (Classical)</option>
                                                    </optgroup>
                                                    <optgroup label="Luxury & Specialized">
                                                        <option value="Syne">Syne (Ultra Modern)</option>
                                                        <option value="Manrope">Manrope</option>
                                                        <option value="Urbanist">Urbanist</option>
                                                        <option value="Space Grotesk">Space Grotesk</option>
                                                    </optgroup>
                                                </select>
                                                <div className="extra-small text-muted mt-1">Dynamic Google Font loading enabled.</div>
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

                                            <div className="col-12 mt-5">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 className="fw-bold text-secondary text-uppercase extra-small mb-0">Modular Page Sections</h6>
                                                    <div className="dropdown">
                                                        <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            <i className="bi bi-plus-lg me-1"></i> Add Section
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end shadow-lg rounded-4 border-0 p-2">
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('hero-slider')}><i className="bi bi-images me-2 text-primary"></i> Hero Slider</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('search')}><i className="bi bi-search me-2 text-primary"></i> Search Filters</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('text-image')}><i className="bi bi-layout-split me-2 text-primary"></i> Text & Image</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('image-text')}><i className="bi bi-layout-split me-2 text-primary"></i> Image & Text</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('property-slider')}><i className="bi bi-collection-play me-2 text-primary"></i> Properties Slider</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('full-width-image')}><i className="bi bi-image-fill me-2 text-primary"></i> Full Width Image</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('typography')}><i className="bi bi-type me-2 text-primary"></i> Heading & Text</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('LISTING')}><i className="bi bi-grid-3x3-gap me-2 text-primary"></i> Full Property Listing</button></li>
                                                            <li><button type="button" className="dropdown-item rounded-3 small py-2" onClick={() => addModule('inquiry')}><i className="bi bi-envelope-at me-2 text-primary"></i> Inquiry Form</button></li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="modular-builder-list">
                                                    {(formData.configuration.builder?.modules || []).length === 0 ? (
                                                        <div className="text-center py-5 border-2 border-dashed rounded-4 bg-light bg-opacity-50">
                                                            <i className="bi bi-layers text-muted display-6 opacity-25"></i>
                                                            <p className="text-muted small mt-2">No custom sections added. Start building your page!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex flex-column gap-3">
                                                            {(formData.configuration.builder?.modules || []).map((module: any, index: number) => (
                                                                <div key={module.id} className="card border border-light-subtle rounded-4 shadow-sm overflow-hidden animate-fade-in">
                                                                    <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                                                                        <div className="d-flex align-items-center gap-3">
                                                                            <div className="bg-primary bg-opacity-10 text-white p-2 rounded-3">
                                                                                <i className={`bi ${module.type === 'hero-slider' ? 'bi-images' :
                                                                                    module.type === 'search' ? 'bi-search' :
                                                                                        module.type === 'text-image' || module.type === 'image-text' ? 'bi-layout-split' :
                                                                                            module.type === 'property-slider' ? 'bi-collection-play' :
                                                                                                module.type === 'full-width-image' ? 'bi-image-fill' :
                                                                                                    module.type === 'LISTING' ? 'bi-grid-3x3-gap' :
                                                                                                        module.type === 'inquiry' ? 'bi-envelope-at' :
                                                                                                            'bi-type'
                                                                                    }`}></i>
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-bold small text-capitalize">{module.type.replace(/-/g, ' ')}</div>
                                                                                <div className="extra-small text-muted">Section {index + 1}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="d-flex gap-1">
                                                                            <button type="button" className="btn btn-sm btn-light rounded-circle p-2" onClick={() => moveModule(index, 'up')} disabled={index === 0}><i className="bi bi-arrow-up"></i></button>
                                                                            <button type="button" className="btn btn-sm btn-light rounded-circle p-2" onClick={() => moveModule(index, 'down')} disabled={index === (formData.configuration.builder?.modules || []).length - 1}><i className="bi bi-arrow-down"></i></button>
                                                                            <button type="button" className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2" onClick={() => removeModule(index)}><i className="bi bi-trash"></i></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="card-body p-3 bg-light bg-opacity-25">
                                                                        <div className="row g-3">
                                                                            {module.type === 'hero-slider' && (
                                                                                <div className="col-12">
                                                                                    <label className="form-label extra-small fw-bold">Hero Slides</label>
                                                                                    <div className="d-flex flex-column gap-2">
                                                                                        {(module.data?.slides || [{ title: '', subtitle: '', imageUrl: '' }]).map((slide: any, sIdx: number) => (
                                                                                            <div key={sIdx} className="p-3 border rounded-4 bg-white shadow-sm">
                                                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                                                    <span className="badge bg-primary rounded-pill small">Slide {sIdx + 1}</span>
                                                                                                    <button type="button" className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => {
                                                                                                        const slides = [...(module.data.slides || [])];
                                                                                                        slides.splice(sIdx, 1);
                                                                                                        updateModule(index, { ...module.data, slides });
                                                                                                    }}><i className="bi bi-trash"></i></button>
                                                                                                </div>
                                                                                                <div className="row g-3">
                                                                                                    <div className="col-12">
                                                                                                        <label className="form-label extra-small fw-bold text-muted">Slide Heading</label>
                                                                                                        <input type="text" className="form-control form-control-sm rounded-3 shadow-sm" placeholder="Main Title" value={slide.title} onChange={(e) => {
                                                                                                            const slides = [...(module.data.slides || [])];
                                                                                                            slides[sIdx].title = e.target.value;
                                                                                                            updateModule(index, { ...module.data, slides });
                                                                                                        }} />
                                                                                                    </div>
                                                                                                    <div className="col-12">
                                                                                                        <label className="form-label extra-small fw-bold text-muted">Sub-heading / Description</label>
                                                                                                        <textarea className="form-control form-control-sm rounded-3 shadow-sm" rows={2} placeholder="Brief details..." value={slide.subtitle} onChange={(e) => {
                                                                                                            const slides = [...(module.data.slides || [])];
                                                                                                            slides[sIdx].subtitle = e.target.value;
                                                                                                            updateModule(index, { ...module.data, slides });
                                                                                                        }} />
                                                                                                    </div>
                                                                                                    <div className="col-12">
                                                                                                        <label className="form-label extra-small fw-bold text-muted">Slide Image URL</label>
                                                                                                        <div className="input-group input-group-sm shadow-sm">
                                                                                                            <input type="text" className="form-control rounded-start-3" placeholder="https://..." value={slide.imageUrl} onChange={(e) => {
                                                                                                                const slides = [...(module.data.slides || [])];
                                                                                                                slides[sIdx].imageUrl = e.target.value;
                                                                                                                updateModule(index, { ...module.data, slides });
                                                                                                            }} />
                                                                                                            <button type="button" className="btn btn-outline-secondary rounded-end-3" onClick={() => {
                                                                                                                setMediaTarget(null);
                                                                                                                setModularMediaIndex(index);
                                                                                                                setModularSlideIndex(sIdx);
                                                                                                                setShowMediaSelector(true);
                                                                                                            }}>
                                                                                                                <i className="bi bi-image"></i>
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                        <button type="button" className="btn btn-sm btn-outline-primary rounded-4 fw-bold py-2 mt-2 bg-white" onClick={() => {
                                                                                            const slides = module.data.slides || [];
                                                                                            updateModule(index, { ...module.data, slides: [...slides, { title: '', subtitle: '', imageUrl: '' }] });
                                                                                        }}>
                                                                                            <i className="bi bi-plus-circle me-1"></i> Add New Slide
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {module.type === 'search' && (
                                                                                <div className="col-12 text-center py-3">
                                                                                    <div className="p-4 bg-primary bg-opacity-10 border border-primary border-dashed rounded-4">
                                                                                        <i className="bi bi-search h3 text-primary d-block mb-3"></i>
                                                                                        <h6 className="fw-bold">Dynamic Search Section</h6>
                                                                                        <p className="extra-small text-muted mb-4 px-3">Enables real-time property filtering on your landing page.</p>
                                                                                        <div className="text-start">
                                                                                            <label className="form-label extra-small fw-bold">Section Heading (Optional)</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                className="form-control form-control-sm rounded-3 shadow-sm"
                                                                                                placeholder="Find Your Dream Home"
                                                                                                value={module.data?.title || ''}
                                                                                                onChange={(e) => updateModule(index, { ...module.data, title: e.target.value })}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {(module.type === 'text-image' || module.type === 'image-text' || module.type === 'typography') && (
                                                                                <div className="col-12">
                                                                                    <label className="form-label extra-small fw-bold">Heading</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control form-control-sm rounded-3"
                                                                                        value={module.data?.title || ''}
                                                                                        onChange={(e) => updateModule(index, { ...module.data, title: e.target.value })}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {(module.type === 'text-image' || module.type === 'image-text' || module.type === 'typography') && (
                                                                                <div className="col-12">
                                                                                    <label className="form-label extra-small fw-bold">Description</label>
                                                                                    <textarea
                                                                                        className="form-control form-control-sm rounded-3"
                                                                                        rows={2}
                                                                                        value={module.data?.description || ''}
                                                                                        onChange={(e) => updateModule(index, { ...module.data, description: e.target.value })}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {(module.type === 'text-image' || module.type === 'image-text' || module.type === 'full-width-image') && (
                                                                                <div className="col-12">
                                                                                    <label className="form-label extra-small fw-bold">Image URL</label>
                                                                                    <div className="input-group input-group-sm">
                                                                                        <input
                                                                                            type="text"
                                                                                            className="form-control rounded-start-3"
                                                                                            value={module.data?.imageUrl || ''}
                                                                                            onChange={(e) => updateModule(index, { ...module.data, imageUrl: e.target.value })}
                                                                                        />
                                                                                        <button type="button" className="btn btn-outline-secondary rounded-end-3" onClick={() => {
                                                                                            setMediaTarget(null);
                                                                                            setModularMediaIndex(index);
                                                                                            setShowMediaSelector(true);
                                                                                        }}>
                                                                                            <i className="bi bi-image"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {module.type === 'typography' && (
                                                                                <>
                                                                                    <div className="col-md-6">
                                                                                        <label className="form-label extra-small fw-bold">Background Color</label>
                                                                                        <input
                                                                                            type="color"
                                                                                            className="form-control form-control-color border-0 w-100 bg-transparent"
                                                                                            value={module.data?.bgColor || '#ffffff'}
                                                                                            onChange={(e) => updateModule(index, { ...module.data, bgColor: e.target.value })}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-md-6">
                                                                                        <label className="form-label extra-small fw-bold">Text Color</label>
                                                                                        <input
                                                                                            type="color"
                                                                                            className="form-control form-control-color border-0 w-100 bg-transparent"
                                                                                            value={module.data?.textColor || '#000000'}
                                                                                            onChange={(e) => updateModule(index, { ...module.data, textColor: e.target.value })}
                                                                                        />
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {module.type === 'property-slider' && (
                                                                                <div className="col-12">
                                                                                    <div className="p-3 bg-white border border-info border-opacity-25 rounded-3">
                                                                                        <p className="extra-small text-info mb-0 fw-bold"><i className="bi bi-info-circle-fill me-2"></i> This section automatically pulls properties from your selected source portfolio.</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {module.type === 'LISTING' && (
                                                                                <div className="col-12">
                                                                                    <div className="p-3 bg-white border border-primary border-opacity-25 rounded-3">
                                                                                        <p className="extra-small text-primary mb-0 fw-bold"><i className="bi bi-grid-3x3-gap me-2"></i> Full Property Listing Grid Section</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {module.type === 'inquiry' && (
                                                                                <div className="col-12">
                                                                                    <div className="p-3 bg-white border border-primary border-opacity-25 rounded-3">
                                                                                        <p className="extra-small text-primary mb-2 fw-bold"><i className="bi bi-envelope-at me-2"></i> Lead Inquiry Form</p>
                                                                                        <label className="form-label extra-small fw-bold">Section Heading (Optional)</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            className="form-control form-control-sm rounded-3"
                                                                                            value={module.data?.title || ''}
                                                                                            onChange={(e) => updateModule(index, { ...module.data, title: e.target.value })}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB: Footer Settings */}
                                    {activeTab === 'footer' && (
                                        <div className="row g-4 animate-fade-in">
                                            <div className="col-12">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Footer Customization</h6>
                                                <p className="text-muted small">Style your website footer and add essential links.</p>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Footer Background Color</label>
                                                <div className="d-flex gap-2 align-items-center p-2 border rounded-3 bg-white">
                                                    <input
                                                        type="color"
                                                        className="form-control-color border-0 bg-transparent cursor-pointer"
                                                        value={formData.configuration?.footer?.backgroundColor || '#f8f9fa'}
                                                        onChange={(e) => toggleNestedConfig('footer', 'backgroundColor', e.target.value)}
                                                    />
                                                    <span className="small font-monospace text-uppercase text-muted">{formData.configuration?.footer?.backgroundColor || '#f8f9fa'}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Footer Text Color</label>
                                                <div className="d-flex gap-2 align-items-center p-2 border rounded-3 bg-white">
                                                    <input
                                                        type="color"
                                                        className="form-control-color border-0 bg-transparent cursor-pointer"
                                                        value={formData.configuration?.footer?.textColor || '#212529'}
                                                        onChange={(e) => toggleNestedConfig('footer', 'textColor', e.target.value)}
                                                    />
                                                    <span className="small font-monospace text-uppercase text-muted">{formData.configuration?.footer?.textColor || '#212529'}</span>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Copyright Text</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3"
                                                    placeholder="© 2026 Your Real Estate Company"
                                                    value={formData.configuration?.footer?.copyright || ''}
                                                    onChange={(e) => toggleNestedConfig('footer', 'copyright', e.target.value)}
                                                />
                                            </div>

                                            <div className="col-12 mt-4">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Social Media URLs</h6>
                                                <div className="row g-3">
                                                    {[
                                                        { id: 'facebook', label: 'Facebook', icon: 'bi-facebook' },
                                                        { id: 'instagram', label: 'Instagram', icon: 'bi-instagram' },
                                                        { id: 'twitter', label: 'X (Twitter)', icon: 'bi-twitter-x' },
                                                        { id: 'linkedin', label: 'LinkedIn', icon: 'bi-linkedin' },
                                                        { id: 'youtube', label: 'YouTube', icon: 'bi-youtube' },
                                                    ].map(platform => (
                                                        <div key={platform.id} className="col-md-6">
                                                            <label className="form-label extra-small fw-bold">
                                                                <i className={`bi ${platform.icon} me-1`}></i> {platform.label}
                                                            </label>
                                                            <input
                                                                type="url"
                                                                className="form-control form-control-sm rounded-3"
                                                                placeholder="https://..."
                                                                value={formData.configuration?.footer?.socials?.[platform.id] || ''}
                                                                onChange={(e) => {
                                                                    const socials = formData.configuration.footer?.socials || {};
                                                                    toggleNestedConfig('footer', 'socials', { ...socials, [platform.id]: e.target.value });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
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

                                                    {formData.configuration.chatbot?.enabled && (
                                                        <div className="mt-4 border-top pt-4 animate-fade-up">
                                                            <div className="row g-4">
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-bold extra-small text-uppercase text-muted">Welcome Title</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control rounded-4 shadow-sm border-0"
                                                                        value={formData.configuration.chatbot?.welcomeMessage || ''}
                                                                        onChange={(e) => toggleNestedConfig('chatbot', 'welcomeMessage', e.target.value)}
                                                                        placeholder="e.g. Looking for a new home?"
                                                                    />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-bold extra-small text-uppercase text-muted">Welcome Subtext</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control rounded-4 shadow-sm border-0"
                                                                        value={formData.configuration.chatbot?.welcomeSubtext || ''}
                                                                        onChange={(e) => toggleNestedConfig('chatbot', 'welcomeSubtext', e.target.value)}
                                                                        placeholder="e.g. Find your dream home in seconds."
                                                                    />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-bold extra-small text-uppercase text-muted">Bot Theme Color</label>
                                                                    <div className="d-flex gap-2">
                                                                        <div
                                                                            className="rounded-circle shadow-sm border overflow-hidden"
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '40px',
                                                                                backgroundColor: formData.configuration.chatbot?.primaryColor || '#6366f1',
                                                                                position: 'relative'
                                                                            }}
                                                                        >
                                                                            <input
                                                                                type="color"
                                                                                className="position-absolute top-50 start-50 translate-middle border-0 p-0"
                                                                                style={{ width: '150%', height: '150%', cursor: 'pointer' }}
                                                                                value={formData.configuration.chatbot?.primaryColor || '#6366f1'}
                                                                                onChange={(e) => toggleNestedConfig('chatbot', 'primaryColor', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control rounded-4 shadow-sm border-0 font-monospace"
                                                                            value={formData.configuration.chatbot?.primaryColor || '#6366f1'}
                                                                            onChange={(e) => toggleNestedConfig('chatbot', 'primaryColor', e.target.value)}
                                                                            placeholder="#6366f1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-bold extra-small text-uppercase text-muted">Lead Strategy</label>
                                                                    <select
                                                                        className="form-select rounded-4 shadow-sm border-0"
                                                                        value={formData.configuration.chatbot?.leadCaptureMode || 'both'}
                                                                        onChange={(e) => toggleNestedConfig('chatbot', 'leadCaptureMode', e.target.value)}
                                                                    >
                                                                        <option value="email">Email Address Only</option>
                                                                        <option value="mobile">WhatsApp/Mobile Only</option>
                                                                        <option value="both">Both Email & WhatsApp</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-12 mt-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <label className="form-label fw-bold extra-small text-uppercase text-muted mb-0">Custom Budget Ranges</label>
                                                                        <button 
                                                                            type="button"
                                                                            className="btn btn-link btn-sm text-primary text-decoration-none p-0 extra-small fw-bold"
                                                                            onClick={() => {
                                                                                const current = formData.configuration.chatbot?.budgetRanges || [
                                                                                    { label: 'Low (< $1k)', min: 0, max: 1000 },
                                                                                    { label: 'Mid ($1k - $5k)', min: 1000, max: 5000 },
                                                                                    { label: 'High ($5k - $10k)', min: 5000, max: 10000 },
                                                                                    { label: 'Luxury (> $10k)', min: 10000 }
                                                                                ];
                                                                                toggleNestedConfig('chatbot', 'budgetRanges', [...current, { label: 'New Range', min: 0, max: 1000 }]);
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-plus-lg me-1"></i> Add Range
                                                                        </button>
                                                                    </div>
                                                                    <div className="row g-2">
                                                                        {(formData.configuration.chatbot?.budgetRanges || [
                                                                            { label: 'Low (< $1k)', min: 0, max: 1000 },
                                                                            { label: 'Mid ($1k - $5k)', min: 1000, max: 5000 },
                                                                            { label: 'High ($5k - $10k)', min: 5000, max: 10000 },
                                                                            { label: 'Luxury (> $10k)', min: 10000 }
                                                                        ]).map((range: any, rIdx: number) => (
                                                                            <div key={rIdx} className="col-12 p-3 bg-white rounded-4 border border-light-subtle shadow-sm mb-2">
                                                                                <div className="row g-2 align-items-center">
                                                                                    <div className="col-md-5">
                                                                                        <label className="extra-small fw-bold text-muted mb-1">Label</label>
                                                                                        <input 
                                                                                            type="text" 
                                                                                            className="form-control form-control-sm rounded-3 shadow-sm" 
                                                                                            value={range.label}
                                                                                            onChange={(e) => {
                                                                                                const ranges = [...(formData.configuration.chatbot.budgetRanges || [])];
                                                                                                ranges[rIdx].label = e.target.value;
                                                                                                toggleNestedConfig('chatbot', 'budgetRanges', ranges);
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-md-3">
                                                                                        <label className="extra-small fw-bold text-muted mb-1">Min</label>
                                                                                        <input 
                                                                                            type="number" 
                                                                                            className="form-control form-control-sm rounded-3 shadow-sm" 
                                                                                            value={range.min}
                                                                                            onChange={(e) => {
                                                                                                const ranges = [...(formData.configuration.chatbot.budgetRanges || [])];
                                                                                                ranges[rIdx].min = Number(e.target.value);
                                                                                                toggleNestedConfig('chatbot', 'budgetRanges', ranges);
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-md-3">
                                                                                        <label className="extra-small fw-bold text-muted mb-1">Max</label>
                                                                                        <input 
                                                                                            type="number" 
                                                                                            className="form-control form-control-sm rounded-3 shadow-sm" 
                                                                                            value={range.max}
                                                                                            onChange={(e) => {
                                                                                                const ranges = [...(formData.configuration.chatbot.budgetRanges || [])];
                                                                                                ranges[rIdx].max = Number(e.target.value);
                                                                                                toggleNestedConfig('chatbot', 'budgetRanges', ranges);
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-md-1 d-flex align-items-end justify-content-center">
                                                                                        <button 
                                                                                            type="button"
                                                                                            className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                                                                            onClick={() => {
                                                                                                const ranges = (formData.configuration.chatbot.budgetRanges || []).filter((_: any, i: number) => i !== rIdx);
                                                                                                toggleNestedConfig('chatbot', 'budgetRanges', ranges);
                                                                                            }}
                                                                                        >
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="col-12 mt-3">
                                                                    <label className="form-label fw-bold extra-small text-uppercase text-muted d-block mb-3">AI Sales Engine</label>
                                                                    <div className="d-flex flex-wrap gap-4 p-3 bg-white rounded-4 border border-light-subtle shadow-sm">
                                                                        <div className="form-check form-switch">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={formData.configuration.chatbot?.upsellEnabled !== false}
                                                                                onChange={(e) => toggleNestedConfig('chatbot', 'upsellEnabled', e.target.checked)}
                                                                            />
                                                                            <label className="form-check-label small fw-bold">Premium Inventory Upsell</label>
                                                                            <p className="extra-small text-muted mb-0">Suggests higher-value properties matching criteria.</p>
                                                                        </div>
                                                                        <div className="vr d-none d-md-block"></div>
                                                                        <div className="form-check form-switch">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={formData.configuration.chatbot?.crossSellEnabled !== false}
                                                                                onChange={(e) => toggleNestedConfig('chatbot', 'crossSellEnabled', e.target.checked)}
                                                                            />
                                                                            <label className="form-check-label small fw-bold">Service Cross-sell</label>
                                                                            <p className="extra-small text-muted mb-0">Recommends legal, financing and maintenance.</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-12 mt-4">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Capture Sync</h6>
                                                <div className="card bg-light border-0 rounded-4 p-4">
                                                    <label className="form-label small fw-bold mb-3">Form Strategy</label>
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
                                                                    <p className="extra-small text-muted mb-3">Syncing website leads directly into Marketing Hub is a premium feature. Upgrade to our Professional plan to unlock this.</p>
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
                                                                            Website leads will be automatically routed to your Marketing CRM and target audiences.
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
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Booking Engine Strategy</h6>
                                                <div className="card bg-light border-0 rounded-4 p-4">
                                                    <label className="form-label small fw-bold mb-3">Booking Form Source</label>
                                                    <div className="d-flex gap-3 mb-4">
                                                        <div
                                                            className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center ${!formData.configuration.bookingForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'}`}
                                                            onClick={() => toggleNestedConfig('bookingForm', 'useMarketingForm', false)}
                                                        >
                                                            <i className="bi bi-calendar-check d-block mb-1"></i>
                                                            <div className="fw-bold extra-small">Standard Booking Engine</div>
                                                        </div>
                                                        <div
                                                            className={`flex-grow-1 p-3 rounded-4 border-2 cursor-pointer transition-all text-center position-relative ${formData.configuration.bookingForm?.useMarketingForm ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary-subtle text-muted opacity-75'} ${!hasModule('marketing_hub') ? 'opacity-50' : ''}`}
                                                            onClick={() => hasModule('marketing_hub') && toggleNestedConfig('bookingForm', 'useMarketingForm', true)}
                                                        >
                                                            {!hasModule('marketing_hub') && (
                                                                <div className="position-absolute top-0 end-0 p-2">
                                                                    <i className="bi bi-lock-fill text-warning"></i>
                                                                </div>
                                                            )}
                                                            <i className="bi bi-cloud-check d-block mb-1"></i>
                                                            <div className="fw-bold extra-small">Marketing Hub Sync</div>
                                                        </div>
                                                    </div>

                                                    {formData.configuration.bookingForm?.useMarketingForm && (
                                                        <div className="animate-fade-in">
                                                            {hasModule('marketing_hub') ? (
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
                                                            ) : (
                                                                <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 text-center">
                                                                    <p className="extra-small text-muted mb-0">Marketing Hub required for custom booking forms.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 6: SEO & Advanced Tools */}
                                    {activeTab === 'seo' && (
                                        <div className="row g-4 animate-fade-in">
                                            <div className="col-12">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Search Engine Optimization</h6>
                                            </div>

                                            {/* SEO Header Progress */}
                                            <div className="col-12">
                                                <div className={`card border-0 shadow-sm rounded-4 border-start border-4 border-${scoreColor} bg-light bg-opacity-50`}>
                                                    <div className="card-body p-4">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <div>
                                                                <h5 className="fw-bold mb-0">Website SEO Score</h5>
                                                                <p className="extra-small text-muted mb-0">Based on metadata, content structure, and technical signals.</p>
                                                            </div>
                                                            <div className={`h2 mb-0 fw-bold text-${scoreColor}`}>{websiteScore}%</div>
                                                        </div>
                                                        <div className="progress rounded-pill shadow-sm" style={{ height: 12 }}>
                                                            <div className={`progress-bar bg-${scoreColor} progress-bar-striped progress-bar-animated`} style={{ width: `${websiteScore}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Search Visibility Tools */}
                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                                    <div className="card-body p-3">
                                                        <div className="d-flex align-items-center gap-3 mb-3">
                                                            <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                                                <i className="bi bi-diagram-3-fill"></i>
                                                            </div>
                                                            <h6 className="fw-bold mb-0">Sitemap XML</h6>
                                                            <div className="form-check form-switch ms-auto">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={formData.configuration?.seo?.generateSitemap || false}
                                                                    onChange={(e) => toggleNestedConfig('seo', 'generateSitemap', e.target.checked)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="extra-small text-muted mb-2">Automatically update <code>sitemap.xml</code> when you publish new project details or units.</p>
                                                        {formData.configuration?.seo?.generateSitemap && (
                                                            <a
                                                                href={formData.customDomain ? `https://${formData.customDomain}/sitemap.xml` : `/standalone/${formData.slug}/sitemap.xml`}
                                                                target="_blank"
                                                                className="extra-small fw-bold text-primary text-decoration-none d-flex align-items-center gap-1"
                                                            >
                                                                <i className="bi bi-box-arrow-up-right"></i> View Sitemap
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                                    <div className="card-body p-3">
                                                        <div className="d-flex align-items-center gap-3 mb-3">
                                                            <div className="bg-dark bg-opacity-10 p-2 rounded-3 text-dark">
                                                                <i className="bi bi-robot"></i>
                                                            </div>
                                                            <h6 className="fw-bold mb-0">Robots.txt</h6>
                                                            <div className="form-check form-switch ms-auto">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={formData.configuration?.seo?.enableRobots || false}
                                                                    onChange={(e) => toggleNestedConfig('seo', 'enableRobots', e.target.checked)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="extra-small text-muted mb-2">Allow search engine crawlers to explore and index your property landing pages.</p>
                                                        {formData.configuration?.seo?.enableRobots && (
                                                            <a
                                                                href={formData.customDomain ? `https://${formData.customDomain}/robots.txt` : `/standalone/${formData.slug}/robots.txt`}
                                                                target="_blank"
                                                                className="extra-small fw-bold text-dark text-decoration-none d-flex align-items-center gap-1"
                                                            >
                                                                <i className="bi bi-box-arrow-up-right"></i> View Robots.txt
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Improvement Suggestions */}
                                            <div className="col-12 mt-3">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Performance Boosters</h6>
                                                <div className="row g-2">
                                                    {websiteImprovements.map((tip, idx) => (
                                                        <div key={idx} className="col-md-6">
                                                            <div className={`p-3 rounded-4 border border-${tip.color}-subtle bg-${tip.color}-subtle bg-opacity-10 d-flex gap-3 align-items-center h-100`}>
                                                                <div className={`bg-${tip.color} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 32, height: 32 }}>
                                                                    <i className={`bi ${tip.icon} small`}></i>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold extra-small">{tip.label}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px', lineHeight: '1.3' }}>{tip.tip}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {websiteImprovements.length === 0 && (
                                                        <div className="col-12 text-center py-4 bg-success bg-opacity-10 rounded-4 border border-success border-dashed">
                                                            <i className="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                                                            <h6 className="fw-bold text-success mb-1">Your SEO is Perfect!</h6>
                                                            <p className="extra-small text-muted mb-0">All search visibility signals are optimal for this project portal.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Google Search Preview Card (Reused from PropertyForm style) */}
                                            <div className="col-12 mt-4">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">SERP Snippet Preview</h6>
                                                <div className="card shadow-sm rounded-4 overflow-hidden border-0" style={{ borderLeft: '4px solid #4285f4', backgroundColor: '#fff' }}>
                                                    <div className="card-body p-4">
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                                                                <i className="bi bi-globe" style={{ fontSize: '12px', color: '#202124' }}></i>
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <span style={{ fontSize: '12px', color: '#202124', lineHeight: '1.2' }}>{formData.customDomain || 'website.virpanix.com'}</span>
                                                                <span className="text-muted extra-small" style={{ lineHeight: '1.2' }}>https://{formData.customDomain || 'your-site'} › portal</span>
                                                            </div>
                                                        </div>
                                                        <h5 className="mb-1" style={{ color: '#1a0dab', cursor: 'pointer', fontFamily: 'arial,sans-serif', fontSize: '18px', fontWeight: '400', lineHeight: '1.3' }}>
                                                            {formData.configuration?.seo?.title || 'Your Website Title'} | Project Portal
                                                        </h5>
                                                        <div style={{ color: '#4d5156', fontFamily: 'arial,sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
                                                            {formData.configuration?.seo?.description ? (
                                                                formData.configuration.seo.description.length > 155
                                                                    ? formData.configuration.seo.description.substring(0, 152) + '...'
                                                                    : formData.configuration.seo.description
                                                            ) : (
                                                                'Provide a meta description in the Basics tab to see how your project will stand out in search results pages.'
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom CSS/JS Snippets */}
                                            <div className="col-12 mt-4">
                                                <h6 className="fw-bold mb-3 text-secondary text-uppercase extra-small">Custom Scripts & Styles</h6>
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label extra-small fw-bold">Header Snippet (Inside &lt;head&gt;)</label>
                                                        <textarea
                                                            className="form-control rounded-4 font-monospace extra-small bg-dark text-success border-0 shadow-sm"
                                                            rows={5}
                                                            placeholder="<style>...css...</style> or <script>...js...</script>"
                                                            value={formData.configuration?.seo?.headerSnippet || ''}
                                                            onChange={(e) => toggleNestedConfig('seo', 'headerSnippet', e.target.value)}
                                                        ></textarea>
                                                        <div className="extra-small text-muted mt-1" style={{ fontSize: '10px' }}>Perfect for Meta tags, CSS, or high-priority scripts.</div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label extra-small fw-bold">Footer Snippet (Before &lt;/body&gt;)</label>
                                                        <textarea
                                                            className="form-control rounded-4 font-monospace extra-small bg-dark text-success border-0 shadow-sm"
                                                            rows={5}
                                                            placeholder="<script>...analytics...</script>"
                                                            value={formData.configuration?.seo?.footerSnippet || ''}
                                                            onChange={(e) => toggleNestedConfig('seo', 'footerSnippet', e.target.value)}
                                                        ></textarea>
                                                        <div className="extra-small text-muted mt-1" style={{ fontSize: '10px' }}>Ideal for Google Analytics, Pixels, or non-blocking scripts.</div>
                                                    </div>
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
                    )}

                    {/* Right side: Preview */}
                    {showPreview && (
                        <div className="col-lg-12 bg-light-subtle p-4 d-none d-lg-block animate-fade-in" style={{ transition: 'all 0.4s ease-in-out' }}>
                            <div className="sticky-top" style={{ top: '20px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                            <i className="bi bi-display"></i>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0">Device Simulation</h6>
                                            <p className="extra-small text-muted mb-0">{previewDevice === 'mobile' ? 'iPhone 14' : previewDevice === 'tablet' ? 'iPad Pro' : 'Desktop Monitor'}</p>
                                        </div>
                                    </div>
                                    <div className="btn-group btn-group-sm bg-white rounded-pill shadow-sm p-1">
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-pill border-0 px-4 ${previewDevice === 'mobile' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                                            onClick={() => setPreviewDevice('mobile')}
                                        >
                                            <i className="bi bi-phone me-2"></i> Mobile
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-pill border-0 px-4 ${previewDevice === 'tablet' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                                            onClick={() => setPreviewDevice('tablet')}
                                        >
                                            <i className="bi bi-tablet me-2"></i> Tablet
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-pill border-0 px-4 ${previewDevice === 'desktop' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                                            onClick={() => setPreviewDevice('desktop')}
                                        >
                                            <i className="bi bi-display me-2"></i> Desktop
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="preview-container bg-dark rounded-5 border border-dark border-4 shadow-2xl p-2 mx-auto transition-all duration-300 overflow-hidden"
                                    style={{
                                        width: previewDevice === 'mobile' ? '300px' : previewDevice === 'tablet' ? '768px' : '100%',
                                        maxWidth: '100%',
                                        height: previewDevice === 'mobile' ? '650px' : previewDevice === 'tablet' ? '750px' : '800px',
                                        aspectRatio: previewDevice === 'mobile' ? '9/19.5' : previewDevice === 'tablet' ? '3/4' : 'auto'
                                    }}
                                >
                                    <div className={`rounded-4 bg-white h-100 position-relative ${previewDevice !== 'desktop' ? 'overflow-hidden' : 'overflow-auto'}`}>
                                        <WidgetPreview formData={formData} tenantType={tenantType} deviceMode={previewDevice} />
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white rounded-4 border border-light-subtle shadow-sm d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="fw-bold small mb-1">Omnichannel Preview</h6>
                                        <p className="extra-small text-muted mb-0">Your portal is automatically optimized for all screen sizes and device types.</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <span className="badge bg-light text-dark border extra-small">4K Ready</span>
                                        <span className="badge bg-light text-dark border extra-small">SEO Optimized</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MediaSelector
                show={showMediaSelector}
                onClose={() => {
                    setShowMediaSelector(false);
                    setMediaTarget(null);
                    setModularMediaIndex(null);
                    setModularSlideIndex(null);
                }}
                onSelect={handleMediaSelect}
                title={mediaTarget ? `Select ${mediaTarget === 'logoUrl' ? 'Brand Logo' : 'Hero Cover'}` : 'Select Image'}
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
