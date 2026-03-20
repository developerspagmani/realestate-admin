'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { websiteService, marketingService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import BookingModal from '@/components/modules/realestate/shared/BookingModal';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import PopupRenderer from '@/components/modules/realestate/website/PopupRenderer';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import '@/components/modules/realestate/shared/shared.css';

interface StandaloneContextType {
    website: any;
    properties: any[];
    theme: any;
    builder: any;
    leadIdentity: { id?: string, email?: string } | null;
    identifyLead: (id: string, email?: string) => void;
    trackAction: (type: string, metadata?: any) => Promise<void>;
    slugOrDomain: string;
    loading: boolean;
    updateFilters: (filters: any) => Promise<void>;
    currencySymbol: string;
}

const StandaloneContext = createContext<StandaloneContextType | null>(null);

export const useStandalone = () => {
    const context = useContext(StandaloneContext);
    if (!context) throw new Error('useStandalone must be used within StandaloneProvider');
    return context;
};

export default function StandaloneProvider({
    children,
    website,
    initialData,
    slugOrDomain
}: {
    children: React.ReactNode;
    website: any;
    initialData: any[];
    slugOrDomain: string;
}) {
    const [properties, setProperties] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [leadIdentity, setLeadIdentity] = useState<{ id?: string, email?: string } | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const theme = website.configuration?.theme || { primaryColor: '#6366f1', fontFamily: 'Outfit, sans-serif' };
    const builder = website.configuration?.builder || {};
    const menus = website.configuration?.menus || { header: [], footer: [] };

    // Calculate currency symbol
    const tenantSettings = website?.tenant?.settings || {};
    const baseCurrency = tenantSettings.general?.currency;
    const currencyConfig = getCurrencyConfig(baseCurrency || website?.tenant?.country);
    const currencySymbol = currencyConfig?.symbol || '$';

    // Fetch properties with filters
    const updateFilters = async (newFilters: any) => {
        try {
            setLoading(true);
            setFilters(newFilters);

            const params = new URLSearchParams();
            params.append('tenantId', website.tenantId);

            // If website is restricted to specific properties, ensure search stays within them
            const allowedIds = website.propertyIds || (website.propertyId ? [website.propertyId] : []);
            if (allowedIds.length > 0) {
                params.append('propertyIds', allowedIds.join(','));
            }

            Object.entries(newFilters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });

            const res = await fetch(`/api/public/properties?${params.toString()}`);
            const result = await res.json();

            if (result.success) {
                setProperties(result.data || []);
            }
        } catch (error) {
            console.error('Filter fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to darken a color for hover states
    const darkenColor = (hex: string, percent: number) => {
        try {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    };

    const primaryHover = darkenColor(theme.primaryColor, 10);
    const primaryGhost = theme.primaryColor + '15'; // 15 is ~8% opacity in hex

    // 1. Initial load: check for stored identity
    useEffect(() => {
        const stored = localStorage.getItem(`website_lead_${website.id}`);
        if (stored) {
            try {
                setLeadIdentity(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse lead identity');
            }
        }
    }, [website.id]);

    // 2. Dynamic Portal Styling (Favicon & Fonts)
    useEffect(() => {
        if (!website) return;

        // A. Favicon Injection
        const faviconUrl = website.configuration?.builder?.faviconUrl;
        if (faviconUrl) {
            try {
                // Clear existing favicon links to prevent flicker/conflicts
                const existing = document.querySelectorAll("link[rel*='icon']");
                existing.forEach(el => el.remove());

                // Inject standard icon
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = faviconUrl;
                document.head.appendChild(link);

                // Inject shortcut icon for legacy browsers
                const shortcut = document.createElement('link');
                shortcut.rel = 'shortcut icon';
                shortcut.href = faviconUrl;
                document.head.appendChild(shortcut);
                
                // Inject apple touch icon for mobile bookmarks
                const apple = document.createElement('link');
                apple.rel = 'apple-touch-icon';
                apple.href = faviconUrl;
                document.head.appendChild(apple);
            } catch (err) {
                console.warn('Favicon injection failed:', err);
            }
        }

        // B. Google Font Injection
        const fontName = website.configuration?.theme?.fontFamily || 'Inter';
        const fontId = 'google-font-website';
        let fontLink = document.getElementById(fontId) as HTMLLinkElement;

        const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;

        if (fontLink) {
            fontLink.href = fontUrl;
        } else {
            fontLink = document.createElement('link');
            fontLink.id = fontId;
            fontLink.rel = 'stylesheet';
            fontLink.href = fontUrl;
            document.head.appendChild(fontLink);
        }

        // C. Dynamic SEO Title
        if (website.configuration?.seo?.title) {
            document.title = website.configuration.seo.title;
        }

        // D. Custom Header Snippet Injection
        const headerSnippet = website.configuration?.seo?.headerSnippet;
        if (headerSnippet) {
            try {
                // Remove existing if any
                const oldContainer = document.getElementById('website-custom-header');
                if (oldContainer) oldContainer.remove();

                const container = document.createElement('div');
                container.id = 'website-custom-header';
                container.style.display = 'none';

                // We use contextual fragments to ensure script tags execute
                const range = document.createRange();
                range.selectNode(document.head);
                const fragment = range.createContextualFragment(headerSnippet);
                container.appendChild(fragment);
                document.head.appendChild(container);
            } catch (err) {
                console.error('Failed to inject header snippet:', err);
            }
        }
    }, [website]);

    // E. Initial Site Tracking
    useEffect(() => {
        if (website?.id) {
            trackAction('WEBSITE_VIEW', { name: website.name });
        }
    }, [website?.id]);

    // Footer Snippet Injection (Client-side effect for scripts)
    useEffect(() => {
        const footerSnippet = website.configuration?.seo?.footerSnippet;
        if (footerSnippet) {
            try {
                const oldContainer = document.getElementById('website-custom-footer');
                if (oldContainer) oldContainer.remove();

                const container = document.createElement('div');
                container.id = 'website-custom-footer';
                container.style.display = 'none';

                const range = document.createRange();
                range.selectNode(document.body);
                const fragment = range.createContextualFragment(footerSnippet);
                container.appendChild(fragment);
                document.body.appendChild(container);
            } catch (err) {
                console.error('Failed to inject footer snippet:', err);
            }
        }
    }, [website.configuration?.seo?.footerSnippet]);

    const identifyLead = (id: string, email?: string) => {
        const identity = { id, email };
        setLeadIdentity(identity);
        localStorage.setItem(`website_lead_${website.id}`, JSON.stringify(identity));
    };

    const trackAction = async (type: string, metadata: any = {}, identityOverride?: { id?: string, email?: string }) => {
        const identity = identityOverride || leadIdentity;
        
        // Ensure we have a consistent Visitor ID for anonymous tracking
        let visitorId = localStorage.getItem('v_id');
        if (!visitorId) {
            visitorId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
                ? crypto.randomUUID() 
                : `v_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
            localStorage.setItem('v_id', visitorId);
        }

        try {
            await marketingService.trackInteraction({
                leadId: identity?.id,
                email: identity?.email,
                visitorId: visitorId,
                tenantId: website.tenantId, // backend needs this to associate anonymous lead
                type,
                metadata: { websiteId: website.id, ...metadata }
            });
        } catch (err: any) {
            console.error('Tracking failed:', err);
            // If the lead was deleted from the system (404), clear our local identity
            // Wait, our backend now returns 404 if it can't lead/visitor-identify.
            // But if it's 404 with an identity.id, it means that ID is dead.
            if (identity?.id && (err.status === 404 || err.message?.includes('Lead not found'))) {
                setLeadIdentity(null);
                localStorage.removeItem(`website_lead_${website.id}`);
            }
        }
    };

    const handleFilterResults = useCallback((results: any[]) => {
        setProperties(results);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setShowMobileMenu(false);
    }, [pathname]);

    const isHome = pathname === `/standalone/${slugOrDomain}` || pathname === `/standalone/${slugOrDomain}/`;

    return (
        <StandaloneContext.Provider value={{
            website,
            properties,
            theme,
            builder,
            leadIdentity,
            identifyLead,
            trackAction,
            slugOrDomain,
            loading,
            updateFilters,
            currencySymbol
        }}>
            <div
                className="standalone-website min-vh-100 bg-white d-flex flex-column"
                style={{
                    '--primary-color': theme.primaryColor,
                    '--primary-hover': primaryHover,
                    '--primary-ghost': primaryGhost,
                    fontFamily: `'${theme.fontFamily}', sans-serif`
                } as any}
            >

                {/* Real Estate Premium Header */}
                {builder.showLogo !== false && (
                    <header className="py-3 bg-white backdrop-blur-md border-bottom sticky-top z-1050">
                        <div className="container d-flex justify-content-between align-items-center">
                            <Link href={`/standalone/${slugOrDomain}`} className="website-logo text-decoration-none">
                                {builder.logoUrl ? (
                                    <img src={builder.logoUrl} alt="Brand Logo" style={{ height: '65px', objectFit: 'contain' }} />
                                ) : (
                                    <div className="fw-black h4 mb-0 text-primary tracking-tighter" style={{ color: theme.primaryColor }}>{website.name.toUpperCase()}</div>
                                )}
                            </Link>
                            <nav className="d-none d-md-flex align-items-center gap-4">
                                {menus.header?.map((item: any) => (
                                    <Link
                                        key={item.id}
                                        href={item.type === 'page' ? `/standalone/${slugOrDomain}/page/${item.pageSlug}` : item.url}
                                        target={item.target || '_self'}
                                        className="btn btn-link link-dark text-decoration-none fw-bold small p-0 text-uppercase"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                {builder.showInquiry !== false && website.configuration?.inquiryForm?.enabled !== false && (
                                    <button
                                        className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold small border-2"
                                        onClick={() => setShowInquiryModal(true)}
                                    >
                                        <i className="bi bi-envelope-fill me-2"></i>INQUIRY
                                    </button>
                                )}
                                {(website.configuration?.bookingForm?.enabled || website.configuration?.builder?.enableBooking) && (
                                    <button
                                        className="btn btn-primary rounded-pill px-4 py-2 shadow-sm fw-bold small"
                                        style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                        onClick={() => setShowBookingModal(true)}
                                    >
                                        RESERVE NOW
                                    </button>
                                )}
                            </nav>
                            <button className="btn d-md-none border-0 p-0 text-dark" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                                <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'} fs-2`}></i>
                            </button>
                        </div>

                        {/* Mobile Navigation Overlay */}
                        {showMobileMenu && (
                            <div className="mobile-nav-overlay d-md-none animate-fade-in bg-white position-fixed top-0 start-0 w-100 vh-100 z-1040 p-5 mt-5">
                                <div className="d-flex flex-column gap-4 text-center mt-4">
                                    {menus.header?.map((item: any) => (
                                        <Link
                                            key={item.id}
                                            href={item.type === 'page' ? `/standalone/${slugOrDomain}/page/${item.pageSlug}` : item.url}
                                            target={item.target || '_self'}
                                            className="btn btn-link link-dark text-decoration-none fw-bold h4 p-0 text-uppercase"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    {builder.showInquiry !== false && website.configuration?.inquiryForm?.enabled !== false && (
                                        <button
                                            className="btn btn-outline-dark rounded-pill px-4 py-3 shadow-sm fw-bold h5 mt-3"
                                            onClick={() => { setShowInquiryModal(true); setShowMobileMenu(false); }}
                                        >
                                            <i className="bi bi-envelope-fill me-2"></i>INQUIRY
                                        </button>
                                    )}
                                    {(website.configuration?.bookingForm?.enabled || website.configuration?.builder?.enableBooking) && (
                                        <button
                                            className="btn btn-primary rounded-pill px-4 py-3 shadow-lg fw-bold h5 mt-4"
                                            style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                            onClick={() => { setShowBookingModal(true); setShowMobileMenu(false); }}
                                        >
                                            RESERVE NOW
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </header>
                )}

                <main className="flex-grow-1 animate-fade-in">
                    {children}

                    {/* Inquiry Form Section — shows on ALL pages when enabled */}
                    {builder.showInquiry !== false && (
                        <section className="py-5 bg-light border-top">
                            <div className="container" style={{ maxWidth: '640px' }}>
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-bold extra-small text-uppercase">
                                            <i className="bi bi-envelope-open-fill me-2"></i>Contact Us
                                        </span>
                                    </div>
                                    <h2 className="fw-black h3 mb-2" style={{ color: theme.primaryColor }}>Have a Question?</h2>
                                    <p className="text-muted small">Fill in the form below and our team will get back to you shortly.</p>
                                </div>
                                <FormRenderer
                                    config={website.configuration?.inquiryForm || {
                                        enabled: true, title: 'Send an Inquiry', description: 'Let us help you find the perfect property.', fields: [
                                            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
                                            { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true },
                                            { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: false },
                                            { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Tell us what you are looking for...', required: false },
                                        ]
                                    }}
                                    primaryColor={theme.primaryColor}
                                    onSubmit={async (formData, config) => {
                                        try {
                                            const res = await websiteService.createPublicLead(website.id, {
                                                ...formData,
                                                source: 'website_inquiry',
                                                notes: `Inquiry from ${website.name} portal.`
                                            });
                                            if (res.success) {
                                                const leadId = res.data?.id || res.id;
                                                identifyLead(leadId, formData.email);
                                                trackAction('INQUIRY_SUBMIT', { formId: config.marketingFormId || 'custom' });
                                            }
                                        } catch (err) {
                                            console.error('Inquiry fail:', err);
                                        }
                                    }}
                                />
                            </div>
                        </section>
                    )}
                </main>

                {/* Premium Smart Footer */}
                {builder.showFooter !== false && (
                    <footer className="py-5 mt-auto position-relative border-top" style={{
                        backgroundColor: website.configuration?.footer?.backgroundColor || '#212529',
                        color: website.configuration?.footer?.textColor || '#ffffff'
                    }}>
                        <div className="container">
                            <div className="row g-5">
                                <div className="col-md-4">
                                    <h5 className="fw-bold mb-4">{website.name}</h5>
                                    <p className="small opacity-75">
                                        {builder.footerText || website.configuration?.footer?.footerText || 'A next-generation real estate experience powered by Antigravity OS.'}
                                    </p>
                                </div>
                                <div className="col-md-2">
                                    <h6 className="fw-bold mb-3 small opacity-50">LINKS</h6>
                                    <ul className="list-unstyled extra-small gap-2 d-flex flex-column">
                                        {menus.footer?.map((item: any) => (
                                            <li key={item.id}>
                                                <Link
                                                    href={item.type === 'page' ? `/standalone/${slugOrDomain}/page/${item.pageSlug}` : item.url}
                                                    target={item.target || '_self'}
                                                    className="text-inherit text-decoration-none opacity-75 hover-opacity-100 transition-all"
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="col-md-6 text-md-end">
                                    <div className="d-flex gap-4 justify-content-md-end mb-4">
                                        {Object.entries(website.configuration?.footer?.socials || {}).map(([key, value]) => {
                                            if (!value) return null;
                                            const icons: any = {
                                                facebook: 'bi-facebook',
                                                instagram: 'bi-instagram',
                                                twitter: 'bi-twitter-x',
                                                linkedin: 'bi-linkedin',
                                                youtube: 'bi-youtube'
                                            };
                                            return (
                                                <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="text-inherit opacity-50 hover-opacity-100 transition-all">
                                                    <i className={`bi ${icons[key]} fs-5`}></i>
                                                </a>
                                            );
                                        })}
                                        {!Object.values(website.configuration?.footer?.socials || {}).some(v => !!v) && (
                                            <>
                                                <i className="bi bi-facebook fs-5 opacity-25"></i>
                                                <i className="bi bi-instagram fs-5 opacity-25"></i>
                                                <i className="bi bi-linkedin fs-5 opacity-25"></i>
                                            </>
                                        )}
                                    </div>
                                    <p className="extra-small opacity-50 mb-0">
                                        {website.configuration?.footer?.copyright || `© ${new Date().getFullYear()} ${website.name}. All rights reserved.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Non-removable Watermark */}
                        <a
                            href="https://www.virpanix.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="position-absolute bottom-0 start-50 translate-middle-x mb-2 text-decoration-none d-flex align-items-center"
                            style={{
                                fontSize: '11px',
                                color: 'rgba(128,128,128,0.3)',
                                userSelect: 'none',
                                pointerEvents: 'auto',
                                zIndex: 9999
                            }}
                        >
                            <img
                                src="/images/Virpnix-logo-icon-svg.svg"
                                alt="Virpanix"
                                style={{ height: '14px', width: 'auto', marginRight: '6px', opacity: 0.6 }}
                            />
                            Powered by Virpanix
                        </a>
                    </footer>
                )}

                {/* Intelligent Concierge */}
                {website.configuration?.chatbot?.enabled && (
                    <>
                        <button
                            className="btn rounded-circle shadow-lg floating-chat-btn d-flex align-items-center justify-content-center animate-bounce"
                            style={{
                                backgroundColor: theme.primaryColor,
                                width: '60px',
                                height: '60px',
                                position: 'fixed',
                                bottom: '24px',
                                right: '24px',
                                zIndex: 1000
                            }}
                            onClick={() => {
                                setShowChat(!showChat);
                                if (showChat) setChatExpanded(false);
                            }}
                        >
                            <i className={`bi ${showChat ? 'bi-x' : 'bi-chat-dots'} text-white fs-4`}></i>
                        </button>

                        {showChat && (
                            <div className="chatbot-window shadow-2xl animate-fade-in chat-responsive" style={{
                                position: 'fixed',
                                bottom: chatExpanded ? '24px' : '100px',
                                right: '24px',
                                width: chatExpanded ? '600px' : '350px',
                                maxWidth: 'calc(100vw - 48px)',
                                maxHeight: chatExpanded ? '85vh' : '500px',
                                height: chatExpanded ? '85vh' : '500px',
                                zIndex: 1000,
                                transition: 'all 0.3s ease'
                            }}>
                                <ChatbotWidget
                                    properties={properties}
                                    theme={theme}
                                    onClose={() => { setShowChat(false); setChatExpanded(false); }}
                                    onExpandToggle={(exp) => setChatExpanded(exp)}
                                    onFilterResults={handleFilterResults}
                                    trackAction={trackAction}
                                    // Chatbot navigation updated to use router
                                    onSelectProperty={(prop) => {
                                        router.push(`/standalone/${slugOrDomain}/p/${prop.slug || prop.id}`);
                                        setShowChat(false);
                                        setChatExpanded(false);
                                    }}
                                    onCreateLead={async (contact, name) => {
                                        try {
                                            const leadPayload: any = {
                                                name: name || 'Website Chat Inquiry',
                                                source: 'website_chatbot',
                                                notes: `Automated entry via Standalone Portal Chatbot`
                                            };

                                            // Attach Marketing Form and Segment info if available
                                            if (website.configuration?.inquiryForm?.useMarketingForm && website.configuration?.inquiryForm?.marketingFormId) {
                                                leadPayload.formId = website.configuration?.inquiryForm?.marketingFormId;
                                            }

                                            // Parse contact string (Email vs Phone) - consistent with Website logic
                                            if (contact && contact.includes('@')) {
                                                leadPayload.email = contact;
                                            } else if (contact) {
                                                leadPayload.phone = contact;
                                            }

                                            // Handle combined email/phone format (email | phone) if present
                                            if (contact && contact.includes('|')) {
                                                const [e, p] = contact.split('|').map(s => s.trim());
                                                if (e && e.includes('@')) leadPayload.email = e;
                                                if (p) leadPayload.phone = p;
                                            }

                                            const res = await websiteService.createPublicLead(website.id, leadPayload);

                                            // Identify the lead so future actions are tracked
                                            const leadId = res.success ? (res.data?.id || res.id) : (res.data?.id || res.id);
                                            if (leadId) {
                                                identifyLead(leadId, leadPayload.email);
                                            }

                                            if (!res.success && !leadId) {
                                                throw new Error(res.message || 'Failed to capture lead');
                                            }
                                        } catch (error) {
                                            console.error('Standalone chatbot lead capture error:', error);
                                            throw error;
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ── Inquiry Popup Modal ─────────────────────────────── */}
                {showInquiryModal && (
                    <div
                        className="modal d-block animate-fade-in"
                        tabIndex={-1}
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowInquiryModal(false); }}
                    >
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '560px' }}>
                            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in">
                                <div className="modal-header border-0 pb-0 pt-4 px-4">
                                    <div>
                                        <h3 className="fw-black mb-1 fs-4" style={{ color: theme.primaryColor }}>Get in Touch</h3>
                                        <p className="extra-small text-muted mb-0">Our team typically responds within 24 hours.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close ms-auto"
                                        onClick={() => setShowInquiryModal(false)}
                                        aria-label="Close"
                                    />
                                </div>
                                <div className="modal-body p-4">
                                    <FormRenderer
                                        config={(website.configuration?.inquiryForm?.useMarketingForm && website.configuration?.inquiryForm?.marketingFormId) 
                                            ? website.configuration.inquiryForm 
                                            : (website.configuration?.inquiryForm && website.configuration?.inquiryForm.enabled)
                                                ? website.configuration.inquiryForm
                                                : {
                                                    enabled: true, title: 'Send an Inquiry', description: '', submitButtonLabel: 'Send Inquiry', fields: [
                                                        { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
                                                        { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true },
                                                        { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: false },
                                                        { id: 'budget', label: 'Expected Budget', type: 'text', placeholder: 'e.g. $500,000', required: false },
                                                        { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Tell us what you are looking for...', required: false },
                                                    ]
                                                }}
                                        primaryColor={theme.primaryColor}
                                        onSubmit={async (fd, config) => {
                                            try {
                                                const leadPayload: any = {
                                                    ...fd,
                                                    source: 1, // Public site
                                                    notes: `Portal inquiry from ${website.name}.`
                                                };

                                                if (config.useMarketingForm && config.marketingFormId) {
                                                    leadPayload.formId = config.marketingFormId;
                                                }

                                                const res = await websiteService.createPublicLead(website.id, leadPayload);
                                                if (res.success) {
                                                    const lead = res.data;
                                                    identifyLead(lead.id, lead.email);
                                                    trackAction('INQUIRY_SUBMIT', { formId: config.marketingFormId || 'custom', source: 'popup' });
                                                    setTimeout(() => setShowInquiryModal(false), 2500);
                                                }
                                            } catch (err) {
                                                console.error('Inquiry popup fail:', err);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <BookingModal
                    show={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    widget={website}
                    widgetId={website.id}
                    selectedProperty={properties?.[0]}
                    selectedUnit={null}
                    theme={theme}
                    identifyLead={identifyLead}
                />

                {/* Conversion Popups Engine */}
                {website?.id && (
                    <PopupRenderer 
                        websiteId={website.id} 
                        theme={theme}
                        properties={properties}
                        trackAction={trackAction}
                    />
                )}
            </div>
        </StandaloneContext.Provider>
    );
}
