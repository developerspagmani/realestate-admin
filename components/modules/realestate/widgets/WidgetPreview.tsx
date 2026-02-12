'use client';

import React, { useState } from 'react';

interface WidgetPreviewProps {
    formData: any;
    tenantType: number;
}

export default function WidgetPreview({ formData, tenantType }: WidgetPreviewProps) {
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const config = formData.configuration || {};
    const theme = config.theme || { primaryColor: '#6366f1', borderRadius: '8px', fontFamily: 'Inter, sans-serif' };
    const builder = config.builder || {};
    const display = config.display || { columns: 1 };
    const settings = config.settings || { layout: 'grid' };

    const isPageBuilder = settings.layout === 'builder';

    const getFrameWidth = () => {
        switch (deviceMode) {
            case 'mobile': return '340px';
            case 'tablet': return '480px';
            default: return '100%';
        }
    };

    return (
        <div className="widget-preview-container sticky-top" style={{ top: '20px' }}>
            <div className="preview-header mb-3 d-flex justify-content-between align-items-center">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-4 small fw-bold">
                    <i className="bi bi-eye-fill me-2"></i>Live Preview
                </span>
                <div className="preview-devices d-flex gap-2">
                    {[
                        { mode: 'desktop', icon: 'bi-display', title: 'Desktop View' },
                        { mode: 'tablet', icon: 'bi-tablet', title: 'Tablet View' },
                        { mode: 'mobile', icon: 'bi-phone', title: 'Mobile View' }
                    ].map((device) => (
                        <button
                            key={device.mode}
                            className={`btn btn-sm rounded-circle shadow-sm p-2 transition-all ${deviceMode === device.mode ? 'btn-primary' : 'btn-light'}`}
                            title={device.title}
                            onClick={() => setDeviceMode(device.mode as any)}
                        >
                            <i className={`bi ${device.icon}`}></i>
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`widget-mockup-frame shadow-lg bg-white overflow-hidden border border-light-subtle rounded-4 mx-auto`}
                style={{
                    fontFamily: theme.fontFamily,
                    minHeight: '600px',
                    width: getFrameWidth(),
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                {/* Mock Header */}
                {(isPageBuilder || builder.showLogo) && (
                    <div className="preview-mock-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
                        {builder.logoUrl ? (
                            <img src={builder.logoUrl} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
                        ) : (
                            <div
                                className="mock-logo rounded-2 flex-shrink-0"
                                style={{ width: '32px', height: '32px', backgroundColor: theme.primaryColor }}
                            ></div>
                        )}
                        <div className="mock-nav d-flex gap-2">
                            <div className="mock-dot bg-light-subtle" style={{ width: '40px', height: '8px', borderRadius: '4px' }}></div>
                            <div className="mock-dot bg-light-subtle" style={{ width: '40px', height: '8px', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                )}

                {/* Mock Hero Section */}
                {isPageBuilder && builder.showHero && (
                    <div
                        className="preview-mock-hero p-5 text-center text-white position-relative overflow-hidden"
                        style={{
                            backgroundColor: theme.primaryColor,
                            backgroundImage: builder.heroBgUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${builder.heroBgUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: builder.heroTextColor || '#ffffff'
                        }}
                    >
                        <h2 className="fw-bold h4 mb-2">{builder.heroTitle || 'Premium Real Estate'}</h2>
                        <p className="extra-small opacity-75 mb-0" style={{ fontSize: '0.7rem' }}>{builder.heroSubtitle || 'Discover your dream space'}</p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="preview-mock-content p-4">
                    {builder.pageTitle && <h3 className="h6 fw-bold mb-3">{builder.pageTitle}</h3>}

                    {/* Mock Listings */}
                    {(isPageBuilder ? builder.showListing !== false : true) && (
                        <div className={`row g-3`}>
                            {Array.from({ length: display.columns === 1 ? 2 : display.columns * 2 }).slice(0, 6).map((_, i) => (
                                <div key={i} className={display.columns === 1 ? 'col-12' : display.columns === 2 ? 'col-6' : 'col-4'}>
                                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                        <div className="mock-img bg-light" style={{ height: '80px' }}></div>
                                        <div className="p-2">
                                            <div className="mock-line bg-light mb-2 w-75" style={{ height: '8px', borderRadius: '4px' }}></div>
                                            <div className="mock-line bg-light w-50" style={{ height: '6px', borderRadius: '4px' }}></div>
                                            <div
                                                className="mock-btn mt-3 rounded-4"
                                                style={{ height: '20px', backgroundColor: theme.primaryColor, opacity: 0.1 }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mock Inquiry Form */}
                    {(isPageBuilder ? builder.showInquiry !== false : true) && (
                        <div className="mt-5 p-4 bg-light rounded-4 border-dashed">
                            <div className="mock-line bg-secondary-subtle mb-3 mx-auto" style={{ height: '10px', width: '40%', borderRadius: '5px' }}></div>
                            <div className="mock-line bg-secondary-subtle mb-2" style={{ height: '8px', borderRadius: '4px' }}></div>
                            <div className="mock-line bg-secondary-subtle mb-4" style={{ height: '8px', width: '80%', borderRadius: '4px' }}></div>

                            <div className="bg-white p-3 rounded-3 shadow-sm">
                                <div className="mock-line bg-light mb-3" style={{ height: '25px', borderRadius: '5px' }}></div>
                                <div className="mock-line bg-light mb-3" style={{ height: '25px', borderRadius: '5px' }}></div>
                                <div
                                    className="mock-btn w-100 rounded-4"
                                    style={{ height: '35px', backgroundColor: theme.primaryColor }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mock Footer */}
                {isPageBuilder && builder.showFooter && (
                    <div className="preview-mock-footer p-4 border-top mt-5 text-center bg-light">
                        <div className="mock-line bg-secondary-subtle mb-2 mx-auto w-25" style={{ height: '6px', borderRadius: '3px' }}></div>
                        <p className="extra-small text-muted mb-0" style={{ fontSize: '0.6rem' }}>
                            {builder.footerText || '© 2026 Your Company'}
                        </p>
                    </div>
                )}

                {/* Floating Chat Mockup */}
                {config.chatbot?.enabled && (
                    <div
                        className="mock-chat-btn position-absolute rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
                        style={{
                            bottom: '20px',
                            right: '20px',
                            width: '45px',
                            height: '45px',
                            backgroundColor: theme.primaryColor
                        }}
                    >
                        <i className="bi bi-chat-dots-fill"></i>
                    </div>
                )}
            </div>

            <style jsx>{`
                .widget-mockup-frame {
                    position: relative;
                }
                .extra-small { font-size: 0.75rem; }
                .border-dashed { border: 2px dashed rgba(0,0,0,0.05); }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.02); }
            `}</style>
        </div>
    );
}
