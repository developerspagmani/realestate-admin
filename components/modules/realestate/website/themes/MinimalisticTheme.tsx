'use client';

import React from 'react';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';

interface ThemeProps {
    children: React.ReactNode;
    website: any;
    theme: any;
    builder: any;
    setCurrentView: (view: any) => void;
    setShowBookingModal: (show: boolean) => void;
    showMobileMenu: boolean;
    setShowMobileMenu: (show: boolean) => void;
    trackAction?: (type: string, metadata?: any) => void;
    currencySymbol?: string;
}

const MinimalisticTheme: React.FC<ThemeProps> = ({
    children,
    website,
    theme,
    builder,
    setCurrentView,
    setShowBookingModal,
    showMobileMenu,
    setShowMobileMenu,
    trackAction,
    currencySymbol
}) => {
    return (
        <div className="minimalistic-theme min-vh-100 bg-white" style={{ '--primary-color': theme.primaryColor, fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : `'Roboto', sans-serif` } as any}>
            <style dangerouslySetInnerHTML={{ __html: `
                .minimalistic-theme .card { border-radius: 0px !important; border: 1px solid #e5e5e5 !important; box-shadow: none !important; transition: border-color 0.2s ease !important; }
                .minimalistic-theme .card:hover { border-color: #111 !important; transform: none !important; }
                .minimalistic-theme h1, .minimalistic-theme h2, .minimalistic-theme h3, .minimalistic-theme h4, .minimalistic-theme h5, .minimalistic-theme h6 { font-weight: 400 !important; letter-spacing: -0.02em !important; color: #000; }
                .minimalistic-theme .btn { border-radius: 0px !important; box-shadow: none !important; border: 1px solid #111; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
                .minimalistic-theme .btn-primary { background-color: #111 !important; color: white !important; border-color: #111 !important; }
                .minimalistic-theme .btn-primary:hover { background-color: #000 !important; }
                .minimalistic-theme .badge { border-radius: 0px !important; font-family: monospace; letter-spacing: 0; }
                .minimalistic-theme img.rounded, .minimalistic-theme img.rounded-3, .minimalistic-theme img.rounded-4, .minimalistic-theme img.rounded-5, .minimalistic-theme .rounded, .minimalistic-theme .rounded-3, .minimalistic-theme .rounded-4, .minimalistic-theme .rounded-5, .minimalistic-theme .rounded-pill, .minimalistic-theme .rounded-circle { border-radius: 0px !important; }
                .minimalistic-theme .form-control, .minimalistic-theme .form-select { border-radius: 0px !important; border: 1px solid #111 !important; box-shadow: none !important; }
                .minimalistic-theme { background-color: #ffffff !important; color: #111 !important; }
            `}} />
            {/* Ultra Clean Header */}
            {builder.showLogo !== false && (
                <header className="py-4 bg-white border-bottom border-light sticky-top z-1050">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div className="website-logo cursor-pointer" onClick={() => {
                            setCurrentView('LISTING');
                            trackAction?.('CLICK_LOGO', { location: 'header' });
                        }}>
                            {builder.logoUrl ? (
                                <img src={builder.logoUrl} alt={website?.name} style={{ height: '45px', objectFit: 'contain' }} />
                            ) : (
                                <div className="fw-bold h4 mb-0 tracking-widest text-dark">{website?.name?.toUpperCase()}</div>
                            )}
                        </div>
                        <nav className="d-none d-md-flex align-items-center gap-5">
                            {website.configuration?.menus?.header?.map((item: any) => (
                                <button
                                    key={item.id}
                                    className="btn btn-link link-dark text-decoration-none small p-0 opacity-60 hover-opacity-100 transition-all font-monospace tracking-wide"
                                    onClick={() => {
                                        trackAction?.('NAVIGATE_MENU', { label: item.label, url: item.url, location: 'header' });
                                        if (item.type === 'custom') window.open(item.url, item.target || '_self');
                                    }}
                                >
                                    /{item.label.toLowerCase()}
                                </button>
                            ))}
                            {currencySymbol && (
                                <span className="small font-monospace text-muted opacity-50 px-3 border-start">
                                    {currencySymbol}
                                </span>
                            )}
                            {(website.configuration?.bookingForm?.enabled || website.configuration?.builder?.enableBooking) && (
                                <button
                                    className="btn btn-dark rounded-0 px-4 py-2 small tracking-widest fw-black"
                                    onClick={() => {
                                        setShowBookingModal(true);
                                        trackAction?.('CLICK_BOOKING', { location: 'header' });
                                    }}
                                >
                                    BOOK
                                </button>
                            )}
                        </nav>
                        <button className="btn d-md-none border-0 p-0 text-dark" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                            <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'} fs-1`}></i>
                        </button>
                    </div>
                </header>
            )}

            <main className="animate-fade-in py-5">
                {children}
            </main>

            {/* Flat Social Map Footer */}
            {builder.showFooter !== false && (
                <footer className="py-5 border-top bg-white border-light mt-auto">
                    <div className="container">
                        <div className="row g-4 justify-content-between">
                            <div className="col-md-3">
                                <h6 className="fw-black mb-1 text-dark tracking-tighter">{website.name}</h6>
                                <p className="extra-small text-muted opacity-60 mb-0">
                                    A minimalist real estate collective.
                                </p>
                            </div>
                            <div className="col-md-5">
                                {(() => {
                                    const inquiryForm = website.configuration?.inquiryForm;
                                    const showInquiry = inquiryForm?.enabled || (inquiryForm?.useMarketingForm && inquiryForm?.marketingFormId);
                                    if (showInquiry) {
                                        return (
                                            <div className="p-4 bg-light bg-opacity-30 border">
                                                <h6 className="extra-small fw-bold text-uppercase tracking-widest mb-3">{inquiryForm.title || 'Inquiry'}</h6>
                                                <FormRenderer
                                                    config={inquiryForm}
                                                    primaryColor={theme.primaryColor}
                                                    onSubmit={async (formData, configUsed) => {
                                                        const leadPayload: any = {
                                                            source: 1,
                                                            notes: `Minimalist Theme Inquiry: ${website.name}\n${(configUsed.fields || []).map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                                        };
                                                        if (inquiryForm.useMarketingForm && inquiryForm.marketingFormId) {
                                                            leadPayload.formId = inquiryForm.marketingFormId;
                                                        }
                                                        await widgetService.createPublicLead(website.id, leadPayload, !!website.slug);
                                                    }}
                                                />
                                            </div>
                                        );
                                    }
                                    return <div className="border-start ps-4 h-100 opacity-20 fw-light">Curated Properties. Simple Design.</div>;
                                })()}
                            </div>
                            <div className="col-md-3 text-md-end d-flex flex-column justify-content-between">
                                <div className="d-flex gap-4 justify-content-md-center mb-1">
                                    {Object.entries(website.configuration?.footer?.socials || {}).map(([key, value]) => {
                                        if (!value) return null;
                                        return (
                                            <a 
                                                key={key} 
                                                href={value as string} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-dark opacity-30 hover-opacity-100 transition-all"
                                                onClick={() => trackAction?.('SOCIAL_CLICK', { platform: key, location: 'footer' })}
                                            >
                                                <i className={`bi bi-${key === 'twitter' ? 'twitter-x' : key} fs-6`}></i>
                                            </a>
                                        );
                                    })}
                                </div>
                                <p className="extra-small text-muted mb-0 opacity-40 font-monospace uppercase mt-4">© {new Date().getFullYear()} / ALL RIGHTS RESERVED</p>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            <style jsx global>{`
                .minimalistic-theme {
                    --bs-primary: #000;
                    letter-spacing: -0.01em;
                }
                .minimalistic-theme * {
                    border-radius: 0 !important;
                }
                .label-mini {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 700;
                    color: #999;
                }
                .hover-opacity-100:hover { opacity: 1 !important; }
                .tracking-widest { letter-spacing: 0.15em; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default MinimalisticTheme;
