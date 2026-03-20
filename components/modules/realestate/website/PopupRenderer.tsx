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

            switch (popup.trigger) {
                case 'on_load':
                    const timer = setTimeout(() => showPopup(popup), 1000);
                    cleanupFunctions.push(() => clearTimeout(timer));
                    break;

                case 'delay':
                    const delayTimer = setTimeout(() => showPopup(popup), triggerValue * 1000);
                    cleanupFunctions.push(() => clearTimeout(delayTimer));
                    break;

                case 'scroll':
                    const handleScroll = () => {
                        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                        const scrolled = (winScroll / height) * 100;
                        if (scrolled >= triggerValue) {
                            showPopup(popup);
                            window.removeEventListener('scroll', handleScroll);
                        }
                    };
                    window.addEventListener('scroll', handleScroll);
                    cleanupFunctions.push(() => window.removeEventListener('scroll', handleScroll));
                    break;

                case 'exit_intent':
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
        });

        return () => cleanupFunctions.forEach(f => f());
    }, [allPopups, showPopup]);

    // Move return guard inside the JSX to allow floating trigger even if !isVisible
    // if (!activePopup || !isVisible) return null;

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

        // If Intelligent Mode is ON and we have a match, customize the content
        let displayTitle = title;
        let displayBody = body;
        let displayImage = imageUrl;

        if (isIntelligentEnabled && matchedProperty) {
            console.log('PopupRenderer - Intelligent Match ACTIVE: Customizing content for:', matchedProperty.name);
            displayTitle = `Interested in ${matchedProperty.title}?`;
            displayBody = matchedProperty.description || `We have Great offers for ${matchedProperty.title}. Drop your contact to get details.`;
            displayImage = matchedProperty.photos?.[0] || matchedProperty.mainImage?.url || imageUrl;
        } else if (isIntelligentEnabled && !matchedProperty) {
            console.log('PopupRenderer - Intelligent Mode enabled but NO property matched yet.');
        }

        const isSplit = layout === 'split' && activePopup.type !== 'banner' && displayImage;
        const alignClass = textAlign === 'left' ? 'text-start' : textAlign === 'right' ? 'text-end' : 'text-center';

        return (
            <div className={`popup-inner-wrapper ${isSplit ? 'd-flex flex-column flex-md-row' : ''}`} style={{ backgroundColor: backgroundColor || '#ffffff', color: textColor || '#000000' }}>
                {displayImage && (
                    <div className={`popup-image ${isSplit ? 'col-md-6 order-md-1' : 'mb-3'}`} style={{ minHeight: isSplit ? (activePopup.content?.height === 'small' ? '300px' : activePopup.content?.height === 'medium' ? '450px' : activePopup.content?.height === 'large' ? '600px' : '300px') : 'auto' }}>
                        <img
                            src={displayImage}
                            alt={displayTitle}
                            className={`w-100 ${isSplit ? 'h-100' : 'rounded-3 shadow-sm'}`}
                            style={{
                                objectFit: 'cover',
                                height: isSplit ? '100%' : (activePopup.content?.height === 'small' ? '120px' : activePopup.content?.height === 'medium' ? '180px' : activePopup.content?.height === 'large' ? '250px' : 'auto'),
                            }}
                        />
                    </div>
                )}

                <div className={`p-4 p-md-5 d-flex flex-column justify-content-center ${alignClass} ${isSplit ? 'col-md-6 order-md-2' : ''}`}>
                    <h3 className="fw-bold mb-2" style={{ color: 'inherit' }}>{displayTitle}</h3>
                    <p className="opacity-75 mb-4" style={{ color: 'inherit' }}>{displayBody}</p>

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
                                    className="d-flex flex-column gap-3 mb-2"
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
                                    <a
                                        href={ctaUrl || '#'}
                                        className="btn w-100 py-3 fw-bold shadow-sm"
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
                                    </a>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Move isModal/isBanner outside so they are available for style tag
    const isBanner = activePopup?.type === 'banner';
    const isModal = activePopup?.type === 'modal';
    const isSlideIn = activePopup?.type === 'slide_in';

    const renderPopup = () => {
        if (!activePopup || !isVisible) return null;

        return (
            <>
                {/* Modal Overlay - Only blocks and dims if isModal */}
                {isModal && (
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
                            justifyContent: 'center'
                        }}
                        onClick={handleClose}
                    />
                )}

                {/* Popup Container - Animation applied here to avoid containing block issues */}
                <div
                    className={`popup-container-root ${activePopup.type} animate-popup-in shadow-2xl`}
                    style={{
                        zIndex: 10000,
                        backgroundColor: activePopup.content?.backgroundColor || '#ffffff',
                        color: activePopup.content?.textColor || '#000000',
                        position: 'fixed',
                        overflow: 'hidden',
                        borderRadius: isBanner ? '0' : (isSlideIn ? '20px' : '24px'),
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: 'auto',
                        display: 'flex',
                        height: 'auto',
                        ...(isModal ? {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: activePopup.content?.width === 'small' ? '400px' : activePopup.content?.width === 'large' ? '850px' : (activePopup.content?.layout === 'split' && activePopup.content?.imageUrl ? '750px' : '550px'),
                            minHeight: activePopup.content?.height === 'small' ? '300px' : activePopup.content?.height === 'medium' ? '450px' : activePopup.content?.height === 'large' ? '600px' : 'auto',
                            maxWidth: '95vw'
                        } : isBanner ? {
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: 'none'
                        } : {
                            bottom: '24px',
                            right: '24px',
                            width: '380px',
                            maxWidth: 'calc(100vw - 48px)',
                            transform: 'none'
                        })
                    }}
                >
                    <button
                        className="btn-close position-absolute top-0 end-0 m-3"
                        style={{ zIndex: 11, cursor: 'pointer', filter: activePopup.content?.textColor === '#ffffff' ? 'invert(1)' : 'none' }}
                        onClick={handleClose}
                        aria-label="Close"
                    ></button>
                    <div className="position-relative">
                        {renderContent()}
                    </div>
                </div>
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
                .animate-popup-in {
                    animation: popupEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes popupEntry {
                    from { 
                        opacity: 0; 
                        ${isBanner ? 'transform: translateY(-100%);' : isModal ? 'transform: translate(-50%, -40%);' : 'transform: translateY(40px);'} 
                    }
                    to { 
                        opacity: 1; 
                        ${isBanner ? 'transform: translateY(0);' : isModal ? 'transform: translate(-50%, -50%);' : 'transform: translateY(0);'} 
                    }
                }

                @media (max-width: 768px) {
                    .popup-container-root.slide_in {
                        bottom: 0 !important;
                        right: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        border-radius: 24px 24px 0 0 !important;
                    }
                    
                    @keyframes popupEntry {
                        from { 
                            opacity: 0; 
                            ${isBanner ? 'transform: translateY(-100%);' : 'transform: translateY(100%);'} 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
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
