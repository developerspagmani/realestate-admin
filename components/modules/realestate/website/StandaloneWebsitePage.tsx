'use client';

import { useState, useEffect, useCallback } from 'react';
import { websiteService, marketingService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import UnitDetailView from '@/components/modules/realestate/shared/UnitDetailView';
import ThreeDView from '@/components/modules/realestate/shared/ThreeDView';
import BookingModal from '@/components/modules/realestate/shared/BookingModal';
import PropertyTour from '@/components/modules/realestate/tour/PropertyTour';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import '@/components/modules/realestate/shared/shared.css';

type ViewType = 'LISTING' | 'PROPERTY_DETAIL' | 'UNIT_DETAIL' | 'THREE_D' | 'TOUR';

interface StandaloneWebsitePageProps {
    slugOrDomain: string;
}

export default function StandaloneWebsitePage({ slugOrDomain }: StandaloneWebsitePageProps) {
    const [website, setWebsite] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('LISTING');
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [isFiltered, setIsFiltered] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // UI State
    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [unitImageIndex, setUnitImageIndex] = useState(0);
    const [leadIdentity, setLeadIdentity] = useState<{ id?: string, email?: string } | null>(null);

    // ... (rest of the file remains same until RenderView) ...
    // Note: I need to preserve the rest of the file logic but I'm doing a huge replace.
    // To be safe, I should target specific blocks. But imports are at top, state is at top, button in middle, modal at bottom.
    // I'll use multi-edit if possible, or just replace the whole file content carefully?
    // replace_file_content is for SINGLE CONTIGUOUS BLOCK.
    // I can't update imports AND render return in one go unless I replace EVERYTHING between them.
    // I'll use `multi_replace_file_content` instead.


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
        } catch (err) {
            setError('System connection interrupted. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [slugOrDomain]);

    useEffect(() => {
        loadWebsiteData();
    }, [loadWebsiteData]);

    const identifyLead = (id: string, email?: string) => {
        const identity = { id, email };
        setLeadIdentity(identity);
        if (website) localStorage.setItem(`website_lead_${website.id}`, JSON.stringify(identity));
    };

    const trackAction = async (type: string, metadata: any = {}) => {
        if (!leadIdentity || !website) return;
        try {
            await marketingService.trackInteraction({
                leadId: leadIdentity.id,
                email: leadIdentity.email,
                type,
                metadata: { websiteId: website.id, ...metadata }
            });
        } catch (err) {
            console.error('Telemetery fail:', err);
        }
    };

    const getFormattedPrice = (unit: any) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        const label = pricing.pricingModel === 2 ? 'hr' :
            pricing.pricingModel === 3 ? 'day' :
                pricing.pricingModel === 4 ? 'mo' :
                    pricing.pricingModel === 5 ? 'yr' : '';

        // Get currency from tenant country
        const country = website?.tenant?.country || 'USA';
        const config = getCurrencyConfig(country);
        const symbol = config?.symbol || '$';

        return `${symbol}${Number(pricing.price).toLocaleString()}${label ? `/${label}` : ''}`;
    };

    // Helper to map units for the 3D Viewer
    const mapUnitsToSeats = (units: any[]) => {
        return units.map(u => ({
            id: u.id,
            name: u.name || `Unit ${u.unitCode}`,
            slug: u.unitCode || u.id,
            type: (u.unitCategory === 1 ? 'desk' : u.unitCategory === 2 ? 'office' : u.unitCategory === 3 ? 'apartment' : 'villa') as any,
            capacity: u.capacity || (u.realEstateDetails?.bedrooms || 1),
            hourlyRate: Number(u.unitPricing?.[0]?.price || 0),
            status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : 'maintenance',
        }));
    };

    const handleFilterResults = useCallback((results: any[]) => {
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

    const theme = website.configuration?.theme || { primaryColor: '#6366f1', fontFamily: 'Outfit, sans-serif' };
    const builder = website.configuration?.builder || {};

    const renderView = () => {
        const country = website?.tenant?.country || 'USA';
        const currencyConfig = getCurrencyConfig(country);
        const currencySymbol = currencyConfig?.symbol || '$';

        switch (currentView) {
            case 'LISTING':
                return builder.showHero ? (
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
                        widgetId={website.id}
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
                        widgetId={website.id}
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
                        widgetId={website.id}
                        setCurrentView={setCurrentView}
                        getFormattedPrice={getFormattedPrice}
                        trackAction={trackAction}
                        identifyLead={identifyLead}
                        currencySymbol={currencySymbol}
                    />
                );

            case 'THREE_D':
                return (
                    <ThreeDView
                        selectedProperty={selectedProperty}
                        theme={theme}
                        setCurrentView={setCurrentView}
                        setSelectedUnit={setSelectedUnit}
                        mapUnitsToSeats={mapUnitsToSeats as any}
                        currencySymbol={currencySymbol}
                    />
                );

            case 'TOUR':
                return (
                    <div className="container py-5">
                        <div className="glass-panel p-0 rounded-4 overflow-hidden shadow-2xl">
                            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-0">Virtual Reality Tour</h5>
                                    <p className="extra-small text-muted mb-0">{selectedProperty?.title}</p>
                                </div>
                                <button className="btn btn-outline-dark btn-sm rounded-4 px-3" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                                    <i className="bi bi-arrow-left me-2"></i>Exit Tour
                                </button>
                            </div>
                            <div style={{ height: '70vh' }}>
                                <PropertyTour propertyId={selectedProperty.id} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="standalone-website min-vh-100 bg-white selection-none" style={{ '--primary-color': theme.primaryColor, fontFamily: theme.fontFamily } as any}>
            {/* Real Estate Premium Header */}
            {builder.showLogo !== false && (
                <header className="py-3 bg-white backdrop-blur-md border-bottom sticky-top z-1050">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div className="website-logo cursor-pointer" onClick={() => setCurrentView('LISTING')}>
                            {builder.logoUrl ? (
                                <img src={builder.logoUrl} alt="Brand Logo" style={{ height: '42px', objectFit: 'contain' }} />
                            ) : (
                                <div className="fw-black h4 mb-0 text-primary tracking-tighter" style={{ color: theme.primaryColor }}>{website.name.toUpperCase()}</div>
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
                <footer className="py-5 bg-dark text-white mt-auto">
                    <div className="container">
                        <div className="row g-5">
                            <div className="col-md-4">
                                <h5 className="fw-bold mb-4">{website.name}</h5>
                                <p className="small text-muted opacity-75">
                                    {builder.footerText || 'A next-generation real estate experience powered by Antigravity OS.'}
                                </p>
                            </div>
                            <div className="col-md-3">
                                <h6 className="fw-bold mb-3 small">RESOURCES</h6>
                                <ul className="list-group list-group-flush bg-transparent gap-2">
                                    {website.configuration?.menus?.footer?.map((item: any) => (
                                        <li key={item.id} className="list-group-item bg-transparent border-0 p-0">
                                            <a
                                                href={item.url || '#'}
                                                target={item.target || '_self'}
                                                className="extra-small text-muted text-decoration-none hover-text-white transition-all"
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                    {!website.configuration?.menus?.footer?.length && (
                                        <>
                                            <li className="list-group-item bg-transparent border-0 p-0 extra-small text-muted">Privacy Policy</li>
                                            <li className="list-group-item bg-transparent border-0 p-0 extra-small text-muted">Terms of Service</li>
                                        </>
                                    )}
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
                </footer>
            )}

            {/* Intelligent Concierge - Exactly matching Widget implementation */}
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
                                theme={theme}
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
                                onCreateLead={async (contact, name) => {
                                    try {
                                        const leadPayload: any = {
                                            name: name || 'Website Chat Inquiry',
                                            source: 'website_chatbot'
                                        };

                                        // Parse contact string (Email vs Phone) - consistent with Widget logic
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

                                        console.log('Creating lead for website:', website.id, leadPayload);
                                        const res = await websiteService.createPublicLead(website.id, leadPayload);
                                        const leadId = res.success ? (res.data?.id || res.id) : (res.data?.id || res.id);

                                        if (leadId) {
                                            identifyLead(leadId, leadPayload.email);
                                        } else if (!res.success) {
                                            console.error('Lead capture response missing success or ID:', res);
                                            throw new Error(res.message || 'Failed to capture lead');
                                        }
                                    } catch (error) {
                                        console.error('Standalone chatbot lead capture error:', error);
                                        throw error;
                                    }
                                }}
                                // Advanced configuration from website settings
                                customWelcomeTitle={
                                    website.configuration?.chatbot?.welcomeMessage ||
                                    website.configuration?.chatbot?.welcomeTitle ||
                                    (data?.[0]?.metadata?.chatbotConfig?.welcomeMessage) ||
                                    (website.tenant?.settings?.chatbotConfig?.welcomeMessage)
                                }
                                customWelcomeSubtext={
                                    website.configuration?.chatbot?.welcomeSubtext ||
                                    (data?.[0]?.metadata?.chatbotConfig?.welcomeSubtext) ||
                                    (website.tenant?.settings?.chatbotConfig?.welcomeSubtext)
                                }
                                leadCaptureMode={
                                    website.configuration?.chatbot?.leadCaptureMode ||
                                    (data?.[0]?.metadata?.chatbotConfig?.leadCaptureMode) ||
                                    (website.tenant?.settings?.chatbotConfig?.leadCaptureMode)
                                }
                                flow={
                                    website.configuration?.chatbot?.flow ||
                                    (data?.[0]?.metadata?.chatbotConfig?.flow) ||
                                    (website.tenant?.settings?.chatbotConfig?.flow)
                                }
                                upsellEnabled={
                                    website.configuration?.chatbot?.upsellEnabled !== undefined ?
                                        website.configuration?.chatbot?.upsellEnabled :
                                        (data?.[0]?.metadata?.chatbotConfig?.upsellEnabled !== undefined ?
                                            data?.[0]?.metadata?.chatbotConfig?.upsellEnabled :
                                            website.tenant?.settings?.chatbotConfig?.upsellEnabled)
                                }
                                crossSellEnabled={
                                    website.configuration?.chatbot?.crossSellEnabled !== undefined ?
                                        website.configuration?.chatbot?.crossSellEnabled :
                                        (data?.[0]?.metadata?.chatbotConfig?.crossSellEnabled !== undefined ?
                                            data?.[0]?.metadata?.chatbotConfig?.crossSellEnabled :
                                            website.tenant?.settings?.chatbotConfig?.crossSellEnabled)
                                }
                                recommendationLogic={
                                    website.configuration?.chatbot?.recommendationLogic ||
                                    (data?.[0]?.metadata?.chatbotConfig?.recommendationLogic) ||
                                    (website.tenant?.settings?.chatbotConfig?.recommendationLogic)
                                }
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
        </div>
    );
}
