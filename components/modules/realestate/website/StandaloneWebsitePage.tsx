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
import { trackPropertyView } from '@/app/hooks/useIntelligentPopup';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

import { Property, Unit } from '@/types';
import '@/components/modules/realestate/shared/shared.css';

import ModernTheme from './themes/ModernTheme';
import MinimalisticTheme from './themes/MinimalisticTheme';
import TraditionalTheme from './themes/TraditionalTheme';

type ViewType = 'LISTING' | 'PROPERTY_DETAIL' | 'UNIT_DETAIL';

interface StandaloneWebsitePageProps {
    slugOrDomain: string;
}

export default function StandaloneWebsitePage({ slugOrDomain }: StandaloneWebsitePageProps) {
    const [website, setWebsite] = useState<any>(null);
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

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let vid = localStorage.getItem('virpanix_visitor_id');
        if (!vid) {
            vid = window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 15);
            localStorage.setItem('virpanix_visitor_id', vid);
        }

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
                    setUserContext({ city: Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1] });
                });
        }

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

    useEffect(() => {
        if (!website?.configuration?.theme?.fontFamily) return;
        const font = website.configuration.theme.fontFamily;
        const fontId = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
            document.head.appendChild(link);
        }
    }, [website?.configuration?.theme?.fontFamily]);

    // Auto-track property views for the matching engine
    useEffect(() => {
        if (selectedProperty && currentView === 'PROPERTY_DETAIL') {
            trackPropertyView(selectedProperty.id);
            trackAction('PROPERTY_VIEW', { propertyId: selectedProperty.id });
        }
    }, [selectedProperty, currentView]);

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
                visitorId: leadIdentity.visitorId,
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

    const tenantSettings = website?.tenant?.settings || {};
    const baseCurrency = tenantSettings.general?.currency;
    const currencyConfig = getCurrencyConfig(baseCurrency || website?.tenant?.country);
    const currencySymbol = currencyConfig?.symbol || '$';

    const getFormattedPrice = (unit: Unit) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        const label = pricing.pricingModel === 2 ? 'hr' :
            pricing.pricingModel === 3 ? 'day' :
                pricing.pricingModel === 4 ? 'mo' :
                    pricing.pricingModel === 5 ? 'yr' : '';
        return `${currencySymbol}${Number(pricing.price).toLocaleString('en-US')}${label ? `/${label}` : ''}`;
    };

    const handleFilterResults = useCallback((results: Property[]) => {
        setFilteredData(results);
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

    const theme = website?.configuration?.theme || { primaryColor: '#6366f1', fontFamily: 'Outfit, sans-serif', template: 'modern' };
    const builder = website?.configuration?.builder || {};
    const chatbotConfig = {
        ...(website?.tenant?.settings?.chatbotConfig || {}),
        ...(data?.[0]?.metadata?.chatbotConfig || {}),
        ...(website?.configuration?.chatbot || {}),
        welcomeMessage: website?.configuration?.chatbot?.welcomeMessage ||
            website?.configuration?.chatbot?.welcomeTitle ||
            data?.[0]?.metadata?.chatbotConfig?.welcomeMessage ||
            website?.tenant?.settings?.chatbotConfig?.welcomeMessage
    };

    const renderView = () => {
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
                            trackPropertyView(property.id);
                            setPropertyImageIndex(0);
                            setCurrentView('PROPERTY_DETAIL');
                            trackAction('PROPERTY_VIEW', { propertyId: property.id });
                        }}
                        onFilter={(filters) => {}}
                        currencySymbol={currencySymbol}
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
                            trackPropertyView(property.id);
                            setPropertyImageIndex(0);
                            setCurrentView('PROPERTY_DETAIL');
                        }}
                        colClass={builder.gridStrategy === 'list' ? 'col-12' : ''}
                        currencySymbol={currencySymbol}
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
            default:
                return null;
        }
    };

    const currentTemplate = theme.template || 'modern';
    const ThemeWrapper = currentTemplate === 'minimalistic' ? MinimalisticTheme :
        currentTemplate === 'traditional' ? TraditionalTheme : ModernTheme;

    return (
        <>
            <ThemeWrapper
                website={website}
                theme={theme}
                builder={builder}
                setCurrentView={setCurrentView}
                setShowBookingModal={setShowBookingModal}
                showMobileMenu={showMobileMenu}
                setShowMobileMenu={setShowMobileMenu}
                trackAction={trackAction}
                currencySymbol={currencySymbol}
            >
                {renderView()}
            </ThemeWrapper>

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
                                    trackPropertyView(prop.id);
                                    setCurrentView('PROPERTY_DETAIL');
                                    setShowChat(false);
                                    setChatExpanded(false);
                                    window.scrollTo(0, 0);
                                }}
                                customWelcomeTitle={chatbotConfig.welcomeMessage}
                                customWelcomeSubtext={chatbotConfig.welcomeSubtext}
                                leadCaptureMode={chatbotConfig.leadCaptureMode}
                                flow={chatbotConfig.flow}
                                upsellEnabled={chatbotConfig.upsellEnabled}
                                crossSellEnabled={chatbotConfig.crossSellEnabled}
                                recommendationLogic={chatbotConfig.recommendationLogic}
                                budgetRanges={chatbotConfig.budgetRanges}
                                currencySymbol={currencySymbol}
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
                                        const vid = localStorage.getItem('virpanix_visitor_id');
                                        if (vid) leadPayload.visitorId = vid;
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

            {website?.id && (
                <PopupRenderer
                    websiteId={website.id}
                    theme={theme}
                    properties={data}
                    trackAction={trackAction}
                    onIdentify={identifyLead}
                />
            )}
        </>
    );
}
