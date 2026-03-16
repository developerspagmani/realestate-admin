'use client';

import { useState, useEffect, useCallback } from 'react';
import { websiteService, marketingService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import UnitDetailView from '@/components/modules/realestate/shared/UnitDetailView';
import BookingModal from '@/components/modules/realestate/shared/BookingModal';
import PopupRenderer from '@/components/modules/realestate/website/PopupRenderer';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

import { Property, Unit } from '@/types';
import '@/components/modules/realestate/shared/shared.css';

type ViewType = 'LISTING' | 'PROPERTY_DETAIL' | 'UNIT_DETAIL';


interface StandaloneWebsitePageProps {
    slugOrDomain: string;
}

export default function StandaloneWebsitePage({ slugOrDomain }: StandaloneWebsitePageProps) {
    const [website, setWebsite] = useState<any>(null); // Keeping any for now as Website type is complex/missing
    const [data, setData] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('LISTING');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [filteredData, setFilteredData] = useState<Property[]>([]);
    const [isFiltered, setIsFiltered] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // UI State
    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [unitImageIndex, setUnitImageIndex] = useState(0);
    const [leadIdentity, setLeadIdentity] = useState<{ id?: string, email?: string, visitorId?: string } | null>(null);
    const [userContext, setUserContext] = useState<{ lat?: number, lng?: number, city?: string }>({});

    const loadWebsiteData = useCallback(async () => {
        if (!slugOrDomain) return;
        try {
            setLoading(true);
            const response = await websiteService.getPublicWebsite(slugOrDomain);
            if (response.success) {
                setWebsite(response.website);
                setData(response.data || []);
                setFilteredData(response.data || []);
            } else {
                setError(response.message || 'The requested portal could not be found.');
            }
        } catch {
            setError('System connection interrupted. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [slugOrDomain]);

    useEffect(() => {
        loadWebsiteData();
    }, [loadWebsiteData]);

    // Initialize Persistent Visitor Identity & Geo Context
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Get or Generate Global Visitor ID
        let vid = localStorage.getItem('virpanix_visitor_id');
        if (!vid) {
            vid = window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 15);
            localStorage.setItem('virpanix_visitor_id', vid);
        }

        // 2. Fetch User Geo Context (IP-based, lightweight)
        if (!userContext.city) {
            fetch('https://ipapi.co/json/')
                .then(res => res.json())
                .then(geo => {
                    setUserContext({
                        lat: geo.latitude,
                        lng: geo.longitude,
                        city: geo.city
                    });
                })
                .catch(() => {
                    // Fallback to basic TZ based guessing if IP geo fails
                    setUserContext({ city: Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1] });
                });
        }

        // 3. Restore site-specific lead identity
        if (website && !leadIdentity) {
            const saved = localStorage.getItem(`website_lead_${website.id}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setLeadIdentity({ ...parsed, visitorId: vid });
                } catch (e) {
                    setLeadIdentity({ visitorId: vid });
                }
            } else {
                setLeadIdentity({ visitorId: vid });
            }
        } else if (!leadIdentity) {
            setLeadIdentity({ visitorId: vid });
        }
    }, [website, leadIdentity, userContext.city]);


    const identifyLead = (id: string, email?: string) => {
        const vid = localStorage.getItem('virpanix_visitor_id');
        const identity = { id, email, visitorId: vid || undefined };
        setLeadIdentity(identity);
        if (website) localStorage.setItem(`website_lead_${website.id}`, JSON.stringify(identity));
    };

    const trackAction = async (type: string, metadata: Record<string, unknown> = {}) => {
        if (!leadIdentity || !website) return;
        try {
            await marketingService.trackInteraction({
                leadId: leadIdentity.id,
                email: leadIdentity.email,
                visitorId: leadIdentity.visitorId, // Critical for Identity Resolution
                type,
                metadata: {
                    websiteId: website.id,
                    userLat: userContext.lat,
                    userLng: userContext.lng,
                    city: userContext.city,
                    ...metadata
                }
            });
        } catch (err) {
            console.error('Telemetery fail:', err);
        }
    };

    const getFormattedPrice = (unit: Unit) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        const label = pricing.pricingModel === 2 ? 'hr' :
            pricing.pricingModel === 3 ? 'day' :
                pricing.pricingModel === 4 ? 'mo' :
                    pricing.pricingModel === 5 ? 'yr' : '';

        // Get currency from tenant settings if available, otherwise fallback to country
        const tenantSettings = website?.tenant?.settings || {};
        const baseCurrency = tenantSettings.general?.currency;
        const config = getCurrencyConfig(baseCurrency || website?.tenant?.country);
        const symbol = config?.symbol || '$';

        return `${symbol}${Number(pricing.price).toLocaleString('en-US')}${label ? `/${label}` : ''}`;
    };



    const handleFilterResults = useCallback((results: Property[]) => {
        setData(results);
    }, []);

    if (loading && !website) return null;

    if (error || !website) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
            <div className="text-center p-5 rounded-5 shadow-2xl border max-w-md">
                <i className="bi bi-shield-lock display-1 text-danger opacity-25 mb-4 d-block"></i>
                <h2 className="fw-black text-dark mb-3">Access Restricted</h2>
                <p className="text-muted mb-4">{error || 'This portal is currently unavailable or private.'}</p>
                <button className="btn btn-dark rounded-4 px-5 py-2 shadow-lg" onClick={() => window.location.reload()}>Retry Connection</button>
            </div>
        </div>
    );

    const theme = website?.configuration?.theme || { primaryColor: '#6366f1', fontFamily: 'Outfit, sans-serif' };
    const builder = website?.configuration?.builder || {};
    const chatbotConfig = {
        ...(website?.tenant?.settings?.chatbotConfig || {}),
        ...(data?.[0]?.metadata?.chatbotConfig || {}),
        ...(website?.configuration?.chatbot || {}),
        // Handle specific renames/fallbacks
        welcomeMessage: website?.configuration?.chatbot?.welcomeMessage ||
            website?.configuration?.chatbot?.welcomeTitle ||
            data?.[0]?.metadata?.chatbotConfig?.welcomeMessage ||
            website?.tenant?.settings?.chatbotConfig?.welcomeMessage
    };

    const renderView = () => {
        const tenantSettings = website?.tenant?.settings || {};
        const baseCurrency = tenantSettings.general?.currency;
        const currencyConfig = getCurrencyConfig(baseCurrency || website?.tenant?.country);
        const currencySymbol = currencyConfig?.symbol || '$';

        switch (currentView) {
            case 'LISTING':
                return (builder.showHero !== false || (builder.modules && builder.modules.length > 0)) ? (
                    <PageBuilder
                        config={builder}
                        data={filteredData}
                        theme={theme}
                        widget={website}
                        widgetId={website.id}
                        onSelectProperty={(property) => {
                            setSelectedProperty(property);
                            setPropertyImageIndex(0);
                            setCurrentView('PROPERTY_DETAIL');
                            trackAction('PROPERTY_VIEW', { propertyId: property.id });
                        }}
                    />
                ) : (
                    <ListingView
                        filteredData={filteredData}
                        isFiltered={isFiltered}
                        theme={theme}
                        widget={website}
                        widgetId={website?.id}
                        onReset={() => { setFilteredData(data); setIsFiltered(false); }}
                        onSelectProperty={(property) => {
                            setSelectedProperty(property);
                            setPropertyImageIndex(0);
                            setCurrentView('PROPERTY_DETAIL');
                        }}
                        colClass={builder.gridStrategy === 'list' ? 'col-12' : ''}
                    />
                );

            case 'PROPERTY_DETAIL':
                return (
                    <PropertyDetailView
                        selectedProperty={selectedProperty}
                        propertyImageIndex={propertyImageIndex}
                        setPropertyImageIndex={setPropertyImageIndex}
                        theme={theme}
                        widget={website}
                        widgetId={website?.id}
                        colClass="col-lg-4"
                        setCurrentView={setCurrentView}
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        setUnitImageIndex={setUnitImageIndex}
                        getFormattedPrice={getFormattedPrice}
                        trackAction={trackAction}
                        identifyLead={identifyLead}
                        currencySymbol={currencySymbol}
                    />
                );

            case 'UNIT_DETAIL':
                return (
                    <UnitDetailView
                        selectedUnit={selectedUnit}
                        selectedProperty={selectedProperty}
                        unitImageIndex={unitImageIndex}
                        setUnitImageIndex={setUnitImageIndex}
                        theme={theme}
                        widget={website}
                        widgetId={website?.id}
                        setCurrentView={setCurrentView}
                        getFormattedPrice={getFormattedPrice}
                        trackAction={trackAction}
                        identifyLead={identifyLead}
                        currencySymbol={currencySymbol}
                    />
                );




        }
    };

    return (
        <div className="standalone-website min-vh-100 bg-white selection-none" style={{ '--primary-color': theme.primaryColor, fontFamily: `'${theme.fontFamily}', sans-serif` } as any}>
            {/* Real Estate Premium Header */}
            {builder.showLogo !== false && (
                <header className="py-3 bg-white backdrop-blur-md border-bottom sticky-top z-1050">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div className="website-logo cursor-pointer" onClick={() => setCurrentView('LISTING')}>
                            {builder.logoUrl ? (
                                <img src={builder.logoUrl} alt={website?.name || "Brand Logo"} style={{ height: '65px', objectFit: 'contain' }} />
                            ) : (
                                <div className="fw-black h4 mb-0 text-primary tracking-tighter" style={{ color: theme.primaryColor }}>{website?.name?.toUpperCase()}</div>
                            )}
                        </div>
                        <nav className="d-none d-md-flex align-items-center gap-4">
                            {website.configuration?.menus?.header?.map((item: any) => (
                                <button
                                    key={item.id}
                                    className="btn btn-link link-dark text-decoration-none fw-bold small p-0"
                                    onClick={() => {
                                        if (item.type === 'custom') {
                                            window.open(item.url, item.target || '_self');
                                        } else {
                                            // Handle CMS page navigation - this would ideally routing to a /page/[slug]
                                            console.log('Navigate to page:', item.pageSlug);
                                        }
                                    }}
                                >
                                    {item.label.toUpperCase()}
                                </button>
                            ))}
                            {!website.configuration?.menus?.header?.length && (
                                <>
                                    <button className="btn btn-link link-dark text-decoration-none fw-bold small p-0" onClick={() => setCurrentView('LISTING')}>EXPLORE</button>
                                    <button className="btn btn-link link-dark text-decoration-none fw-bold small p-0">ABOUT</button>
                                </>
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
                                {website.configuration?.menus?.header?.map((item: any) => (
                                    <button
                                        key={item.id}
                                        className="btn btn-link link-dark text-decoration-none fw-bold h4 p-0"
                                        onClick={() => {
                                            setShowMobileMenu(false);
                                            if (item.type === 'custom') {
                                                window.open(item.url, item.target || '_self');
                                            }
                                        }}
                                    >
                                        {item.label.toUpperCase()}
                                    </button>
                                ))}
                                {!website.configuration?.menus?.header?.length && (
                                    <>
                                        <button
                                            className="btn btn-link link-dark text-decoration-none fw-bold h4 p-0"
                                            onClick={() => { setCurrentView('LISTING'); setShowMobileMenu(false); }}
                                        >
                                            EXPLORE
                                        </button>
                                        <button className="btn btn-link link-dark text-decoration-none fw-bold h4 p-0">ABOUT</button>
                                    </>
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

            <main className="animate-fade-in">
                {renderView()}
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
                            <div className="col-md-3">
                                <h6 className="fw-bold mb-3 small opacity-50">RESOURCES</h6>
                                <ul className="list-group list-group-flush bg-transparent gap-2">
                                    {website.configuration?.menus?.footer?.map((item: any) => (
                                        <li key={item.id} className="list-group-item bg-transparent border-0 p-0">
                                            <a
                                                href={item.url || '#'}
                                                target={item.target || '_self'}
                                                className="extra-small text-inherit text-decoration-none opacity-75 hover-opacity-100 transition-all"
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                    {!website.configuration?.menus?.footer?.length && (
                                        <>
                                            <li className="list-group-item bg-transparent border-0 p-0 extra-small opacity-50">Privacy Policy</li>
                                            <li className="list-group-item bg-transparent border-0 p-0 extra-small opacity-50">Terms of Service</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                            <div className="col-md-5 text-md-end">
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
                                </div>
                                <p className="extra-small opacity-50 mb-0">© {new Date().getFullYear()} {website.name}. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            {/* Intelligent Concierge - Exactly matching Widget implementation */}
            {website.configuration?.chatbot?.enabled && (
                <>
                    <button
                        className="btn rounded-circle shadow-lg floating-chat-btn d-flex align-items-center justify-content-center animate-bounce"
                        style={{
                            backgroundColor: chatbotConfig.primaryColor || theme.primaryColor,
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
                        aria-label="Toggle chatbot"
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
                                properties={data}
                                theme={{ ...theme, primaryColor: chatbotConfig.primaryColor || theme.primaryColor }}
                                onClose={() => {
                                    setShowChat(false);
                                    setChatExpanded(false);
                                }}
                                onExpandToggle={(exp) => setChatExpanded(exp)}
                                onFilterResults={handleFilterResults}
                                trackAction={trackAction}
                                onSelectProperty={(prop) => {
                                    setSelectedProperty(prop);
                                    setCurrentView('PROPERTY_DETAIL');
                                    setShowChat(false);
                                    setChatExpanded(false);
                                    window.scrollTo(0, 0);
                                }}
                                // Global AI Settings Injection
                                customWelcomeTitle={chatbotConfig.welcomeMessage}
                                customWelcomeSubtext={chatbotConfig.welcomeSubtext}
                                leadCaptureMode={chatbotConfig.leadCaptureMode}
                                flow={chatbotConfig.flow}
                                upsellEnabled={chatbotConfig.upsellEnabled}
                                crossSellEnabled={chatbotConfig.crossSellEnabled}
                                recommendationLogic={chatbotConfig.recommendationLogic}
                                budgetRanges={chatbotConfig.budgetRanges}
                                currencySymbol={getCurrencyConfig(website?.tenant?.settings?.general?.currency || website?.tenant?.country)?.symbol || '$'}
                                onCreateLead={async (contact, name) => {
                                    try {
                                        const leadPayload: any = {
                                            name: name || 'Website Chat Inquiry',
                                            source: 'website_chatbot'
                                        };

                                        if (contact && contact.includes('@')) {
                                            leadPayload.email = contact;
                                        } else if (contact) {
                                            leadPayload.phone = contact;
                                        }

                                        // Inject Visitor ID for stitching
                                        const vid = localStorage.getItem('virpanix_visitor_id');
                                        if (vid) leadPayload.visitorId = vid;

                                        if (contact && contact.includes('|')) {
                                            const [e, p] = contact.split('|').map(s => s.trim());
                                            if (e && e.includes('@')) leadPayload.email = e;
                                            if (p) leadPayload.phone = p;
                                        }

                                        const res = await websiteService.createPublicLead(website?.id || '', leadPayload);
                                        const leadId = res.success ? (res.data?.id || res.id) : null;
                                        if (leadId) identifyLead(leadId, leadPayload.email);
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
                selectedProperty={selectedProperty || (data?.length > 0 ? data[0] : null)}
                selectedUnit={null}
                theme={theme}
                identifyLead={identifyLead}
            />

            {/* Conversion Popups Engine */}
            {website?.id && (
                <PopupRenderer
                    websiteId={website.id}
                    theme={theme}
                    properties={data}
                    trackAction={trackAction}
                />
            )}
        </div>
    );
}
