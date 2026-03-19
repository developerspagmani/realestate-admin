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

const TraditionalTheme: React.FC<ThemeProps> = ({
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
        <div className="traditional-theme min-vh-100" style={{ '--primary-color': theme.primaryColor || '#1a3a5f', backgroundColor: '#fcfaf7', fontFamily: theme.fontFamily ? `'${theme.fontFamily}', serif` : `'Lora', serif` } as any}>
            <style dangerouslySetInnerHTML={{ __html: `
                .traditional-theme .card { border-radius: 4px !important; border: 1px solid #e0dfdc !important; box-shadow: 0 4px 6px rgba(0,0,0,0.02) !important; background-color: #ffffff; }
                .traditional-theme .card:hover { box-shadow: 0 10px 15px rgba(0,0,0,0.05) !important; transform: translateY(-2px) !important; }
                .traditional-theme h1, .traditional-theme h2, .traditional-theme h3, .traditional-theme h4, .traditional-theme h5, .traditional-theme h6 { font-family: 'Lora', serif !important; font-weight: 700; color: #1a3a5f; }
                .traditional-theme .btn { border-radius: 2px !important; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border: 1px solid transparent; }
                .traditional-theme img.rounded, .traditional-theme img.rounded-3, .traditional-theme img.rounded-4, .traditional-theme img.rounded-5 { border-radius: 4px !important; }
                .traditional-theme .badge { border-radius: 2px !important; border: 1px solid currentColor; font-weight: 600; }
                .traditional-theme .form-control, .traditional-theme .form-select { border-radius: 2px !important; border: 1px solid #ced4da !important; font-family: 'Lora', serif !important; }
                .traditional-theme .btn-primary { background-color: var(--primary-color) !important; line-height: 1.5; }
            `}} />
            {/* Classic Header */}
            {builder.showLogo !== false && (
                <header className="py-2 bg-white border-bottom-2 shadow-sm sticky-top z-1050" style={{ borderBottom: `3px double ${theme.primaryColor || '#d4af37'}` }}>
                    <div className="container">
                        <div className="d-flex flex-column align-items-center mb-3">
                            <div className="website-logo cursor-pointer py-3" onClick={() => {
                                setCurrentView('LISTING');
                                trackAction?.('CLICK_LOGO', { location: 'header' });
                            }}>
                                {builder.logoUrl ? (
                                    <img src={builder.logoUrl} alt={website?.name} style={{ height: '85px', objectFit: 'contain' }} />
                                ) : (
                                    <h1 className="fw-black h2 mb-0 text-center serif-font">{website?.name}</h1>
                                )}
                            </div>
                        </div>
                        <nav className="d-flex justify-content-center align-items-center gap-5 border-top pt-2 pb-1">
                            {website.configuration?.menus?.header?.map((item: any) => (
                                <button
                                    key={item.id}
                                    className="btn btn-link link-dark text-decoration-none fw-bold small p-0 tracking-widest hover-gold transition-all"
                                    onClick={() => {
                                        trackAction?.('NAVIGATE_MENU', { label: item.label, url: item.url, location: 'header' });
                                        if (item.type === 'custom') window.open(item.url, item.target || '_self');
                                    }}
                                >
                                    {item.label.toUpperCase()}
                                </button>
                            ))}
                            {currencySymbol && (
                                <span className="small fw-bold tracking-widest text-muted border-start ps-4 py-2">
                                    <i className="bi bi-globe-americas me-2"></i>{currencySymbol}
                                </span>
                            )}
                            {(website.configuration?.bookingForm?.enabled || website.configuration?.builder?.enableBooking) && (
                                <button
                                    className="btn rounded-0 px-4 py-2 small fw-bold tracking-widest border-2"
                                    style={{ color: '#fff', backgroundColor: theme.primaryColor || '#1a3a5f', borderColor: theme.primaryColor || '#1a3a5f' }}
                                    onClick={() => {
                                        setShowBookingModal(true);
                                        trackAction?.('CLICK_BOOKING', { location: 'header' });
                                    }}
                                >
                                    APPOINTMENT
                                </button>
                            )}
                        </nav>
                        <button className="btn d-md-none border-0 p-0 text-dark position-absolute end-0 top-0 mt-4 me-4" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                            <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'} fs-1`}></i>
                        </button>
                    </div>
                </header>
            )}

            <main className="animate-fade-in container my-5 py-5 bg-white shadow-lg border border-light">
                {children}
            </main>

            {/* Classic Deep Footer */}
            {builder.showFooter !== false && (
                <footer className="py-6 bg-dark text-white border-top border-warning-subtle" style={{ backgroundColor: '#1a1d23', borderTop: `4px solid ${theme.primaryColor || '#d4af37'}` }}>
                    <div className="container">
                        <div className="row g-5 text-center text-md-start">
                            <div className="col-md-4">
                                <h3 className="serif-font mb-4 text-warning-subtle">{website.name}</h3>
                                <p className="opacity-75 lead serif-font small mb-4 italic">
                                    "{builder.footerText || website.configuration?.footer?.footerText || 'Providing exceptional real estate services with a legacy of trust and excellence.'}"
                                </p>
                            </div>
                            <div className="col-md-2">
                                <h6 className="fw-bold mb-4 tracking-widest text-warning-subtle uppercase small border-bottom pb-2">DIRECTORY</h6>
                                <ul className="list-unstyled d-flex flex-column gap-3">
                                    {website.configuration?.menus?.footer?.map((item: any) => (
                                        <li key={item.id}>
                                            <a 
                                                href={item.url || '#'} 
                                                className="text-white text-decoration-none opacity-80 hover-gold transition-all small"
                                                onClick={() => trackAction?.('NAVIGATE_MENU', { label: item.label, url: item.url, location: 'footer' })}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="col-md-3">
                                {(() => {
                                    const inquiryForm = website.configuration?.inquiryForm;
                                    const showInquiry = inquiryForm?.enabled || (inquiryForm?.useMarketingForm && inquiryForm?.marketingFormId);
                                    if (showInquiry) {
                                        return (
                                            <>
                                                <h6 className="fw-bold mb-4 tracking-widest text-warning-subtle uppercase small border-bottom pb-2">{inquiryForm.title || 'INQUIRY'}</h6>
                                                <div className="p-3 bg-white bg-opacity-5 rounded border border-light border-opacity-10">
                                                    <FormRenderer
                                                        config={inquiryForm}
                                                        primaryColor={theme.primaryColor}
                                                        onSubmit={async (formData, configUsed) => {
                                                            const leadPayload: any = {
                                                                source: 1,
                                                                notes: `Traditional Theme Inquiry: ${website.name}\n${(configUsed.fields || []).map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                                            };
                                                            if (inquiryForm.useMarketingForm && inquiryForm.marketingFormId) {
                                                                leadPayload.formId = inquiryForm.marketingFormId;
                                                            }
                                                            await widgetService.createPublicLead(website.id, leadPayload, !!website.slug);
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        );
                                    }
                                    return (
                                        <>
                                            <h6 className="fw-bold mb-4 tracking-widest text-warning-subtle uppercase small border-bottom pb-2">LOCATION</h6>
                                            <p className="extra-small opacity-75">{website.address || 'Global Headquarters / Contact for Private Viewings'}</p>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="col-md-3 text-center text-md-end">
                                <h6 className="fw-bold mb-4 tracking-widest text-warning-subtle uppercase small border-bottom pb-2">CONNECT</h6>
                                <div className="d-flex gap-4 justify-content-center justify-content-md-end">
                                    {Object.entries(website.configuration?.footer?.socials || {}).map(([key, value]) => {
                                        if (!value) return null;
                                        return (
                                            <a 
                                                key={key} 
                                                href={value as string} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-white opacity-60 hover-gold transition-all"
                                                onClick={() => trackAction?.('SOCIAL_CLICK', { platform: key, location: 'footer' })}
                                            >
                                                <i className={`bi bi-${key === 'twitter' ? 'twitter-x' : key} fs-4`}></i>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <hr className="my-5 opacity-10" />
                        <div className="text-center opacity-40 extra-small tracking-widest uppercase">
                            © {new Date().getFullYear()} / ESTABLISHED QUALITY REALTY / ALL RIGHTS RESERVED
                        </div>
                    </div>
                </footer>
            )}

            <style jsx global>{`
                .traditional-theme {
                    --bs-primary: ${theme.primaryColor || '#1a3a5f'};
                }
                .serif-font { font-family: 'Playfair Display', serif !important; }
                .italic { font-style: italic; }
                .hover-gold:hover {
                    color: ${theme.primaryColor || '#d4af37'} !important;
                }
                .tracking-widest { letter-spacing: 0.2em; }
                .uppercase { text-transform: uppercase; }
                .border-bottom-2 { border-bottom-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default TraditionalTheme;
