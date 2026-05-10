'use client';

import { useState, useEffect, useCallback } from 'react';
import { WebsitePopup, Property } from '@/types';
import { popupService, websiteService, widgetService } from '@/app/services/api';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { useIntelligentPopup } from '@/app/hooks/useIntelligentPopup';

interface PopupRendererProps {
    websiteId?: string;
    widgetId?: string;
    theme?: any;
    properties?: Property[];
    trackAction?: (type: string, metadata?: any) => Promise<void>;
    onIdentify?: (id: string, email?: string) => void;
}

export default function PopupRenderer({ websiteId, widgetId, theme, properties, trackAction, onIdentify }: PopupRendererProps) {
    const [activePopup, setActivePopup] = useState<WebsitePopup | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [allPopups, setAllPopups] = useState<WebsitePopup[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Intelligent Matching Hook
    const { matchedProperty } = useIntelligentPopup(properties);

    const primaryColor = theme?.primaryColor || '#0d6efd';

    const showPopup = useCallback((popup: WebsitePopup) => {
        // Check if already dismissed today
        const dismissed = localStorage.getItem(`popup_dismissed_${popup.id}`);
        if (dismissed) {
            const lastDismissed = new Date(dismissed).getTime();
            const now = new Date().getTime();
            if (now - lastDismissed < 24 * 60 * 60 * 1000) { // 24 hours
                return;
            }
        }

        setActivePopup(popup);
        setIsVisible(true);

        // Track View Event
        if (trackAction) {
            trackAction('POPUP_VIEW', {
                popupId: popup.id,
                popupName: popup.name,
                trigger: popup.trigger
            });
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        if (activePopup) {
            localStorage.setItem(`popup_dismissed_${activePopup.id}`, new Date().toISOString());
        }
    };

    const handleFormSubmit = async (formData: any, configUsed?: any) => {
        if (!activePopup || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const visitorId = localStorage.getItem('virpanix_visitor_id');
            const leadPayload: any = {
                visitorId,
                source: 'website_popup',
                popupId: activePopup.id,
                notes: `Captured via Popup: ${activePopup.name}`
            };

            // Intelligent Mapping (Similar to PageBuilder)
            if (configUsed && configUsed.fields) {
                configUsed.fields.forEach((field: any) => {
                    const val = formData[field.id];
                    if (!val) return;

                    const label = (field.label || '').toLowerCase();
                    const fid = (field.id || '').toLowerCase();
                    const type = (field.type || '').toLowerCase();

                    if (label.includes('name') || fid.includes('name')) {
                        leadPayload.name = val;
                    } else if (type === 'email' || label.includes('email') || fid.includes('email')) {
                        leadPayload.email = val;
                    } else if (type === 'phone' || type === 'tel' || label.includes('phone') || label.includes('contact') || fid.includes('phone')) {
                        leadPayload.phone = val;
                    } else if (label.includes('budget') || label.includes('price') || fid.includes('budget')) {
                        const cleanedBudget = String(val).replace(/[^\d.]/g, '');
                        leadPayload.budget = Number(cleanedBudget) || 0;
                    } else if (label.includes('company') || fid.includes('company')) {
                        leadPayload.company = val;
                    } else {
                        leadPayload.notes += `\n${field.label}: ${val}`;
                    }
                });
            } else {
                // Fallback for simple/legacy forms that spread formData directly
                Object.assign(leadPayload, formData);
            }

            const res = await widgetService.createPublicLead(
                (websiteId || widgetId) as string,
                leadPayload,
                !!websiteId
            );

            if (res.success) {
                setSubmitted(true);

                // Identify the lead so subsequent tracks (like POPUP_SUBMIT) have an ID
                if ((res.data?.id || res.id) && onIdentify) {
                    onIdentify(res.data?.id || res.id, leadPayload.email);
                }

                if (trackAction) {
                    trackAction('POPUP_SUBMIT', {
                        popupId: activePopup.id,
                        popupName: activePopup.name,
                        marketingFormId: activePopup.content?.marketingFormId
                    });
                }

                // Handle After Submit Actions
                const { afterSubmitAction, downloadUrl, redirectUrl } = activePopup.content || {};

                if (afterSubmitAction === 'download_document' && downloadUrl) {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.target = '_blank';
                    link.download = '';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else if (afterSubmitAction === 'redirect' && redirectUrl) {
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 2000);
                }

                // Auto close after 3 seconds if not redirecting
                if (afterSubmitAction !== 'redirect') {
                    setTimeout(() => {
                        handleClose();
                        setSubmitted(false);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Popup lead capture error:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Load Popups
    useEffect(() => {
        if (!websiteId && !widgetId) return;
        const fetchPopups = async () => {
            try {
                const res = await popupService.getPublicPopups(websiteId, widgetId);
                if (res.success && res.data) {
                    setAllPopups(res.data);
                }
            } catch (e) {
                console.error('Failed to load popups:', e);
            }
        };
        fetchPopups();
    }, [websiteId, widgetId]);

    // Setup Triggers
    useEffect(() => {
        if (allPopups.length === 0) return;

        const cleanupFunctions: (() => void)[] = [];

        allPopups.forEach(popup => {
            const triggerValue = parseInt(popup.triggerValue || '0');

            switch (popup.trigger as string) {
                case 'on_load':
                    const timer = setTimeout(() => showPopup(popup), 1000);
                    cleanupFunctions.push(() => clearTimeout(timer));
                    break;

                case 'delay':
                case 'on_delay': {
                    // triggerValue is in ms from the form (e.g. 3000)
                    const delayMs = triggerValue > 100 ? triggerValue : triggerValue * 1000;
                    const delayTimer = setTimeout(() => showPopup(popup), delayMs);
                    cleanupFunctions.push(() => clearTimeout(delayTimer));
                    break;
                }

                case 'scroll':
                case 'on_scroll': {
                    const handleScroll = () => {
                        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                        if (height <= 0) return;
                        const scrolled = (winScroll / height) * 100;
                        if (scrolled >= triggerValue) {
                            showPopup(popup);
                            window.removeEventListener('scroll', handleScroll);
                        }
                    };
                    window.addEventListener('scroll', handleScroll);
                    cleanupFunctions.push(() => window.removeEventListener('scroll', handleScroll));
                    break;
                }

                case 'exit_intent':
                case 'on_exit_intent': {
                    const handleMouseLeave = (e: MouseEvent) => {
                        if (e.clientY <= 0) {
                            showPopup(popup);
                            document.removeEventListener('mouseleave', handleMouseLeave);
                        }
                    };
                    document.addEventListener('mouseleave', handleMouseLeave);
                    cleanupFunctions.push(() => document.removeEventListener('mouseleave', handleMouseLeave));
                    break;
                }
            }
        });

        return () => cleanupFunctions.forEach(f => f());
    }, [allPopups, showPopup]);

    // Move return guard inside the JSX to allow floating trigger even if !isVisible
    // if (!activePopup || !isVisible) return null;

    const isBanner = activePopup?.type === 'banner';
    const isModal = activePopup?.type === 'modal';
    const isSlideIn = activePopup?.type === 'slide_in';

    // Lifted logic for use in both sub-renderers
    let displayImage = activePopup?.content?.imageUrl;
    if (activePopup?.content?.isIntelligentEnabled && matchedProperty) {
        displayImage = matchedProperty.photos?.[0] || matchedProperty.mainImage?.url || activePopup.content.imageUrl;
    }
    const isSplit = !!(activePopup?.content?.layout === 'split' && !isBanner && displayImage);

    const renderContent = () => {
        if (!activePopup) return null;
        if (submitted) {
            const { thankYouTitle, thankYouBody } = activePopup.content || {};
            return (
                <div className="text-center p-4 p-md-5 animate-fade-in d-flex flex-column align-items-center justify-content-center w-100 h-100" style={{ minHeight: '200px' }}>
                    <div className="mb-4">
                        <i className="bi bi-check-circle-fill display-4 text-success shadow-sm rounded-circle"></i>
                    </div>
                    <h2 className="fw-bold mb-3">{thankYouTitle || 'Success!'}</h2>
                    <p className="text-muted fs-5 mw-100" style={{ maxWidth: '400px' }}>{thankYouBody || "Thank you for your interest. We'll be in touch soon."}</p>
                </div>
            );
        }

        const {
            title, body, imageUrl, marketingFormId, ctaText, ctaUrl,
            backgroundColor, textColor, buttonColor, buttonTextColor,
            layout, textAlign, emailEnabled, mobileEnabled,
            inputBorderColor, inputBorderRadius, inputBackgroundColor,
            buttonBorderRadius, buttonBorderColor, buttonBorderWidth,
            thankYouTitle, thankYouBody, isIntelligentEnabled
        } = activePopup.content || {};

        // If Intelligent Mode is ON and we have a match, customize the text
        let displayTitle = title;
        let displayBody = body;

        if (isIntelligentEnabled && matchedProperty) {
            console.log('PopupRenderer - Intelligent Match ACTIVE');
            displayTitle = matchedProperty.title || matchedProperty.name || title;
            displayBody = matchedProperty.description || body || `We have great offers for this property. Drop your contact to get details.`;
        }

        const alignClass = textAlign === 'left' ? 'text-start' : textAlign === 'right' ? 'text-end' : 'text-center';
        // Force center alignment for banners and specific modals to ensure a premium look
        const finalAlignClass = (isBanner || isModal) ? 'text-center' : alignClass;

        return (
            <div className={`popup-inner-wrapper w-100 d-flex ${isSplit ? 'flex-row align-items-stretch' : 'flex-column'} ${isIntelligentEnabled && matchedProperty ? 'magic-card-glow' : ''}`} style={{ backgroundColor: backgroundColor || '#ffffff', color: textColor || '#000000', height: isSplit ? 'auto' : 'fit-content', minHeight: '100%' }}>
                {displayImage && (
                    <div className={`popup-image ${isSplit ? 'col-md-6 order-md-1' : 'w-100'}`} style={{ 
                        flex: isSplit ? '1 1 50%' : 'none',
                        maxWidth: isSplit ? '50%' : '100%',
                        overflow: 'hidden',
                        height: isSplit ? 'auto' : 'fit-content',
                        position: isSplit ? 'relative' : undefined,
                        alignSelf: 'stretch'
                    }}>
                        <img
                            src={displayImage}
                            alt={displayTitle}
                            className={`w-100 ${isSplit ? 'h-100' : ''}`}
                            style={{
                                objectFit: 'cover',
                                height: isSplit ? '100%' : 'auto',
                                position: isSplit ? 'absolute' : 'relative',
                                top: isSplit ? 0 : undefined,
                                left: isSplit ? 0 : undefined,
                                width: '100%',
                                maxHeight: isSplit ? '100%' : '320px',
                                minHeight: isSplit ? '300px' : '150px',
                                transition: 'transform 8s ease-out'
                            }}
                            onLoad={(e) => {
                                // Subtle Ken Burns effect
                                (e.target as HTMLImageElement).style.transform = 'scale(1.1)';
                            }}
                        />
                    </div>
                )}
                {/* Banner uses a horizontal centered layout */}
                {isBanner ? (
                    <div className="d-flex flex-column align-items-center justify-content-center text-center gap-3 px-4 py-4 animate-content-in w-100" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="w-100">
                            <h3 className="fw-bold mb-2 ls-tight" style={{ color: 'inherit', fontSize: '1.5rem' }}>{displayTitle}</h3>
                            <p className="opacity-85 mb-0" style={{ color: 'inherit', fontSize: '1.05rem' }}>{displayBody}</p>
                        </div>
                        {activePopup.content?.ctaText && (
                            <button
                                className="btn px-4 py-2 fw-bold shadow-sm flex-shrink-0"
                                style={{
                                    backgroundColor: activePopup.content?.buttonColor || primaryColor,
                                    color: activePopup.content?.buttonTextColor || '#ffffff',
                                    border: `${activePopup.content?.buttonBorderWidth || '0px'} solid ${activePopup.content?.buttonBorderColor || 'transparent'}`,
                                    borderRadius: activePopup.content?.buttonBorderRadius || '30px',
                                    whiteSpace: 'nowrap'
                                }}
                                onClick={() => {
                                    if (activePopup.content?.ctaUrl && activePopup.content.ctaUrl !== '#') {
                                        window.open(activePopup.content.ctaUrl, '_blank');
                                    }
                                    handleClose();
                                }}
                            >
                                {activePopup.content.ctaText}
                            </button>
                        )}
                    </div>
                ) : (
                <div className={`p-4 p-md-5 d-flex flex-column justify-content-center animate-content-in ${finalAlignClass} ${isSplit ? 'col-md-6 order-md-2' : ''}`} style={{ 
                    flex: isSplit ? '0 0 50%' : 'none',
                    maxWidth: isSplit ? '50%' : '100%',
                    height: 'auto'
                }}>
                    <h3 className="fw-bold mb-3 ls-tight" style={{ color: 'inherit', fontSize: '1.75rem' }}>{displayTitle}</h3>
                    <p className="opacity-75 mb-4 leading-relaxed" style={{ color: 'inherit' }}>{displayBody}</p>

                    {marketingFormId ? (
                        <div className="popup-form">
                            <FormRenderer
                                config={{
                                    enabled: true,
                                    title: '',
                                    description: '',
                                    fields: [],
                                    useMarketingForm: true,
                                    marketingFormId: marketingFormId
                                }}
                                onSubmit={handleFormSubmit}
                                primaryColor={buttonColor || primaryColor}
                            />
                        </div>
                    ) : (
                        <>
                            {(activePopup.content?.emailEnabled || activePopup.content?.mobileEnabled) ? (
                                <form
                                    className="d-flex flex-column gap-4 mb-3"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleFormSubmit(Object.fromEntries(formData));
                                    }}
                                >
                                    {emailEnabled && (
                                        <div className="form-group text-start">
                                            <label className="extra-small fw-bold opacity-75 mb-1 px-1">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control px-3 py-2 border-2"
                                                style={{
                                                    borderColor: inputBorderColor || '#dee2e6',
                                                    borderRadius: inputBorderRadius || '30px',
                                                    backgroundColor: inputBackgroundColor || '#ffffff'
                                                }}
                                                placeholder="e.g. name@example.com"
                                                required
                                            />
                                        </div>
                                    )}
                                    {mobileEnabled && (
                                        <div className="form-group text-start">
                                            <label className="extra-small fw-bold opacity-75 mb-1 px-1">Mobile Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="form-control px-3 py-2 border-2"
                                                style={{
                                                    borderColor: inputBorderColor || '#dee2e6',
                                                    borderRadius: inputBorderRadius || '30px',
                                                    backgroundColor: inputBackgroundColor || '#ffffff'
                                                }}
                                                placeholder="e.g. +91 999 999 9999"
                                                required
                                            />
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn w-100 py-3 fw-bold shadow-sm transition-all hvr-scale-sm d-flex align-items-center justify-content-center gap-2"
                                        disabled={isSubmitting}
                                        style={{
                                            backgroundColor: buttonColor || primaryColor,
                                            color: buttonTextColor || '#ffffff',
                                            border: `${buttonBorderWidth || '0px'} solid ${buttonBorderColor || 'transparent'}`,
                                            borderRadius: buttonBorderRadius || '30px'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            ctaText || 'Submit & Download'
                                        )}
                                    </button>
                                </form>
                            ) : (
                                ctaText && (
                                    <button
                                        type="submit"
                                        className="btn w-100 py-3 fw-bold shadow-sm hvr-grow rounded-4"
                                        style={{
                                            backgroundColor: buttonColor || primaryColor,
                                            color: buttonTextColor || '#ffffff',
                                            border: `${buttonBorderWidth || '0px'} solid ${buttonBorderColor || 'transparent'}`,
                                            borderRadius: buttonBorderRadius || '30px'
                                        }}
                                        onClick={(e) => {
                                            if (ctaUrl === '#' || !ctaUrl) e.preventDefault();
                                            // Track interaction
                                            widgetService.createPublicLead(
                                                (websiteId || widgetId) as string,
                                                { source: 'popup_cta', notes: `Clicked CTA: ${ctaText} on Popup: ${activePopup.name}` },
                                                !!websiteId
                                            );

                                            if (trackAction) {
                                                trackAction('POPUP_CLICK', {
                                                    popupId: activePopup.id,
                                                    popupName: activePopup.name,
                                                    ctaText,
                                                    ctaUrl
                                                });
                                            }

                                            const { afterSubmitAction, downloadUrl } = activePopup.content || {};

                                            if (afterSubmitAction === 'download_document' && downloadUrl) {
                                                const link = document.createElement('a');
                                                link.href = downloadUrl;
                                                link.target = '_blank';
                                                link.download = '';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                // Optionally close after download start? 
                                                setTimeout(() => handleClose(), 1000);
                                            } else if (!ctaUrl || ctaUrl === '#') {
                                                handleClose();
                                            }
                                        }}
                                    >
                                        {ctaText}
                                    </button>
                                )
                            )}
                        </>
                    )}
                </div>
                )}
            </div>
        );
    };

    // isBanner/isModal/isSlideIn already lifted above

    const renderPopup = () => {
        if (!activePopup || !isVisible) return null;

        const containerStyle: any = {
            zIndex: 10000,
            backgroundColor: activePopup.content?.backgroundColor || '#ffffff',
            color: activePopup.content?.textColor || '#000000',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRadius: isBanner ? '0' : (isSlideIn ? '24px' : '32px'),
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0,0,0,0.1)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            border: isModal ? '1px solid rgba(255,255,255,0.1)' : 'none',
            pointerEvents: 'auto',
            display: 'flex'
        };

        const modalContent = (
            <div
                className={`popup-container-root ${activePopup.type} animate-popup-in shadow-2xl`}
                style={{
                    ...containerStyle,
                    ...(isModal ? {
                        position: 'relative',
                        width: activePopup.content?.width === 'small' ? '400px' : activePopup.content?.width === 'large' ? '850px' : (isSplit ? '750px' : '520px'),
                        maxWidth: '90vw',
                        margin: 'auto',
                        minHeight: isSplit ? '400px' : 'auto'
                    } : isBanner ? {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        maxHeight: '60vh'
                    } : {
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: isSplit ? '650px' : '360px',
                        maxWidth: 'calc(100vw - 48px)',
                        maxHeight: isSplit ? '650px' : '450px'
                    })
                }}
            >
                <button
                    className="btn-re-close position-absolute top-0 end-0 m-3 m-md-4"
                    style={{ 
                        zIndex: 100, 
                        cursor: 'pointer', 
                        background: 'white',
                        border: '1px solid rgba(0,0,0,0.1)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                    }}
                    aria-label="Close"
                >
                    <i className="bi bi-x-lg fs-6"></i>
                </button>
                <div className="position-relative w-100" style={{ display: 'flex', flexGrow: 1, minHeight: 'fit-content' }}>
                    {renderContent()}
                </div>
            </div>
        );

        return (
            <>
                {isModal ? (
                    <div
                        className="popup-modal-overlay"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflowY: 'auto',
                            padding: '40px 0'
                        }}
                        onClick={handleClose}
                    >
                        {modalContent}
                    </div>
                ) : (
                    modalContent
                )}
            </>
        );
    };

    // Determine if any popup should show a floating trigger
    // If we have a matched property, prioritize popups that have Intelligent matching enabled
    const intelligentPopup = matchedProperty ? allPopups.find(p => p.content?.isIntelligentEnabled) : null;
    const triggerPopup = activePopup || intelligentPopup || allPopups.find(p => p.content?.showFloatingTrigger) || allPopups[0];

    return (
        <>
            {renderPopup()}

            {/* Website Promotions Sticky Icon (Bottom Left) */}
            {!isVisible && triggerPopup && (
                <div
                    className={`popup-reopen-trigger shadow-lg d-flex align-items-center justify-content-center animate-bounce-in ${matchedProperty && triggerPopup.content?.isIntelligentEnabled ? 'magic-glitter' : ''}`}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '24px',
                        width: '56px',
                        height: '56px',
                        backgroundColor: matchedProperty && triggerPopup.content?.isIntelligentEnabled ? '#8e44ad' : primaryColor,
                        color: '#ffffff',
                        borderRadius: '50%', // Modern squircle shape
                        cursor: 'pointer',
                        zIndex: 9998,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 30px rgba(255, 71, 87, 0.4)'
                    }}
                    onClick={() => {
                        setActivePopup(triggerPopup);
                        setIsVisible(true);
                    }}
                    title="Website Promotions"
                >
                    <i className={`bi ${matchedProperty && triggerPopup.content?.isIntelligentEnabled ? 'bi-magic' : 'bi-megaphone-fill'} fs-4 text-white`}></i>
                    <div className="trigger-pulse" style={{ backgroundColor: matchedProperty && triggerPopup.content?.isIntelligentEnabled ? '#8e44ad' : primaryColor }}></div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .popup-container-root::-webkit-scrollbar {
                    display: none;
                }
                .popup-container-root {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }

                .animate-popup-in {
                    animation: popupEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes popupEntry {
                    from { 
                        opacity: 0; 
                        ${isBanner ? 'transform: translateY(-100%);' : isModal ? 'transform: translateY(-20px) scale(0.95);' : 'transform: translateY(40px) scale(0.98);'} 
                    }
                    to { 
                        opacity: 1; 
                        ${isBanner ? 'transform: translateY(0);' : isModal ? 'transform: translateY(0) scale(1);' : 'transform: translateY(0) scale(1);'} 
                    }
                }

                .animate-content-in {
                    animation: contentUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
                }

                @keyframes contentUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .magic-card-glow {
                    position: relative;
                }
                .magic-card-glow::before {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    background: linear-gradient(135deg, #8e44ad, #c0392b, #2980b9);
                    z-index: -1;
                    filter: blur(15px);
                    opacity: 0.5;
                    border-radius: inherit;
                    animation: magicGlowPulse 4s infinite alternate;
                }
                @keyframes magicGlowPulse {
                    from { opacity: 0.3; transform: scale(0.98); }
                    to { opacity: 0.7; transform: scale(1.02); }
                }

                .btn-re-close:hover {
                    background: rgba(255,255,255,0.2) !important;
                    transform: rotate(90deg);
                }

                @media (max-width: 768px) {
                    .popup-inner-wrapper.d-flex {
                        flex-direction: column !important;
                    }
                    .popup-image.col-md-6, .col-md-6.order-md-2 {
                        max-width: 100% !important;
                        flex: none !important;
                        width: 100% !important;
                    }
                    .popup-image img {
                        height: 200px !important;
                    }

                    .popup-container-root.slide_in {
                        top: 0 !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        max-height: 100vh !important;
                        border-radius: 0 !important;
                    }

                    .popup-container-root.modal {
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        max-height: 100vh !important;
                        border-radius: 0 !important;
                        transform: none !important;
                    }
                    
                    @keyframes popupEntry {
                        from { 
                            opacity: 0; 
                            ${isBanner ? 'transform: translateY(-100%);' : 'transform: translateY(30px) scale(0.98);'} 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                        }
                    }
                }

                .popup-reopen-trigger:hover {
                    transform: scale(1.1);
                }

                .trigger-pulse {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    z-index: -1;
                    animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.6; }
                    100% { transform: scale(1.6); opacity: 0; }
                }

                .animate-bounce-in {
                    animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes bounceIn {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .magic-glitter {
                    background: linear-gradient(135deg, #8e44ad, #c0392b, #2980b9) !important;
                    background-size: 200% 200% !important;
                    animation: gradientShift 3s ease infinite, magicGlow 2s ease-in-out infinite alternate !important;
                }

                .magic-glitter::after {
                    content: '✨';
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    font-size: 14px;
                    animation: sparkle 1.5s infinite;
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes magicGlow {
                    from { box-shadow: 0 0 10px #8e44ad, 0 0 20px #c0392b; }
                    to { box-shadow: 0 0 20px #8e44ad, 0 0 40px #2980b9; }
                }

                @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0); opacity: 1; }
                    50% { transform: scale(1.5) rotate(45deg); opacity: 0.5; }
                }
            `}} />
        </>
    );
}
