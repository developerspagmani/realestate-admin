'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { websiteService, marketingService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import BookingModal from '@/components/modules/realestate/shared/BookingModal';
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
    const [leadIdentity, setLeadIdentity] = useState<{ id?: string, email?: string } | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const theme = website.configuration?.theme || { primaryColor: '#6366f1', fontFamily: 'Outfit, sans-serif' };
    const builder = website.configuration?.builder || {};
    const menus = website.configuration?.menus || { header: [], footer: [] };

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

    // Initial load: check for stored identity
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

    const identifyLead = (id: string, email?: string) => {
        const identity = { id, email };
        setLeadIdentity(identity);
        localStorage.setItem(`website_lead_${website.id}`, JSON.stringify(identity));
    };

    const trackAction = async (type: string, metadata: any = {}) => {
        if (!leadIdentity) return;
        try {
            await marketingService.trackInteraction({
                leadId: leadIdentity.id,
                email: leadIdentity.email,
                type,
                metadata: { websiteId: website.id, ...metadata }
            });
        } catch (err) {
            console.error('Tracking failed:', err);
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
            slugOrDomain
        }}>
            <div
                className="standalone-website min-vh-100 bg-white d-flex flex-column"
                style={{
                    '--primary-color': theme.primaryColor,
                    '--primary-hover': primaryHover,
                    '--primary-ghost': primaryGhost,
                    fontFamily: theme.fontFamily
                } as any}
            >

                {/* Real Estate Premium Header */}
                {builder.showLogo !== false && (
                    <header className="py-3 bg-white backdrop-blur-md border-bottom sticky-top z-1050">
                        <div className="container d-flex justify-content-between align-items-center">
                            <Link href={`/standalone/${slugOrDomain}`} className="website-logo text-decoration-none">
                                {builder.logoUrl ? (
                                    <img src={builder.logoUrl} alt="Brand Logo" style={{ height: '42px', objectFit: 'contain' }} />
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
                </main>

                {/* Premium Smart Footer */}
                {builder.showFooter !== false && (
                    <footer className="py-5 bg-dark text-white mt-auto position-relative">
                        <div className="container">
                            <div className="row g-5">
                                <div className="col-md-4">
                                    <h5 className="fw-bold mb-4">{website.name}</h5>
                                    <p className="small text-muted opacity-75">
                                        {builder.footerText || 'A next-generation real estate experience powered by Antigravity OS.'}
                                    </p>
                                </div>
                                <div className="col-md-2">
                                    <h6 className="fw-bold mb-3 small">LINKS</h6>
                                    <ul className="list-unstyled extra-small text-muted gap-2 d-flex flex-column text-white">
                                        {menus.footer?.map((item: any) => (
                                            <li key={item.id}>
                                                <Link
                                                    href={item.type === 'page' ? `/standalone/${slugOrDomain}/page/${item.pageSlug}` : item.url}
                                                    target={item.target || '_self'}
                                                    className="text-white text-decoration-none opacity-75 hover-opacity-100 transition-all"
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="col-md-6 text-md-end">
                                    <div className="d-flex gap-3 justify-content-md-end mb-4">
                                        <i className="bi bi-facebook fs-5 opacity-50 hover-opacity-100 transition-all cursor-pointer"></i>
                                        <i className="bi bi-instagram fs-5 opacity-50 hover-opacity-100 transition-all cursor-pointer"></i>
                                        <i className="bi bi-linkedin fs-5 opacity-50 hover-opacity-100 transition-all cursor-pointer"></i>
                                    </div>
                                    <p className="extra-small text-muted mb-0">© {new Date().getFullYear()} {website.name}. All rights reserved.</p>
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
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.3)',
                                userSelect: 'none',
                                pointerEvents: 'auto',
                                zIndex: 9999
                            }}
                        >
                            <img
                                src="/images/Virpnix-logo-icon-svg.svg"
                                alt="Virpanix"
                                className='rounded-pill'
                                style={{ height: '20px', width: 'auto', marginRight: '6px', opacity: 1, borderRadius: '50px' }}
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
                                                notes: 'Automated entry via Standalone Portal Chatbot'
                                            };

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
            </div>
        </StandaloneContext.Provider>
    );
}
