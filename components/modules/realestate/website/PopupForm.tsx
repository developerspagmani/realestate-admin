'use client';

import { useState, useEffect } from 'react';
import { WebsitePopup, Website, MarketingForm } from '@/types';
import { popupService, getAuthToken } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Toast from '@/components/common/Toast';
import MediaSelector from '@/components/shared/MediaSelector';

interface PopupFormProps {
    popup: WebsitePopup | null;
    websites: Website[];
    marketingForms: MarketingForm[];
    onClose: () => void;
    onSuccess: () => void;
    mode: 'admin' | 'owner';
}

const INITIAL_POPUP_DATA: Partial<WebsitePopup> = {
    name: '',
    websiteId: '',
    type: 'modal',
    trigger: 'on_load',
    triggerValue: '',
    content: {
        title: '',
        body: '',
        imageUrl: '',
        ctaText: '',
        ctaUrl: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#0d6efd',
        buttonTextColor: '#ffffff',
        layout: 'stacked',
        textAlign: 'center',
        showFloatingTrigger: false,
        emailEnabled: false,
        mobileEnabled: false,
        autoDownload: false,
        inputBorderColor: '#dee2e6',
        inputBorderRadius: '30px',
        inputBackgroundColor: '#ffffff',
        buttonBorderRadius: '30px',
        buttonBorderColor: '#0d6efd',
        buttonBorderWidth: '0px',
        width: 'medium',
        height: 'auto',
        thankYouTitle: 'Success!',
        thankYouBody: "Thank you for your interest. We'll be in touch soon."
    },
    isActive: true
};

export default function PopupForm({ popup, websites, marketingForms, onClose, onSuccess, mode }: PopupFormProps) {
    const { user } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const [formData, setFormData] = useState<Partial<WebsitePopup>>(INITIAL_POPUP_DATA);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'design' | 'behavior'>('basic');
    const [designSubTab, setDesignSubTab] = useState<'layout' | 'fields' | 'buttons'>('layout');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    const [showMediaSelector, setShowMediaSelector] = useState(false);

    useEffect(() => {
        if (popup) {
            setFormData(popup);
        } else if (websites.length > 0) {
            setFormData(prev => ({ ...prev, websiteId: websites[0].id }));
        }
    }, [popup, websites]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('content.')) {
            const contentKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                content: {
                    ...prev.content,
                    [contentKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMediaSelect = (selectedMedia: any) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                imageUrl: selectedMedia.url
            }
        }));
        setShowMediaSelector(false);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            setSubmitting(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
            const finalData = { ...formData, tenantId };

            let response;
            if (popup) {
                response = await popupService.updatePopup(token, popup.id, finalData, tenantId);
            } else {
                response = await popupService.createPopup(token, finalData);
            }

            if (response.success) {
                onSuccess();
            } else {
                showToast(response.message || 'Failed to save popup', 'error');
            }
        } catch (error) {
            console.error('Failed to save popup:', error);
            showToast('Error saving popup', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderPreview = () => {
        const {
            title, body, imageUrl, ctaText, backgroundColor, textColor,
            buttonColor, buttonTextColor, marketingFormId, layout, textAlign,
            emailEnabled, mobileEnabled, inputBorderColor, inputBorderRadius,
            inputBackgroundColor, buttonBorderRadius, buttonBorderColor, buttonBorderWidth
        } = formData.content || {};
        const isBanner = formData.type === 'banner';
        const isSlideIn = formData.type === 'slide_in';
        const isSplit = layout === 'split' && !isBanner;
        const alignClass = textAlign === 'left' ? 'text-start' : textAlign === 'right' ? 'text-end' : 'text-center';

        return (
            <div className="preview-container h-100 d-flex flex-column align-items-center justify-content-center p-4 bg-light">
                <div className="text-center mb-4">
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                        <i className="bi bi-eye me-2"></i>Live Dashboard Preview
                    </span>
                </div>

                <div
                    className={`preview-box shadow-lg transition-all ${isSplit ? 'd-flex' : 'block'}`}
                    style={{
                        backgroundColor: backgroundColor || '#ffffff',
                        color: textColor || '#000000',
                        borderRadius: isBanner ? '0' : (isSlideIn ? '16px' : '24px'),
                        overflow: 'hidden',
                        maxWidth: formData.content?.width === 'small' ? '350px' : formData.content?.width === 'large' ? '800px' : '500px',
                        minHeight: formData.content?.height === 'small' ? '300px' : formData.content?.height === 'medium' ? '450px' : formData.content?.height === 'large' ? '600px' : 'auto',
                        border: '1px solid rgba(0,0,0,0.05)',
                        width: '100%'
                    }}
                >
                    {imageUrl && (
                        <div className={`${isSplit ? 'col-6' : 'w-100'} preview-image`} style={{ height: isSplit ? '100%' : 'auto' }}>
                            <img
                                src={imageUrl}
                                alt=""
                                className="w-100"
                                style={{
                                    height: isSplit ? '100%' : (formData.content?.height === 'small' ? '120px' : formData.content?.height === 'medium' ? '180px' : formData.content?.height === 'large' ? '250px' : '150px'),
                                    maxHeight: isSplit ? 'none' : '100%',
                                    objectFit: 'cover',
                                    minHeight: isSplit ? (formData.content?.height === 'small' ? '300px' : formData.content?.height === 'medium' ? '450px' : formData.content?.height === 'large' ? '600px' : '300px') : '0'
                                }}
                            />
                        </div>
                    )}
                    <div className={`${isSplit && imageUrl ? 'col-6' : 'w-100'} p-4 ${alignClass} d-flex flex-column justify-content-center`}>
                        <h4 className="fw-bold mb-2" style={{ color: 'inherit', textAlign: 'inherit' }}>{title || 'Your Title Here'}</h4>
                        <p className="opacity-75 small mb-4" style={{ color: 'inherit', textAlign: 'inherit' }}>{body || 'This is the main message that your visitors will read.'}</p>

                        {marketingFormId ? (
                            <div className="p-3 border rounded-3 bg-light-subtle text-muted small">
                                <i className="bi bi-ui-checks me-2"></i> Marketing Form: {marketingForms.find(f => f.id === marketingFormId)?.name || 'Linked'}
                            </div>
                        ) : (
                            <>
                                {(emailEnabled || mobileEnabled) && (
                                    <div className="mb-3 d-flex flex-column gap-2">
                                        {emailEnabled && (
                                            <input
                                                type="email"
                                                className="form-control form-control-sm"
                                                style={{
                                                    borderColor: inputBorderColor || '#dee2e6',
                                                    borderRadius: inputBorderRadius || '30px',
                                                    backgroundColor: inputBackgroundColor || '#ffffff'
                                                }}
                                                placeholder="Enter your email"
                                                disabled
                                            />
                                        )}
                                        {mobileEnabled && (
                                            <input
                                                type="tel"
                                                className="form-control form-control-sm"
                                                style={{
                                                    borderColor: inputBorderColor || '#dee2e6',
                                                    borderRadius: inputBorderRadius || '30px',
                                                    backgroundColor: inputBackgroundColor || '#ffffff'
                                                }}
                                                placeholder="Enter mobile number"
                                                disabled
                                            />
                                        )}
                                    </div>
                                )}
                                {ctaText && (
                                    <div
                                        className="btn w-100 py-2 fw-bold"
                                        style={{
                                            backgroundColor: buttonColor || '#0d6efd',
                                            color: buttonTextColor || '#ffffff',
                                            border: `${buttonBorderWidth || '0px'} solid ${buttonBorderColor || 'transparent'}`,
                                            borderRadius: buttonBorderRadius || '30px'
                                        }}
                                    >
                                        {ctaText}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <div className="d-flex gap-2">
                        <span className={`badge rounded-pill ${formData.type === 'modal' ? 'bg-primary' : 'bg-secondary opacity-50'}`}>Modal</span>
                        <span className={`badge rounded-pill ${formData.type === 'banner' ? 'bg-primary' : 'bg-secondary opacity-50'}`}>Banner</span>
                        <span className={`badge rounded-pill ${formData.type === 'slide_in' ? 'bg-primary' : 'bg-secondary opacity-50'}`}>Slide-in</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white h-100">
            <div className="h-100 d-flex flex-column">
                {/* Visual Header */}
                <div className="container-fluid py-3 border-bottom shadow-sm bg-white">
                    <div className="d-flex align-items-center justify-content-between px-md-4">
                        <div className="d-flex align-items-center">
                            <button
                                type="button"
                                className="btn btn-light rounded-circle me-3 p-2 d-flex align-items-center justify-content-center"
                                onClick={onClose}
                                style={{ width: '40px', height: '40px' }}
                                title="Exit Designer"
                            >
                                <i className="bi bi-arrow-left fs-5"></i>
                            </button>
                            <div>
                                <h4 className="fw-bold mb-0 text-dark">{popup ? 'Edit Popup Designer' : 'New Popup Designer'}</h4>
                                <p className="text-muted small mb-0 d-none d-md-block">Customize exactly how your popup looks and behaves on your website.</p>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Discard</button>
                            <button
                                type="button"
                                className="btn btn-primary rounded-pill px-4 shadow-sm"
                                onClick={() => handleSubmit()}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                ) : (
                                    <><i className="bi bi-check2-circle me-2"></i>Publish Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow-1 overflow-hidden">
                    <div className="row g-0 h-100">
                        {/* Editor Side */}
                        <div className="col-lg-7 h-100 d-flex flex-column border-end shadow-sm bg-white">
                            <div className="d-flex border-bottom bg-light px-md-5 overflow-auto">
                                <button
                                    type="button"
                                    className={`btn btn-link nav-link px-3 py-3 border-bottom border-3 ${activeTab === 'basic' ? 'border-primary text-primary fw-bold' : 'border-transparent text-muted text-decoration-none'}`}
                                    onClick={() => setActiveTab('basic')}
                                >
                                    1. Basic Info
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-link nav-link px-3 py-3 border-bottom border-3 ${activeTab === 'design' ? 'border-primary text-primary fw-bold' : 'border-transparent text-muted text-decoration-none'}`}
                                    onClick={() => setActiveTab('design')}
                                >
                                    2. Design
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-link nav-link px-3 py-3 border-bottom border-3 ${activeTab === 'behavior' ? 'border-primary text-primary fw-bold' : 'border-transparent text-muted text-decoration-none'}`}
                                    onClick={() => setActiveTab('behavior')}
                                >
                                    3. Behavior
                                </button>
                            </div>

                            <div className="p-4 p-md-5 flex-grow-1" style={{ overflowY: 'auto' }}>
                                {activeTab === 'basic' && (
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-bold small">Popup Name (Internal)</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. Summer Discount Offer"
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small">Target Website</label>
                                            <select
                                                className="form-select rounded-3"
                                                name="websiteId"
                                                value={formData.websiteId}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select a website...</option>
                                                {websites.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small">Popup Title (Public)</label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                name="content.title"
                                                value={formData.content?.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Get 10% Off Your First Booking!"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small">Body Content</label>
                                            <textarea
                                                className="form-control rounded-3"
                                                rows={3}
                                                name="content.body"
                                                value={formData.content?.body}
                                                onChange={handleChange}
                                                placeholder="Enter the main message for your popup..."
                                            ></textarea>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'design' && (
                                    <div>
                                        {/* Design Sub-navigation */}
                                        <div className="d-flex mb-4 gap-2 bg-light p-1 rounded-3">
                                            <button
                                                type="button"
                                                className={`btn btn-sm flex-fill rounded-2 py-2 ${designSubTab === 'layout' ? 'btn-white shadow-sm fw-bold text-primary' : 'btn-link text-muted text-decoration-none'}`}
                                                onClick={() => setDesignSubTab('layout')}
                                            >
                                                Layout & Colors
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm flex-fill rounded-2 py-2 ${designSubTab === 'fields' ? 'btn-white shadow-sm fw-bold text-primary' : 'btn-link text-muted text-decoration-none'}`}
                                                onClick={() => setDesignSubTab('fields')}
                                            >
                                                Input Fields
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm flex-fill rounded-2 py-2 ${designSubTab === 'buttons' ? 'btn-white shadow-sm fw-bold text-primary' : 'btn-link text-muted text-decoration-none'}`}
                                                onClick={() => setDesignSubTab('buttons')}
                                            >
                                                Button Styles
                                            </button>
                                        </div>

                                        {designSubTab === 'layout' && (
                                            <div className="row g-3 animate-fade-in">
                                                <div className="col-12">
                                                    <label className="form-label fw-bold small">Popup Layout</label>
                                                    <div className="d-flex gap-3">
                                                        <div
                                                            className={`flex-fill p-3 border rounded-3 text-center cursor-pointer transition-all ${formData.content?.layout === 'stacked' || !formData.content?.layout ? 'bg-primary-subtle border-primary shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handleChange({ target: { name: 'content.layout', value: 'stacked' } } as any)}
                                                        >
                                                            <i className="bi bi-view-stacked d-block mb-1 fs-4"></i>
                                                            <span className="small fw-bold">Stacked</span>
                                                        </div>
                                                        <div
                                                            className={`flex-fill p-3 border rounded-3 text-center cursor-pointer transition-all ${formData.content?.layout === 'split' ? 'bg-primary-subtle border-primary shadow-sm' : 'bg-light'}`}
                                                            onClick={() => handleChange({ target: { name: 'content.layout', value: 'split' } } as any)}
                                                        >
                                                            <i className="bi bi-layout-split d-block mb-1 fs-4"></i>
                                                            <span className="small fw-bold">Split</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-bold small">Text Alignment</label>
                                                    <div className="d-flex gap-2">
                                                        {['left', 'center', 'right'].map((align) => (
                                                            <button
                                                                key={align}
                                                                type="button"
                                                                className={`btn btn-sm flex-fill border rounded-3 ${formData.content?.textAlign === align ? 'btn-primary shadow-sm' : 'btn-light'}`}
                                                                onClick={() => handleChange({ target: { name: 'content.textAlign', value: align } } as any)}
                                                            >
                                                                <i className={`bi bi-text-${align === 'center' ? 'center' : align}`}></i>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Background Color</label>
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color w-100 rounded-3"
                                                        name="content.backgroundColor"
                                                        value={formData.content?.backgroundColor}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Text Color</label>
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color w-100 rounded-3"
                                                        name="content.textColor"
                                                        value={formData.content?.textColor}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label fw-bold small text-primary">Popup Visual Image</label>
                                                    {formData.content?.imageUrl ? (
                                                        <div 
                                                            className="position-relative cursor-pointer border rounded-4 bg-white d-flex align-items-center p-3 shadow-sm hover-bg-light transition-all hvr-grow"
                                                            onClick={() => setShowMediaSelector(true)}
                                                        >
                                                            <div className="bg-light p-1 rounded-3 border me-3 flex-shrink-0" style={{ width: '80px', height: '60px' }}>
                                                                <img src={formData.content.imageUrl} alt="Popup" className="w-100 h-100 rounded-2" style={{ objectFit: 'cover' }} />
                                                            </div>
                                                            <div className="flex-grow-1 overflow-hidden">
                                                                <div className="fw-bold small text-truncate text-dark">{formData.content.imageUrl.split('/').pop()?.substring(0, 30)}</div>
                                                                <div className="extra-small text-muted">Click to change popup image</div>
                                                            </div>
                                                            <div className="ms-auto d-flex gap-2 pe-1">
                                                                <button type="button" className="btn btn-white btn-sm rounded-circle shadow-sm border p-0 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData(prev => ({ ...prev, content: { ...prev.content, imageUrl: '' } }));
                                                                }}>
                                                                    <i className="bi bi-trash text-danger"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="border-2 rounded-4 p-4 text-center cursor-pointer hover-bg-light-subtle transition-all bg-light border-dashed text-primary d-flex flex-column align-items-center justify-content-center"
                                                            onClick={() => setShowMediaSelector(true)}
                                                            style={{ borderStyle: 'dashed', borderColor: '#dee2e6', minHeight: '120px' }}
                                                        >
                                                            <div className="bg-white rounded-circle shadow-sm p-3 mb-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                                                <i className="bi bi-cloud-arrow-up fs-3 text-primary opacity-50"></i>
                                                            </div>
                                                            <div className="fw-bold small">Pick Section Image</div>
                                                            <p className="extra-small text-muted mb-0 mt-1">Recommended for high engagement (800x600px)</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Popup Width</label>
                                                    <div className="d-flex gap-2 bg-light p-1 rounded-3">
                                                        {['small', 'medium', 'large'].map((w) => (
                                                            <button
                                                                key={w}
                                                                type="button"
                                                                className={`btn btn-sm flex-fill rounded-2 py-1 ${formData.content?.width === w ? 'bg-white shadow-sm fw-bold text-primary' : 'btn-link text-muted text-decoration-none'}`}
                                                                onClick={() => handleChange({ target: { name: 'content.width', value: w } } as any)}
                                                            >
                                                                {w.charAt(0).toUpperCase() + w.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Popup Height</label>
                                                    <div className="d-flex gap-2 bg-light p-1 rounded-3">
                                                        {['auto', 'small', 'medium', 'large'].map((h) => (
                                                            <button
                                                                key={h}
                                                                type="button"
                                                                className={`btn btn-sm flex-fill rounded-2 py-1 ${formData.content?.height === h || (!formData.content?.height && h === 'auto') ? 'bg-white shadow-sm fw-bold text-primary' : 'btn-link text-muted text-decoration-none'}`}
                                                                onClick={() => handleChange({ target: { name: 'content.height', value: h } } as any)}
                                                            >
                                                                {h.charAt(0).toUpperCase() + h.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-12 mt-4">
                                                    <div className="p-3 border rounded-4 bg-light bg-opacity-50">
                                                        <h6 className="fw-bold small mb-3 d-flex align-items-center">
                                                            <i className="bi bi-check-circle text-success me-2"></i>
                                                            Success State (Thank You Message)
                                                        </h6>
                                                        <div className="row g-3">
                                                            <div className="col-12">
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Success Title</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm rounded-3"
                                                                    name="content.thankYouTitle"
                                                                    value={formData.content?.thankYouTitle || 'Success!'}
                                                                    onChange={handleChange}
                                                                    placeholder="e.g. Success!"
                                                                />
                                                            </div>
                                                            <div className="col-12">
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Success Message</label>
                                                                <textarea
                                                                    className="form-control form-control-sm rounded-3"
                                                                    name="content.thankYouBody"
                                                                    value={formData.content?.thankYouBody || ''}
                                                                    onChange={handleChange}
                                                                    rows={2}
                                                                    placeholder="e.g. Thank you for your interest..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <div className="form-check form-switch card p-3 border-0 bg-primary-subtle bg-opacity-10 rounded-4">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <label className="form-check-label fw-bold small mb-0">Show "View Again" Trigger</label>
                                                                <p className="extra-small text-muted mb-0">Adds a floating button to re-open after dismissal.</p>
                                                            </div>
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={formData.content?.showFloatingTrigger || false}
                                                                onChange={(e) => handleChange({ target: { name: 'content.showFloatingTrigger', value: e.target.checked } } as any)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {designSubTab === 'fields' && (
                                            <div className="row g-3 animate-fade-in">
                                                <div className="col-12">
                                                    <div className="card border-0 bg-light p-3 rounded-4 mb-3">
                                                        <label className="form-label fw-bold small mb-3 text-primary d-block">1. Enable Capture Fields</label>
                                                        <div className="row g-2">
                                                            <div className="col-md-6">
                                                                <div className={`p-3 border rounded-3 cursor-pointer transition-all ${formData.content?.emailEnabled ? 'bg-white border-primary shadow-sm' : 'bg-light'}`}
                                                                    onClick={() => handleChange({ target: { name: 'content.emailEnabled', value: !formData.content?.emailEnabled } } as any)}>
                                                                    <div className="form-check form-switch mb-0">
                                                                        <input className="form-check-input" type="checkbox" checked={formData.content?.emailEnabled || false} readOnly />
                                                                        <label className="form-check-label small fw-bold">Capture Email</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className={`p-3 border rounded-3 cursor-pointer transition-all ${formData.content?.mobileEnabled ? 'bg-white border-primary shadow-sm' : 'bg-light'}`}
                                                                    onClick={() => handleChange({ target: { name: 'content.mobileEnabled', value: !formData.content?.mobileEnabled } } as any)}>
                                                                    <div className="form-check form-switch mb-0">
                                                                        <input className="form-check-input" type="checkbox" checked={formData.content?.mobileEnabled || false} readOnly />
                                                                        <label className="form-check-label small fw-bold">Capture Mobile</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(formData.content?.emailEnabled || formData.content?.mobileEnabled) && (
                                                            <div className="mt-3 p-2 bg-warning-subtle rounded-3 border-start border-3 border-warning">
                                                                <p className="extra-small text-muted mb-0">
                                                                    <i className="bi bi-lightbulb me-2 text-warning"></i>
                                                                    Want instant conversion? Set <b>Action</b> to <b>Download Document</b> in Behavior.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="card border-0 bg-light p-3 rounded-4">
                                                        <label className="form-label fw-bold small mb-3 text-primary d-block">2. Input Style Properties</label>
                                                        <div className="row g-3">
                                                            <div className="col-12">
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Input Border Color</label>
                                                                <input
                                                                    type="color"
                                                                    className="form-control form-control-color w-100 rounded-3"
                                                                    name="content.inputBorderColor"
                                                                    value={formData.content?.inputBorderColor || '#dee2e6'}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Border Radius</label>
                                                                <select
                                                                    className="form-select form-select-sm rounded-3"
                                                                    name="content.inputBorderRadius"
                                                                    value={formData.content?.inputBorderRadius || '30px'}
                                                                    onChange={handleChange}
                                                                >
                                                                    <option value="0px">Sharp (0px)</option>
                                                                    <option value="8px">Rounded (8px)</option>
                                                                    <option value="16px">Smooth (16px)</option>
                                                                    <option value="30px">Pill (30px)</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Background Color</label>
                                                                <input
                                                                    type="color"
                                                                    className="form-control form-control-color w-100 rounded-3"
                                                                    name="content.inputBackgroundColor"
                                                                    value={formData.content?.inputBackgroundColor || '#ffffff'}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {designSubTab === 'buttons' && (
                                            <div className="row g-3 animate-fade-in">
                                                <div className="col-12">
                                                    <label className="form-label fw-bold small">Button Text</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="content.ctaText"
                                                        value={formData.content?.ctaText}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Claim Now"
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label fw-bold small">Button Link (URL)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="content.ctaUrl"
                                                        value={formData.content?.ctaUrl}
                                                        onChange={handleChange}
                                                        placeholder="https://..."
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Bg Color</label>
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color w-100 rounded-3"
                                                        name="content.buttonColor"
                                                        value={formData.content?.buttonColor}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small">Text Color</label>
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color w-100 rounded-3"
                                                        name="content.buttonTextColor"
                                                        value={formData.content?.buttonTextColor}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="col-12 p-3 bg-light rounded-4 border-dashed mt-4">
                                                    <label className="form-label extra-small fw-bold text-primary text-uppercase mb-3 d-block">Advanced Border Styles</label>
                                                    <div className="row g-3">
                                                        <div className="col-md-6">
                                                            <label className="form-label extra-small fw-bold text-muted">Border Radius</label>
                                                            <select
                                                                className="form-select form-select-sm rounded-3"
                                                                name="content.buttonBorderRadius"
                                                                value={formData.content?.buttonBorderRadius || '30px'}
                                                                onChange={handleChange}
                                                            >
                                                                <option value="0px">Sharp</option>
                                                                <option value="8px">Rounded</option>
                                                                <option value="16px">Smooth</option>
                                                                <option value="30px">Pill</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label extra-small fw-bold text-muted">Border Width</label>
                                                            <select
                                                                className="form-select form-select-sm rounded-3"
                                                                name="content.buttonBorderWidth"
                                                                value={formData.content?.buttonBorderWidth || '0px'}
                                                                onChange={handleChange}
                                                            >
                                                                <option value="0px">None</option>
                                                                <option value="1px">Thin (1px)</option>
                                                                <option value="2px">Medium (2px)</option>
                                                                <option value="3px">Thick (3px)</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-12">
                                                            <label className="form-label extra-small fw-bold text-muted">Border Color</label>
                                                            <input
                                                                type="color"
                                                                className="form-control form-control-color w-100 rounded-3"
                                                                name="content.buttonBorderColor"
                                                                value={formData.content?.buttonBorderColor || '#0d6efd'}
                                                                onChange={handleChange}
                                                                disabled={!formData.content?.buttonBorderWidth || formData.content?.buttonBorderWidth === '0px'}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-12 mt-4">
                                            <label className="form-label fw-bold small text-muted">Advanced Connection</label>
                                            <select
                                                className="form-select rounded-3 bg-light border-0"
                                                name="content.marketingFormId"
                                                value={formData.content?.marketingFormId || ''}
                                                onChange={handleChange}
                                            >
                                                <option value="">No external form (Using Direct Styles)</option>
                                                {marketingForms.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'behavior' && (
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Popup Type</label>
                                            <select
                                                className="form-select rounded-3"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                            >
                                                <option value="modal">Centered Modal</option>
                                                <option value="banner">Top/Bottom Banner</option>
                                                <option value="slide_in">Corner Slide-in</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Display Trigger</label>
                                            <select
                                                className="form-select rounded-3"
                                                name="trigger"
                                                value={formData.trigger}
                                                onChange={handleChange}
                                            >
                                                <option value="on_load">Immediately on Load</option>
                                                <option value="exit_intent">On Exit Intent</option>
                                                <option value="scroll">On Scroll Percentage</option>
                                                <option value="delay">Time Delay</option>
                                            </select>
                                        </div>
                                        {(formData.trigger === 'scroll' || formData.trigger === 'delay') && (
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small">
                                                    {formData.trigger === 'scroll' ? 'Scroll Percentage (0-100)' : 'Delay in Seconds'}
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control rounded-3"
                                                    name="triggerValue"
                                                    value={formData.triggerValue}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max={formData.trigger === 'scroll' ? "100" : undefined}
                                                />
                                            </div>
                                        )}
                                        <div className="col-12 mt-4">
                                            <div className="form-check form-switch card p-3 border-0 bg-light">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div>
                                                        <label className="form-check-label fw-bold mb-0">Initially Active</label>
                                                        <p className="small text-muted mb-0">If disabled, the popup will not be displayed.</p>
                                                    </div>
                                                    <input
                                                        className="form-check-input ms-0"
                                                        type="checkbox"
                                                        checked={formData.isActive}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                                        style={{ width: '40px', height: '20px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="col-lg-5 bg-light d-none d-lg-block border-start h-100 shadow-inner">
                            {renderPreview()}
                        </div>
                    </div>
                </div>

                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />

                <style jsx>{`
                    .nav-link {
                        background: none;
                        border: none;
                        transition: all 0.2s;
                        color: #64748b;
                    }
                    .nav-link:hover {
                        background-color: rgba(13, 110, 253, 0.05);
                    }
                    .form-control:focus, .form-select:focus {
                        border-color: #0d6efd;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
                    }
                    .preview-container {
                        min-height: 100%;
                    }
                    .preview-box {
                        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .transition-all {
                        transition: all 0.3s ease;
                    }
                    .cursor-pointer {
                        cursor: pointer;
                    }
                    .btn-white {
                        background-color: #ffffff;
                        color: #0d6efd;
                    }
                    .border-dashed {
                        border: 1px dashed #dee2e6;
                    }
                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
                <MediaSelector
                    show={showMediaSelector}
                    onClose={() => setShowMediaSelector(false)}
                    onSelect={handleMediaSelect}
                    title="Choose Popup Image"
                />
            </div>
        </div>
    );
}
