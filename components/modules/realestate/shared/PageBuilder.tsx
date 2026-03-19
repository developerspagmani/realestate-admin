'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ListingView from './ListingView';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import DiscoveryFilter from './DiscoveryFilter';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PageBuilderProps {
    config: any;
    data: any[];
    theme: any;
    widget: any;
    widgetId: string;
    onSelectProperty: (property: any) => void;
    onFilter?: (filters: any) => void;
    trackAction?: (type: string, metadata?: any, identity?: { id?: string, email?: string }) => void;
    hideHero?: boolean;
    currencySymbol?: string;
}

const PageBuilder: React.FC<PageBuilderProps> = ({ config, data, theme, widget, widgetId, onSelectProperty, onFilter, trackAction, hideHero = false, currencySymbol }) => {

    const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxItems, setLightboxItems] = useState<string[]>([]);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextIndex = (lightboxIndex + 1) % lightboxItems.length;
        setLightboxIndex(nextIndex);
        setActiveLightboxImage(lightboxItems[nextIndex]);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prevIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        setLightboxIndex(prevIndex);
        setActiveLightboxImage(lightboxItems[prevIndex]);
    };

    // ── Modular Modules Renderer ───────────────────────────────────────────
    const modules = config.modules || [];

    const getSymbol = (propertyCountry?: string) => {
        if (currencySymbol) return currencySymbol;
        const tenantSettings = widget?.tenant?.settings || {};
        const baseCurrency = tenantSettings.general?.currency;
        const tenantCountry = widget?.tenant?.country;
        const input = baseCurrency || tenantCountry || propertyCountry || 'USA';
        const currConfig = getCurrencyConfig(input);
        return currConfig?.symbol || '$';
    };

    return (
        <div className="page-builder-modular">
            {modules.map((module: any, index: number) => {
                const moduleData = module.data || {};
                const style = {
                    backgroundColor: moduleData.bgColor || 'transparent',
                    color: moduleData.textColor || 'inherit',
                };

                switch (module.type) {
                    case 'hero-slider':
                        if (hideHero) return null;
                        // Support both single imageUrl and multiple slides
                        let slides = moduleData.slides || [];

                        if (slides.length === 0) {
                            slides = [{
                                imageUrl: moduleData.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
                                title: moduleData.title || 'Experience Luxury Living',
                                subtitle: moduleData.description || 'Find your dream home in the world\'s most exclusive locations.'
                            }];
                        }

                        return (
                            <section key={module.id || index} className="hero-slider-section position-relative overflow-hidden">
                                <Swiper
                                    modules={[Autoplay, EffectFade, Navigation, Pagination]}
                                    effect="fade"
                                    autoplay={{ delay: 5000 }}
                                    navigation
                                    pagination={{ clickable: true }}
                                    loop={slides.length > 1}
                                    className="h-100"
                                    style={{ minHeight: '650px' }}
                                >
                                    {slides.map((slide: any, i: number) => (
                                        <SwiperSlide key={i}>
                                            <div className="w-100 h-100 position-relative d-flex align-items-center justify-content-center text-center text-white" style={{ minHeight: '650px' }}>
                                                <img
                                                    src={slide.imageUrl}
                                                    className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                                                    style={{ zIndex: -1 }}
                                                    alt={slide.title}
                                                />
                                                <div className="overlay" style={{ backgroundColor: theme.primaryColor, opacity: 0.1 }}></div>
                                                {/* <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-40" style={{ zIndex: 0 }}></div> */}
                                                <div className="container position-relative z-1 py-5">
                                                    <h1 className="display-2 fw-bold mb-3 animate-fade-up">{slide.title}</h1>
                                                    <p className="lead mb-4 opacity-90 animate-fade-up delay-100">{slide.subtitle}</p>
                                                    {slide.buttonText && (
                                                        <div className="animate-fade-up delay-200">
                                                            <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-lg" style={{ backgroundColor: theme.primaryColor, border: 'none' }}>
                                                                {slide.buttonText}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </section>
                        );

                    case 'search':
                        return (
                            <section key={module.id || index} className="search-section py-5" style={style}>
                                <div className="container">
                                    {(moduleData.title || moduleData.description) && (
                                        <div className="text-center mb-5">
                                            {moduleData.title && <h2 className="fw-black display-5 mb-3">{moduleData.title}</h2>}
                                            {moduleData.description && <p className="lead opacity-75 max-w-2xl mx-auto">{moduleData.description}</p>}
                                        </div>
                                    )}
                                    <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                                        <DiscoveryFilter onFilter={onFilter!} theme={theme} />
                                    </div>
                                </div>
                            </section>
                        );

                    case 'text-image':
                    case 'image-text':
                        const isReverse = module.type === 'image-text';
                        return (
                            <section key={module.id || index} className="py-5" style={style}>
                                <div className="container">
                                    <div className={`row align-items-center g-5 ${isReverse ? 'flex-row-reverse' : ''}`}>
                                        <div className="col-lg-6">
                                            <h2 className="fw-black h1 mb-4">{moduleData.title}</h2>
                                            <p className="lead opacity-75 mb-4 text-dark">{moduleData.description}</p>
                                            {moduleData.buttonText && (
                                                <button className="btn btn-primary rounded-pill px-5 py-3 shadow-lg" style={{ backgroundColor: theme.primaryColor, border: 'none' }}>
                                                    {moduleData.buttonText}
                                                </button>
                                            )}
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="position-relative">
                                                <img
                                                    src={moduleData.imageUrl}
                                                    className="img-fluid rounded-4 shadow-2xl"
                                                    alt={moduleData.title}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );

                    case 'property-slider':
                        const featuredIds = moduleData.propertyIds || [];
                        const sliderData = featuredIds.length > 0
                            ? data.filter(p => featuredIds.includes(p.id))
                            : data.slice(0, 6);

                        return (
                            <section key={module.id || index} className="py-5 property-slider-section border-top border-bottom" style={style}>
                                <div className="container">
                                    <div className="text-center mb-5">
                                        <h3 className="fw-bold mb-2" style={{ color: theme.primaryColor }}>{moduleData.title || 'Featured Collections'}</h3>
                                        <p className="lead opacity-75" style={{ color: theme.primaryColor }}>{moduleData.description || 'Handpicked properties from our premium portfolio'}</p>
                                    </div>

                                    <Swiper
                                        modules={[Navigation, Pagination, Autoplay]}
                                        spaceBetween={24}
                                        slidesPerView={1}
                                        navigation
                                        pagination={{ clickable: true }}
                                        breakpoints={{
                                            640: { slidesPerView: 1.5 },
                                            768: { slidesPerView: 2 },
                                            1024: { slidesPerView: 3 },
                                        }}
                                        className="property-swiper pb-5"
                                    >
                                        {sliderData.map((prop) => (
                                            <SwiperSlide key={prop.id}>
                                                <div
                                                    className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 property-card transition-all cursor-pointer hvr-float"
                                                    onClick={() => onSelectProperty(prop)}
                                                >
                                                    <div className="position-relative" style={{ height: '260px' }}>
                                                        <img src={prop.mainImage?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} className="w-100 h-100 object-fit-cover" alt="" />
                                                        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 bg-white rounded-pill shadow-sm extra-small fw-bold text-primary">
                                                            {prop.category?.name || 'Luxury'}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white">
                                                        <h4 className="fw-bold h5 mb-2 text-truncate">{prop.title}</h4>
                                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                                            <div className="h5 fw-black mb-0" style={{ color: theme.primaryColor }}>
                                                                {getSymbol(prop.country)}{Number(prop.price).toLocaleString('en-US')}
                                                            </div>
                                                            <div className="extra-small text-muted text-uppercase fw-bold tracking-wider">
                                                                <i className="bi bi-geo-alt-fill me-1"></i> {prop.city}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </section>
                        );

                    case 'full-width-image':
                        return (
                            <section key={module.id || index} className="position-relative overflow-hidden w-100" style={{ minHeight: '550px', display: 'flex', alignItems: 'center' }}>
                                <img
                                    src={moduleData.imageUrl}
                                    className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                                    style={{ zIndex: -1 }}
                                    alt=""
                                />
                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4))', zIndex: 0 }}></div>
                                <div className="container position-relative z-1 text-center text-white py-5">
                                    <h2 className="display-2 fw-black mb-3 animate-fade-up">{moduleData.title}</h2>
                                    <p className="lead mb-5 opacity-90 animate-fade-up delay-100 mx-auto" style={{ maxWidth: '700px' }}>{moduleData.description}</p>
                                    {moduleData.buttonText && (
                                        <div className="animate-fade-up delay-200">
                                            <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-lg hvr-grow" style={{ backgroundColor: theme.primaryColor, border: 'none' }}>
                                                {moduleData.buttonText}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        );

                    case 'typography':
                        return (
                            <section key={module.id || index} className="py-6" style={style}>
                                <div className="container text-center py-5">
                                    <div className="mx-auto" style={{ maxWidth: '900px' }}>
                                        <h2 className="display-3 fw-black mb-4">{moduleData.title}</h2>
                                        <p className="lead opacity-80" style={{ lineHeight: '1.8' }}>{moduleData.description}</p>
                                    </div>
                                </div>
                            </section>
                        );

                    case 'inquiry':
                        return (
                            <section key={module.id || index} className="py-5" style={style}>
                                <div className="container">
                                    <div className="bg-white rounded-5 shadow-2xl p-4 p-lg-5 border-0 overflow-hidden position-relative">
                                        <div className="row g-5 align-items-center">
                                            <div className="col-lg-5">
                                                <div className="pe-lg-4">
                                                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3 fw-bold">Contact Agent</span>
                                                    <h2 className="fw-black display-4 mb-4">{moduleData.title || 'Start Your Journey'}</h2>
                                                    <p className="lead text-muted mb-4">{moduleData.description || 'Our expert consultants are here to guide you through every step of your real estate investment.'}</p>

                                                    <div className="d-flex flex-column gap-3 mt-5">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="rounded-circle bg-light p-3 text-primary"><i className="bi bi-clock"></i></div>
                                                            <div><div className="fw-bold">Fast Response</div><div className="extra-small text-muted">Typically under 24 hours</div></div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="rounded-circle bg-light p-3 text-primary"><i className="bi bi-shield-check"></i></div>
                                                            <div><div className="fw-bold">Secured & Private</div><div className="extra-small text-muted">Your data is safe with us</div></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-7">
                                                <div className="form-wrapper bg-light rounded-4 p-4 shadow-sm">
                                                    {(() => {
                                                        const inquiryConfig = (widget.configuration?.inquiryForm?.useMarketingForm && widget.configuration?.inquiryForm?.marketingFormId)
                                                            ? widget.configuration.inquiryForm
                                                            : (widget.configuration.inquiryForm && widget.configuration.inquiryForm.enabled)
                                                                ? widget.configuration.inquiryForm
                                                                : {
                                                                    enabled: true,
                                                                title: 'Send an Inquiry',
                                                                description: 'Our consultants will get back to you shortly.',
                                                                submitButtonLabel: 'Submit Message',
                                                                fields: [
                                                                    { id: 'f1', type: 'text', label: 'Full Name', required: true, placeholder: 'Your Name' },
                                                                    { id: 'f2', type: 'email', label: 'Email Address', required: true, placeholder: 'email@example.com' },
                                                                    { id: 'f3', type: 'phone', label: 'Phone Number', required: false, placeholder: '+1 234 567 890' },
                                                                    { id: 'f4', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help you?' }
                                                                ]
                                                            };

                                                        return (
                                                            <FormRenderer
                                                                config={inquiryConfig}
                                                                primaryColor={theme.primaryColor}
                                                                onSubmit={async (formData, configUsed) => {
                                                                    const leadPayload: any = {
                                                                        source: 1,
                                                                        notes: `Modular Inquiry: ${widget.name}`
                                                                    };
                                                                    
                                                                    // Extract fields based on common IDs or Types
                                                                    (configUsed.fields || []).forEach((field: any) => {
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
                                                                            // Remove currency symbols and commas before parsing
                                                                            const cleanedBudget = String(val).replace(/[^\d.]/g, '');
                                                                            leadPayload.budget = Number(cleanedBudget) || 0;
                                                                        } else if (label.includes('company') || fid.includes('company')) {
                                                                            leadPayload.company = val;
                                                                        } else {
                                                                            leadPayload.notes += `\n${field.label}: ${val}`;
                                                                        }
                                                                    });

                                                                    await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );

                    case 'LISTING':
                        return (
                            <div key={module.id || index} className="pb-listing py-5" style={style}>
                                <div className="container">
                                    {moduleData.title && (
                                        <div className="mb-4 text-center">
                                            <h2 className="fw-bold">{moduleData.title}</h2>
                                            {moduleData.description && <p className="text-muted">{moduleData.description}</p>}
                                        </div>
                                    )}
                                    <ListingView
                                        filteredData={data}
                                        isFiltered={false}
                                        colClass=""
                                        theme={theme}
                                        widget={widget}
                                        widgetId={widgetId}
                                        onReset={() => { }}
                                        onSelectProperty={onSelectProperty}
                                        onFilter={onFilter}
                                        trackAction={trackAction}
                                        currencySymbol={currencySymbol}
                                    />
                                </div>
                            </div>
                        );

                    case 'gallery':
                        const galleryLayout = moduleData.layout || 'grid';
                        const galleryItems = moduleData.items || [];
                        const cols = moduleData.columns || 3;
                        const gapSize = moduleData.gap || 'g-3';

                        return (
                            <section key={module.id || index} className="py-5 gallery-section" style={style}>
                                <div className="container">
                                    {(moduleData.title || moduleData.description) && (
                                        <div className="text-center mb-5">
                                            {moduleData.title && <h2 className="fw-black h1 mb-3">{moduleData.title}</h2>}
                                            {moduleData.description && <p className="lead opacity-75">{moduleData.description}</p>}
                                        </div>
                                    )}

                                    {galleryLayout === 'swiper' ? (
                                        <Swiper
                                            modules={[Navigation, Pagination, Autoplay]}
                                            spaceBetween={20}
                                            slidesPerView={1}
                                            navigation
                                            pagination={{ clickable: true }}
                                            breakpoints={{
                                                640: { slidesPerView: 2 },
                                                1024: { slidesPerView: 3 },
                                            }}
                                            autoplay={{ delay: 3000 }}
                                            className="pb-5 gallery-swiper"
                                        >
                                            {galleryItems.map((img: string, i: number) => (
                                                <SwiperSlide key={i}>
                                                    <div className="ratio ratio-4x3 rounded-4 shadow-sm overflow-hidden hvr-zoom cursor-pointer shadow-hover" onClick={() => {
                                                        setLightboxItems(galleryItems);
                                                        setLightboxIndex(i);
                                                        setActiveLightboxImage(img);
                                                    }}>
                                                        <img src={img} className="object-fit-cover w-100 h-100" alt="Gallery item" />
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    ) : (
                                        <div className={`row ${gapSize}`}>
                                            {galleryItems.map((img: string, i: number) => (
                                                <div key={i} className={`col-sm-6 col-md-${12 / cols}`}>
                                                    <div className="ratio ratio-1x1 rounded-4 shadow-sm overflow-hidden hvr-float cursor-pointer shadow-hover" onClick={() => {
                                                        setLightboxItems(galleryItems);
                                                        setLightboxIndex(i);
                                                        setActiveLightboxImage(img);
                                                    }}>
                                                        <img src={img} className="object-fit-cover w-100 h-100 animate-fade-in" alt="Gallery item" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        );

                    default:
                        return null;
                }
            })}

            {/* Fallback rendering for old sites or if Listing is not explicitly added */}
            {(!modules || modules.length === 0) && (
                <div className="container py-5">
                    <ListingView
                        filteredData={data}
                        isFiltered={false}
                        colClass=""
                        theme={theme}
                        widget={widget}
                        widgetId={widgetId}
                        onReset={() => { }}
                        onSelectProperty={onSelectProperty}
                        onFilter={onFilter}
                        trackAction={trackAction}
                        currencySymbol={currencySymbol}
                    />
                </div>
            )}

            {/* Gallery Lightbox Modal - Using Portals to break out of transformed parents */}
            {activeLightboxImage && typeof document !== 'undefined' && createPortal(
                <div className="animate-fade-in px-3" 
                     style={{ 
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.95)', 
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                     }}
                     onClick={() => setActiveLightboxImage(null)}>
                    
                    {/* Navigation Arrows */}
                    {lightboxItems.length > 1 && (
                        <>
                            <button className="btn btn-link text-white position-absolute start-0 ms-4 p-3 hvr-grow d-none d-md-block" 
                                    style={{ zIndex: 100002, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}
                                    onClick={handlePrev}>
                                <i className="bi bi-chevron-left fs-1"></i>
                            </button>
                            <button className="btn btn-link text-white position-absolute end-0 me-4 p-3 hvr-grow d-none d-md-block" 
                                    style={{ zIndex: 100002, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}
                                    onClick={handleNext}>
                                <i className="bi bi-chevron-right fs-1"></i>
                            </button>
                        </>
                    )}

                    <div className="position-relative animate-zoom-in" style={{ maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-white rounded-circle position-absolute top-0 end-0 m-2 m-lg-n4 shadow-lg d-flex align-items-center justify-content-center border-0 transition-all cursor-pointer hvr-grow" 
                                style={{ zIndex: 100005, width: '48px', height: '48px', background: '#fff' }}
                                onClick={() => setActiveLightboxImage(null)}>
                            <i className="bi bi-x-lg text-dark fs-4"></i>
                        </button>
                        
                        <img src={activeLightboxImage} 
                             className="img-fluid rounded-4 shadow-2xl" 
                             style={{ maxHeight: '85vh', objectFit: 'contain', display: 'block' }} 
                             alt="Full view" />

                        {/* Pagination Counter */}
                        {lightboxItems.length > 1 && (
                            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-n5 bg-white bg-opacity-10 text-white px-4 py-2 rounded-pill fw-bold small border border-white border-opacity-10 shadow">
                                {lightboxIndex + 1} / {lightboxItems.length}
                            </div>
                        )}
                    </div>

                    {/* Mobile Navigation Area (Invisible overlay to tap sides) */}
                    <div className="d-md-none d-flex w-100 h-100 position-absolute top-0 start-0 pointer-events-none">
                        <div className="flex-grow-1 pointer-events-auto" style={{ cursor: 'w-resize' }} onClick={handlePrev}></div>
                        <div className="flex-grow-1 pointer-events-auto" style={{ cursor: 'e-resize' }} onClick={handleNext}></div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx global>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-zoom-in {
                    animation: zoomIn 0.3s ease-out forwards;
                }
                .z-index-modal { z-index: 10000; }
                .shadow-hover:hover { box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; }
                
                .hero-slider-section .swiper-button-next,
                .hero-slider-section .swiper-button-prev,
                .property-slider-section .swiper-button-next,
                .property-slider-section .swiper-button-prev,
                .gallery-section .swiper-button-next,
                .gallery-section .swiper-button-prev {
                    color: white;
                    background: rgba(0,0,0,0.3);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                .property-slider-section .swiper-button-next,
                .property-slider-section .swiper-button-prev {
                    background: white;
                    color: #000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    width: 44px;
                    height: 44px;
                }
                .hero-slider-section .swiper-button-next:hover,
                .hero-slider-section .swiper-button-prev:hover,
                .property-slider-section .swiper-button-next:hover,
                .property-slider-section .swiper-button-prev:hover {
                    background: ${theme.primaryColor};
                    color: white;
                    transform: scale(1.1);
                }
                .hero-slider-section .swiper-button-next::after,
                .hero-slider-section .swiper-button-prev::after,
                .property-slider-section .swiper-button-next::after,
                .property-slider-section .swiper-button-prev::after {
                    font-size: 18px;
                    font-weight: bold;
                }
                .hero-slider-section .swiper-button-prev svg,
                .hero-slider-section .swiper-button-next svg{
                    height: 36px;
                    width: 36px;
                    
                }
                .hero-slider-section .swiper-pagination-bullet,
                .property-slider-section .swiper-pagination-bullet {
                    background: ${theme.primaryColor} !important;
                    opacity: 0.3;
                }
                .hero-slider-section .swiper-pagination-bullet-active,
                .property-slider-section .swiper-pagination-bullet-active {
                    opacity: 1;
                    width: 24px;
                    border-radius: 12px;
                }
                .hero-slider-section .swiper-pagination-bullet {
                    background: white;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default PageBuilder;
