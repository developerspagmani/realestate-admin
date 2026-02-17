'use client';

import React from 'react';
import ListingView from './ListingView';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';

interface PageBuilderProps {
    config: any;
    data: any[];
    theme: any;
    widget: any;
    widgetId: string;
    onSelectProperty: (property: any) => void;
    hideHero?: boolean;
}

const PageBuilder: React.FC<PageBuilderProps> = ({ config, data, theme, widget, widgetId, onSelectProperty, hideHero = false }) => {
    // If we have specific blocks, use the block-based renderer
    if (config?.blocks && config.blocks.length > 0) {
        return (
            <div className="page-builder">
                {config.blocks.map((block: any, index: number) => {
                    switch (block.type) {
                        case 'HERO':
                            if (hideHero) return null;
                            return (
                                <section key={index} className="pb-hero py-5 mb-5 overflow-hidden position-relative" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="container position-relative z-1">
                                        <div className="row align-items-center g-5">
                                            <div className="col-lg-6">
                                                <h1 className="display-4 fw-extrabold mb-3">
                                                    {block.title || 'Find Your Dream Home'}
                                                </h1>
                                                <p className="lead text-muted mb-4">
                                                    {block.subtitle || 'Discover premium properties in the most desirable locations.'}
                                                </p>
                                                <div className="d-flex gap-3">
                                                    <button className="btn btn-primary rounded-4 px-5 py-3 fw-bold" style={{ backgroundColor: theme.primaryColor, border: 'none' }}>
                                                        Get Started
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="position-relative">
                                                    <img
                                                        src={block.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'}
                                                        className="img-fluid rounded-4 shadow-2xl"
                                                        alt="Hero"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            );

                        case 'LISTING':
                            return (
                                <div key={index} className="pb-listing mb-5">
                                    <div className="container">
                                        <div className="mb-4 text-center">
                                            <h2 className="fw-bold">{block.title || 'Featured Properties'}</h2>
                                            <p className="text-muted">{block.subtitle || 'Browse our curated selection of properties'}</p>
                                        </div>
                                        <ListingView
                                            filteredData={data}
                                            isFiltered={false}
                                            colClass=""
                                            theme={theme}
                                            widget={widget}
                                            widgetId={widgetId}
                                            onReset={() => { }}
                                            onSelectProperty={onSelectProperty}
                                        />
                                    </div>
                                </div>
                            );

                        case 'INQUIRY':
                            return (
                                <section key={index} className="pb-inquiry py-5 mb-5" style={{ backgroundColor: '#fff' }}>
                                    <div className="container">
                                        <div className="glass-panel p-5 rounded-4 shadow-sm">
                                            <div className="row g-5">
                                                <div className="col-lg-5">
                                                    <h2 className="fw-bold mb-3">{block.title || 'Contact Our Team'}</h2>
                                                    <p className="text-muted mb-4">
                                                        {block.subtitle || 'Have questions? Our experts are here to help you find the perfect property.'}
                                                    </p>
                                                </div>
                                                <div className="col-lg-7">
                                                    <FormRenderer
                                                        config={widget.configuration.inquiryForm}
                                                        primaryColor={theme.primaryColor}
                                                        onSubmit={async (formData) => {
                                                            const leadPayload: any = {
                                                                source: 1,
                                                                notes: `Builder Inquiry: ${widget.name}\n${widget.configuration.inquiryForm.fields.map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                                            };
                                                            await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            );

                        default:
                            return null;
                    }
                })}
            </div>
        );
    }

    // Default configuration-driven layout
    return (
        <div className={`page-builder ${hideHero ? 'pt-3' : ''}`}>
            {/* Hero Section */}
            {!hideHero && config?.showHero !== false && (
                <section className="pb-hero py-5 mb-5 position-relative overflow-hidden" style={{
                    backgroundColor: '#f8f9fa',
                    backgroundImage: config?.heroBgUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.heroBgUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: config?.heroBgUrl ? (config?.heroTextColor || '#ffffff') : 'inherit',
                    minHeight: config?.heroBgUrl ? '550px' : 'auto',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <div className="container position-relative z-1 text-center py-5">
                        <h1 className="display-3 fw-extrabold mb-3 animate-fade-up">
                            {config?.heroTitle || 'Discover Premium Properties'}
                        </h1>
                        <p className="lead mb-4 animate-fade-up" style={{ opacity: 0.9 }}>
                            {config?.heroSubtitle || 'Find your perfect home in just a few clicks.'}
                        </p>
                        <div className="animate-fade-up">
                            <button
                                className="btn btn-primary rounded-4 px-5 py-3 fw-bold shadow-lg"
                                style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                onClick={() => {
                                    const el = document.getElementById('property-listing');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Explore Properties
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Property Listing Section */}
            {config?.showListing !== false && (
                <div id="property-listing" className="pb-listing mb-5 animate-fade-in">
                    <div className="container">
                        <div className="mb-4 text-center">
                            <h2 className="fw-bold">{config?.pageTitle || 'Featured Listings'}</h2>
                            <p className="text-muted small">Hand-picked properties for you</p>
                        </div>
                        <ListingView
                            filteredData={data}
                            isFiltered={false}
                            colClass=""
                            theme={theme}
                            widget={widget}
                            widgetId={widgetId}
                            onReset={() => { }}
                            onSelectProperty={onSelectProperty}
                        />
                    </div>
                </div>
            )}

            {/* Inquiry Form Section */}
            {config?.showInquiry !== false && widget.configuration.inquiryForm?.enabled && (
                <section className="pb-inquiry py-5 mb-5 bg-light">
                    <div className="container">
                        <div className="glass-panel p-5 rounded-4 shadow-sm border-0">
                            <div className="row g-5 align-items-center">
                                <div className="col-lg-5">
                                    <h2 className="fw-bold mb-3">Questions? Contact Us</h2>
                                    <p className="text-muted mb-4">
                                        Our real estate experts are available 24/7 to help you with your property search or any questions about our listings.
                                    </p>
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="bg-white shadow-sm p-3 rounded-circle text-primary"><i className="bi bi-telephone"></i></div>
                                        <div className="fw-bold">Contact Support</div>
                                    </div>
                                </div>
                                <div className="col-lg-7">
                                    <FormRenderer
                                        config={widget.configuration.inquiryForm}
                                        primaryColor={theme.primaryColor}
                                        onSubmit={async (formData) => {
                                            const leadPayload: any = {
                                                source: 1,
                                                notes: `Landing Page Inquiry: ${widget.name}\n${widget.configuration.inquiryForm.fields.map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                            };
                                            await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PageBuilder;
