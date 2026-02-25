'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { widgetService, marketingService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import { Seats } from '@/types';
import '@/components/modules/realestate/shared/shared.css';

// Import split components
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import UnitDetailView from '@/components/modules/realestate/shared/UnitDetailView';
import ThreeDView from '@/components/modules/realestate/shared/ThreeDView';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';
import PropertyTour from '@/components/modules/realestate/tour/PropertyTour';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import Loader from '@/components/common/Loader';

type ViewType = 'LISTING' | 'PROPERTY_DETAIL' | 'UNIT_DETAIL' | 'THREE_D' | 'TOUR';

export default function PublicWidgetPage() {
    const params = useParams();
    const uniqueId = params?.uniqueId;
    const widgetId = (Array.isArray(uniqueId) ? uniqueId[0] : uniqueId) || '';

    const [widget, setWidget] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>('LISTING');
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [isFiltered, setIsFiltered] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Gallery State
    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [unitImageIndex, setUnitImageIndex] = useState(0);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [leadIdentity, setLeadIdentity] = useState<{ id?: string, email?: string } | null>(null);

    // Initial load: check for stored identity
    useEffect(() => {
        const stored = localStorage.getItem(`widget_lead_${widgetId}`);
        if (stored) {
            try {
                setLeadIdentity(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse lead identity');
            }
        }
    }, [widgetId]);

    const identifyLead = (id: string, email?: string) => {
        const identity = { id, email };
        setLeadIdentity(identity);
        localStorage.setItem(`widget_lead_${widgetId}`, JSON.stringify(identity));
    };

    const trackAction = async (type: string, metadata: any = {}, identityOverride?: { id?: string, email?: string }) => {
        const identity = identityOverride || leadIdentity;
        if (!identity) return;

        try {
            await marketingService.trackInteraction({
                leadId: identity.id,
                email: identity.email,
                type,
                metadata: {
                    widgetId,
                    ...metadata
                }
            });
        } catch (err) {
            console.error('Tracking failed:', err);
        }
    };

    const handleChatFilters = useCallback((filteredResults: any[]) => {
        setFilteredData(filteredResults);
        setIsFiltered(true);
        setCurrentView('LISTING');
        // Scroll to results
        const container = document.querySelector('.widget-container');
        if (container) container.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const loadWidgetData = useCallback(async () => {
        if (!widgetId) return;

        try {
            setLoading(true);
            const response = await widgetService.getPublicWidget(widgetId);
            if (response.success) {
                setWidget(response.widget);
                setData(response.data || []);
                setFilteredData(response.data || []);
            } else {
                setError(response.message || 'Failed to load widget data.');
            }
        } catch (err) {
            setError('Error connecting to the server.');
        } finally {
            setLoading(false);
        }
    }, [widgetId]);

    useEffect(() => {
        loadWidgetData();
    }, [loadWidgetData]);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'REFRESH_WIDGET') {
                loadWidgetData();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [loadWidgetData]);

    // For iframe resizing
    useEffect(() => {
        const sendHeight = () => {
            // Use a more robust way to get the actual content height
            // document.body.scrollHeight can sometimes stay large
            const mainElement = document.getElementById('widget-content-wrapper');
            if (mainElement) {
                const height = mainElement.offsetHeight;
                window.parent.postMessage({ type: 'cw-widget-resize', height }, '*');
            }
        };

        const wrapper = document.getElementById('widget-content-wrapper');
        if (!wrapper) return;

        const resizeObserver = new ResizeObserver(sendHeight);
        resizeObserver.observe(wrapper);

        // Initial height
        sendHeight();

        // Backup periodic check
        const interval = setInterval(sendHeight, 1000);

        return () => {
            resizeObserver.disconnect();
            clearInterval(interval);
        };
    }, [currentView, loading, data]);

    useEffect(() => {
        if (widget) {
            document.title = `${widget.name} | Property Portal`;
        }
    }, [widget]);

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
            <Loader size="md" message="Loading..." />
        </div>
    );

    if (error) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
            <div className="text-center p-5 glass-panel rounded-4">
                <i className="bi bi-exclamation-triangle display-4 text-danger mb-3 d-block"></i>
                <h4 className="fw-bold">Widget Error</h4>
                <p className="text-muted">{error}</p>
                <button className="btn btn-primary rounded-4 px-4 mt-3" onClick={loadWidgetData}>Try Again</button>
            </div>
        </div>
    );

    if (!widget) return null;

    const theme = widget.configuration?.theme || { primaryColor: '#6366f1' };
    const gridCols = widget.configuration?.display?.columns || (data.length === 1 ? 1 : data.length === 2 ? 2 : 3);
    const colClass = gridCols === 1 ? 'col-12' : gridCols === 2 ? 'col-md-6' : 'col-md-6 col-lg-4';


    const mapUnitsToSeats = (units: any[]): Seats[] => {
        return units.map(u => ({
            id: u.id,
            name: u.name || `Unit ${u.unitCode}`,
            slug: u.unitCode || u.id,
            type: (u.unitCategory === 1 ? 'desk' :
                u.unitCategory === 2 ? 'office' :
                    u.unitCategory === 3 ? 'apartment' : 'villa') as any,
            capacity: u.capacity || (u.realEstateDetails?.bedrooms || 1),
            hourlyRate: Number(u.unitPricing?.[0]?.price || 0),
            dailyRate: 0,
            monthlyRate: 0,
            spaceId: u.propertyId,
            features: [],
            status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : 'maintenance',
            createdAt: u.createdAt?.toString() || new Date().toISOString(),
            updatedAt: u.updatedAt?.toString() || new Date().toISOString()
        }));
    };

    const getFormattedPrice = (unit: any) => {
        if (!unit.unitPricing?.length) return 'Contact for Price';
        const pricing = unit.unitPricing[0];
        const label = pricing.pricingModel === 2 ? 'hr' :
            pricing.pricingModel === 3 ? 'day' :
                pricing.pricingModel === 4 ? 'mo' :
                    pricing.pricingModel === 5 ? 'yr' : '';

        // Get currency from tenant country
        const country = widget?.tenant?.country || 'USA';
        const config = getCurrencyConfig(country);
        const symbol = config?.symbol || '$';

        return `${symbol}${Number(pricing.price).toLocaleString()}${label ? `/${label}` : ''}`;
    };

    const renderContent = () => {
        const country = widget?.tenant?.country || 'USA';
        const currencyConfig = getCurrencyConfig(country);
        const currencySymbol = currencyConfig?.symbol || '$';

        switch (currentView) {
            case 'LISTING':
                if (widget.configuration?.settings?.layout === 'builder' || widget.configuration?.pageBuilder?.enabled) {
                    return (
                        <PageBuilder
                            config={widget.configuration.builder || widget.configuration.pageBuilder}
                            data={filteredData}
                            theme={theme}
                            widget={widget}
                            widgetId={widgetId as string}
                            onSelectProperty={(property) => {
                                setSelectedProperty(property);
                                setPropertyImageIndex(0);
                                setCurrentView('PROPERTY_DETAIL');
                                trackAction('PROPERTY_VIEW', { propertyId: property.id });
                                window.scrollTo(0, 0);
                            }}
                        />
                    );
                }
                return (
                    <ListingView
                        filteredData={filteredData}
                        isFiltered={isFiltered}
                        colClass={colClass}
                        theme={theme}
                        widget={widget}
                        widgetId={widgetId as string}
                        onReset={() => {
                            setFilteredData(data);
                            setIsFiltered(false);
                        }}
                        onSelectProperty={(property) => {
                            setSelectedProperty(property);
                            setPropertyImageIndex(0);
                            setCurrentView('PROPERTY_DETAIL');
                            trackAction('PROPERTY_VIEW', { propertyId: property.id });
                            window.scrollTo(0, 0);
                        }}
                        trackAction={trackAction}
                        identifyLead={identifyLead}
                    />
                );
            case 'PROPERTY_DETAIL':
                return (
                    <PropertyDetailView
                        selectedProperty={selectedProperty}
                        propertyImageIndex={propertyImageIndex}
                        setPropertyImageIndex={setPropertyImageIndex}
                        theme={theme}
                        widget={widget}
                        widgetId={widgetId as string}
                        colClass={colClass}
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
                        widget={widget}
                        widgetId={widgetId as string}
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
                        mapUnitsToSeats={mapUnitsToSeats}
                        currencySymbol={currencySymbol}
                    />
                );
            case 'TOUR':
                return (
                    <div className="container">
                        <div className="tour-view animate-fade-in widget-container">
                            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm">
                                <div>
                                    <h5 className="fw-extrabold mb-0 d-flex align-items-center">
                                        <i className="bi bi-box-fill me-2 text-primary"></i>
                                        Immersive Property Tour
                                    </h5>
                                    <p className="extra-small text-muted mb-0">{selectedProperty?.title}</p>
                                </div>
                                <button className="btn btn-outline-dark btn-sm rounded-4 px-4 fw-bold" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                                    <i className="bi bi-x-circle me-2"></i>Exit Tour
                                </button>
                            </div>
                            <PropertyTour propertyId={selectedProperty?.id || ''} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const config = widget?.configuration?.builder || widget?.configuration?.pageBuilder || {};
    const isBuilderLayout = widget?.configuration?.settings?.layout === 'builder' || widget?.configuration?.pageBuilder?.enabled;

    const isBuilderActiveListing = currentView === 'LISTING' && isBuilderLayout;


    return (
        <div id="widget-content-wrapper" className="public-widget bg-white overflow-hidden" style={{ '--primary-color': theme.primaryColor } as any}>
            <main>
                {renderContent()}
            </main>

            {/* Chatbot Integration */}
            {widget?.configuration?.chatbot?.enabled && (
                <>
                    <button
                        className="btn rounded-circle shadow-lg floating-chat-btn d-flex align-items-center justify-content-center animate-bounce"
                        style={{
                            backgroundColor: theme.primaryColor,
                            width: '60px',
                            height: '60px',
                            bottom: '24px',
                            right: '24px',
                            position: 'fixed'
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
                                onFilterResults={handleChatFilters}
                                theme={theme}
                                trackAction={trackAction}
                                onClose={() => {
                                    setShowChat(false);
                                    setChatExpanded(false);
                                }}
                                onExpandToggle={(exp) => setChatExpanded(exp)}
                                onSelectProperty={(prop) => {
                                    setSelectedProperty(prop);
                                    setPropertyImageIndex(0);
                                    setCurrentView('PROPERTY_DETAIL');
                                    setShowChat(false);
                                    setChatExpanded(false);
                                }}
                                onCreateLead={async (contact: string, name?: string) => {
                                    try {
                                        const leadPayload: any = {
                                            source: 'widget_chatbot',
                                            notes: `Automated Chatbot Engagement via Widget`,
                                            name: name || 'Chatbot Inquiry'
                                        };

                                        // Parse contact string (Email vs Phone)
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

                                        const res = await widgetService.createPublicLead(uniqueId as string, leadPayload);
                                        const leadId = res.success ? (res.data?.id || res.id) : (res.data?.id || res.id);

                                        if (leadId) {
                                            identifyLead(leadId, leadPayload.email);
                                        } else if (!res.success) {
                                            throw new Error(res.message || 'Failed to capture lead');
                                        }
                                    } catch (error) {
                                        console.error('Widget chatbot lead capture error:', error);
                                        throw error;
                                    }
                                }}
                                // Advanced configuration
                                customWelcomeTitle={
                                    widget?.configuration?.chatbot?.welcomeMessage ||
                                    (data?.[0]?.metadata?.chatbotConfig?.welcomeMessage) ||
                                    (widget?.tenant?.settings?.chatbotConfig?.welcomeMessage)
                                }
                                customWelcomeSubtext={
                                    widget?.configuration?.chatbot?.welcomeSubtext ||
                                    (data?.[0]?.metadata?.chatbotConfig?.welcomeSubtext) ||
                                    (widget?.tenant?.settings?.chatbotConfig?.welcomeSubtext)
                                }
                                leadCaptureMode={
                                    data?.[0]?.metadata?.chatbotConfig?.leadCaptureMode ||
                                    widget?.tenant?.settings?.chatbotConfig?.leadCaptureMode
                                }
                                flow={
                                    data?.[0]?.metadata?.chatbotConfig?.flow ||
                                    widget?.tenant?.settings?.chatbotConfig?.flow
                                }
                                upsellEnabled={
                                    data?.[0]?.metadata?.chatbotConfig?.upsellEnabled !== undefined ?
                                        data?.[0]?.metadata?.chatbotConfig?.upsellEnabled :
                                        widget?.tenant?.settings?.chatbotConfig?.upsellEnabled
                                }
                                crossSellEnabled={
                                    data?.[0]?.metadata?.chatbotConfig?.crossSellEnabled !== undefined ?
                                        data?.[0]?.metadata?.chatbotConfig?.crossSellEnabled :
                                        widget?.tenant?.settings?.chatbotConfig?.crossSellEnabled
                                }
                                recommendationLogic={
                                    data?.[0]?.metadata?.chatbotConfig?.recommendationLogic ||
                                    widget?.tenant?.settings?.chatbotConfig?.recommendationLogic
                                }
                            />
                        </div>
                    )}
                </>
            )}
        </div >
    );
}
