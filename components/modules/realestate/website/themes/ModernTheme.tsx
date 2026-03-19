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

const ModernTheme: React.FC<ThemeProps> = ({
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
        <div className="modern-theme min-vh-100 bg-white" style={{ '--primary-color': theme.primaryColor, fontFamily: `'${theme.fontFamily}', sans-serif` } as any}>
            <style dangerouslySetInnerHTML={{ __html: `
                .modern-theme .card { border-radius: 1.5rem !important; border: none !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
                .modern-theme .card:hover { transform: translateY(-8px) !important; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04) !important; }
                .modern-theme .btn { border-radius: 2rem !important; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
                .modern-theme .badge { border-radius: 1rem !important; }
                .modern-theme img.img-fluid { border-radius: 1.5rem !important; }
                .modern-theme .form-control, .modern-theme .form-select { border-radius: 1rem !important; }
                .modern-theme main { background-color: #f8fafc !important; }
            `}} />
            {/* Glassmorphism Header */}
            {builder.showLogo !== false && (
                <header className="py-3 backdrop-blur-md sticky-top z-1050 bg-white bg-opacity-80 border-bottom border-light-subtle shadow-sm">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div className="website-logo cursor-pointer transition-all hover-scale" onClick={() => {
                            setCurrentView('LISTING');
                            trackAction?.('CLICK_LOGO', { location: 'header' });
                        }}>
                            {builder.logoUrl ? (
                                <img src={builder.logoUrl} alt={website?.name || "Brand Logo"} style={{ height: '55px', objectFit: 'contain' }} />
                            ) : (
                                <div className="fw-black h3 mb-0 text-primary tracking-tighter" style={{ color: theme.primaryColor }}>{website?.name?.toUpperCase()}</div>
                            )}
                        </div>
                        <nav className="d-none d-md-flex align-items-center gap-4">
                            {website.configuration?.menus?.header?.map((item: any) => (
                                <button
                                    key={item.id}
                                    className="btn btn-link link-dark text-decoration-none fw-bold small p-0 hover-opacity-75"
                                    onClick={() => {
                                        trackAction?.('NAVIGATE_MENU', { label: item.label, url: item.url, location: 'header' });
                                        if (item.type === 'custom') {
                                            window.open(item.url, item.target || '_self');
                                        }
                                    }}
                                >
                                    {item.label.toUpperCase()}
                                </button>
                            ))}
                            {currencySymbol && (
                                <span className="badge rounded-pill bg-light text-dark px-3 py-2 border border-light-subtle extra-small fw-bold">
                                    <i className="bi bi-currency-exchange me-1 text-primary"></i> {currencySymbol}
                                </span>
                            )}
                            {(website.configuration?.bookingForm?.enabled || website.configuration?.builder?.enableBooking) && (
                                <button
                                    className="btn btn-primary rounded-pill px-4 py-2 shadow-lg fw-black transition-all hover-grow border-0"
                                    style={{ backgroundColor: theme.primaryColor }}
                                    onClick={() => {
                                        setShowBookingModal(true);
                                        trackAction?.('CLICK_BOOKING', { location: 'header' });
                                    }}
                                >
                                    RESERVE NOW
                                </button>
                            )}
                        </nav>
                        <button className="btn d-md-none border-0 p-0 text-dark" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                            <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'} fs-1`}></i>
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {showMobileMenu && (
                        <div className="mobile-nav-overlay d-md-none animate-fade-in bg-white position-fixed top-0 start-0 w-100 vh-100 z-1040 p-5 mt-5">
                            <div className="d-flex flex-column gap-4 text-center mt-5">
                                {website.configuration?.menus?.header?.map((item: any) => (
                                    <button
                                        key={item.id}
                                        className="btn btn-link link-dark text-decoration-none fw-black h2"
                                        onClick={() => {
                                            setShowMobileMenu(false);
                                            if (item.type === 'custom') window.open(item.url, item.target || '_self');
                                        }}
                                    >
                                        {item.label.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </header>
            )}

            <main className="animate-fade-in">
                {children}
            </main>

            {/* Modern Footer */}
            {builder.showFooter !== false && (
                <footer className="py-6 mt-auto bg-dark text-white rounded-top-5">
                    <div className="container">
                        <div className="row g-5">
                            <div className="col-lg-4">
                                <h4 className="fw-black mb-4">{website.name}</h4>
                                <p className="opacity-75 lead small mb-5">
                                    {builder.footerText || website.configuration?.footer?.footerText || 'A premium real estate portal experience by Vipranix Platform.'}
                                </p>
                                <div className="d-flex gap-4">
                                    {Object.entries(website.configuration?.footer?.socials || {}).map(([key, value]) => {
                                        if (!value) return null;
                                        return (
                                            <a 
                                                key={key} 
                                                href={value as string} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-white opacity-50 hover-opacity-100 transition-all"
                                                onClick={() => trackAction?.('SOCIAL_CLICK', { platform: key, location: 'footer' })}
                                            >
                                                <i className={`bi bi-${key === 'twitter' ? 'twitter-x' : key} fs-5`}></i>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="col-lg-8">
                                <div className="row">
                                    <div className="col-6 col-md-4">
                                        <h6 className="fw-black mb-4 small opacity-50 tracking-widest uppercase">NAVIGATE</h6>
                                        <ul className="list-unstyled d-flex flex-column gap-3">
                                            {website.configuration?.menus?.footer?.map((item: any) => (
                                                <li key={item.id}>
                                                    <a 
                                                        href={item.url || '#'} 
                                                        className="text-white text-decoration-none opacity-75 hover-opacity-100 transition-all small"
                                                        onClick={() => trackAction?.('NAVIGATE_MENU', { label: item.label, url: item.url, location: 'footer' })}
                                                    >
                                                        {item.label}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="col-md-8 mt-5 mt-md-0">
                                        <div className="p-4 rounded-4 bg-white bg-opacity-5 border border-light border-opacity-10">
                                            {(() => {
                                                const inquiryForm = website.configuration?.inquiryForm;
                                                const showInquiry = inquiryForm?.enabled || (inquiryForm?.useMarketingForm && inquiryForm?.marketingFormId);
                                                if (showInquiry) {
                                                    return (
                                                        <>
                                                            <h6 className="fw-bold mb-3">{inquiryForm.title || 'Inquire Now'}</h6>
                                                            <FormRenderer
                                                                config={inquiryForm}
                                                                primaryColor={theme.primaryColor}
                                                                onSubmit={async (formData, configUsed) => {
                                                                    const leadPayload: any = {
                                                                        source: 1,
                                                                        notes: `Theme Footer Inquiry: ${website.name}\n${(configUsed.fields || []).map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                                                    };
                                                                    if (inquiryForm.useMarketingForm && inquiryForm.marketingFormId) {
                                                                        leadPayload.formId = inquiryForm.marketingFormId;
                                                                    }
                                                                    await widgetService.createPublicLead(website.id, leadPayload, !!website.slug);
                                                                }}
                                                            />
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        <h6 className="fw-bold mb-3">Newsletter Subcribe</h6>
                                                        <div className="input-group">
                                                            <input type="email" className="form-control bg-transparent border-light border-opacity-25 text-white" placeholder="your@email.com" />
                                                            <button 
                                                                className="btn btn-primary px-4" 
                                                                style={{ backgroundColor: theme.primaryColor }}
                                                                onClick={() => trackAction?.('NEWSLETTER_SUBSCRIBE', { location: 'footer' })}
                                                            >
                                                                Join
                                                            </button>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-5 border-top border-light border-opacity-10 text-center opacity-50 extra-small">
                            © {new Date().getFullYear()} {website.name}. All rights reserved.
                        </div>
                    </div>
                </footer>
            )}

            <style jsx global>{`
                .modern-theme {
                    --bs-primary: ${theme.primaryColor};
                }
                .hover-scale:hover {
                    transform: scale(1.05);
                }
                .hover-grow:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .rounded-top-5 {
                    border-top-left-radius: 4rem !important;
                    border-top-right-radius: 4rem !important;
                }
                .mt-6 { margin-top: 5rem; }
                .py-6 { padding-top: 5rem; padding-bottom: 5rem; }
                .fw-black { font-weight: 900; }
                .tracking-tighter { letter-spacing: -0.05em; }
                .opacity-90 { opacity: 0.9; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            `}</style>
        </div>
    );
};

export default ModernTheme;
