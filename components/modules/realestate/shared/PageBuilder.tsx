'use client';

import React from 'react';
import ListingView from './ListingView';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import DiscoveryFilter from './DiscoveryFilter';

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
}

const PageBuilder: React.FC<PageBuilderProps> = ({ config, data, theme, widget, widgetId, onSelectProperty, onFilter, trackAction, hideHero = false }) => {

    // ── Modular Modules Renderer ───────────────────────────────────────────
    const modules = config.modules || [];

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
                                                {/* <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-40" style={{ zIndex: 0 }}></div> */}
                                                <div className="container position-relative z-1 py-5">
                                                    <h1 className="display-2 fw-black mb-3 animate-fade-up">{slide.title}</h1>
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
                                        <h2 className="fw-bold display-5 mb-2" style={{ color: theme.primaryColor }}>{moduleData.title || 'Featured Collections'}</h2>
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
                                                                {prop.currency || '$'}{Number(prop.price).toLocaleString('en-US')}
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
                                                    <FormRenderer
                                                        config={widget.configuration.inquiryForm}
                                                        primaryColor={theme.primaryColor}
                                                        onSubmit={async (formData, configUsed) => {
                                                            const leadPayload: any = {
                                                                source: 1,
                                                                notes: `Modular Inquiry: ${widget.name}\n${configUsed.fields.map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                                            };
                                                            await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);
                                                        }}
                                                    />
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
                                    />
                                </div>
                            </div>
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
                    />
                </div>
            )}

            <style jsx global>{`
                .hero-slider-section .swiper-button-next,
                .hero-slider-section .swiper-button-prev,
                .property-slider-section .swiper-button-next,
                .property-slider-section .swiper-button-prev {
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
