'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { widgetService } from '@/app/services/api';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import { Seats } from '@/types';
import './widget.css';

// Import split components
import ListingView from './components/ListingView';
import PropertyDetailView from './components/PropertyDetailView';
import UnitDetailView from './components/UnitDetailView';
import ThreeDView from './components/ThreeDView';
import PageBuilder from './components/PageBuilder';
import PropertyTour from '@/components/modules/realestate/tour/PropertyTour';

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

    // Send height to parent for iframe resizing
    useEffect(() => {
        const sendHeight = () => {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ type: 'WIDGET_HEIGHT', height }, '*');
        };
        const resizeObserver = new ResizeObserver(sendHeight);
        resizeObserver.observe(document.body);
        sendHeight();
        return () => resizeObserver.disconnect();
    }, [currentView, loading, data]);

    useEffect(() => {
        if (widget) {
            document.title = `${widget.name} | Property Portal`;
        }
    }, [widget]);

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="text-center p-5 glass-panel rounded-4">
                <i className="bi bi-exclamation-triangle display-4 text-danger mb-3 d-block"></i>
                <h4 className="fw-bold">Widget Error</h4>
                <p className="text-muted">{error}</p>
                <button className="btn btn-primary rounded-pill px-4 mt-3" onClick={loadWidgetData}>Try Again</button>
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

        return `$${Number(pricing.price).toLocaleString()}${label ? `/${label}` : ''}`;
    };

    const renderContent = () => {
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
                        }}
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
                        setSelectedUnit={setSelectedUnit}
                        setUnitImageIndex={setUnitImageIndex}
                        getFormattedPrice={getFormattedPrice}
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
                                <button className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
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
        <div className="public-widget min-vh-100 bg-white" style={{ '--primary-color': theme.primaryColor } as any}>
            {/* Header: Show standard header ONLY if NOT in the builder landing page itself AND if builder logo isn't globally disabled */}
            {!isBuilderActiveListing && config?.showLogo !== false && (
                <header className="p-3 bg-white border-bottom sticky-top shadow-sm z-3">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div className="property-logo">
                            {config?.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                            ) : (
                                <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: theme.primaryColor }}>
                                    <i className="bi bi-house-heart-fill text-white fs-5"></i>
                                </div>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <button className="btn btn-primary btn-sm rounded-pill px-4" style={{ backgroundColor: theme.primaryColor, border: 'none' }} onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                                <i className="bi bi-building-fill me-2"></i>Properties
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main>
                {currentView === 'LISTING' && !isBuilderLayout && (config?.heroTitle || config?.heroBgUrl) && config?.showHero !== false && (
                    <section className="container-md widget-hero py-10 mb-2 position-relative overflow-hidden" style={{
                        backgroundColor: theme.primaryColor || '#f8f9fa',
                        backgroundImage: config?.heroBgUrl ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${config.heroBgUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: (config?.heroBgUrl || config?.heroTitle) ? (config?.heroTextColor || '#ffffff') : 'inherit',
                        minHeight: config?.heroBgUrl ? (isBuilderLayout ? '550px' : '400px') : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        textAlign: 'center',
                        marginTop: '-1px',
                    }}>
                        <div className="container position-relative z-1 py-4">
                            <h1 className="display-4 fw-extrabold mb-3 animate-fade-up letter-spacing-tight hero-title">
                                {config?.heroTitle || 'Premium Real Estate'}
                            </h1>
                            {config?.heroSubtitle && (
                                <p className="lead mb-0 opacity-90 animate-fade-up mx-auto hero-subtitle" style={{ maxWidth: '700px', animationDelay: '0.1s' }}>
                                    {config?.heroSubtitle}
                                </p>
                            )}
                        </div>
                    </section>
                )}
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
                                    const leadPayload: any = {
                                        source: 'widget_chatbot',
                                        notes: `Automated Chatbot Engagement`,
                                        name: name || 'Chatbot Inquiry'
                                    };
                                    if (contact.includes('@')) leadPayload.email = contact;
                                    else leadPayload.phone = contact;

                                    await widgetService.createPublicLead(widgetId as string, leadPayload);
                                }}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Global Footer: Hide if in builder landing page (it has its own) OR if footer is disabled in config */}
            {!isBuilderActiveListing && config?.showFooter !== false && (
                <footer className="py-5 bg-light border-top mt-5 mb-2">
                    <div className="container text-center">
                        <div className="mb-4 text-muted">
                            {config?.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" style={{ height: '50px', objectFit: 'contain', margin: 'auto' }} className="mb-2" />
                            ) : (
                                <i className="bi bi-building fs-3 text-muted">Your Company Name</i>
                            )}
                            <div>
                                <i className="bi bi-patch-check-fill text-primary" style={{ color: theme.primaryColor }}></i> Verified Real Estate Portal
                            </div>
                        </div>
                        <p className="extra-small text-muted mb-0">

                            {config?.footerText || `© 2026 ${widget.name}. All rights reserved.`}
                        </p>
                    </div>
                </footer>
            )
            }
        </div >
    );
}
