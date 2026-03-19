'use client';

import React, { useState } from 'react';

interface WidgetPreviewProps {
    formData: any;
    tenantType: number;
    deviceMode?: 'desktop' | 'tablet' | 'mobile';
}

export default function WidgetPreview({ formData, tenantType, deviceMode: externalDeviceMode }: WidgetPreviewProps) {
    const [internalDeviceMode, setInternalDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const deviceMode = externalDeviceMode || internalDeviceMode;
    const setDeviceMode = (mode: any) => externalDeviceMode ? null : setInternalDeviceMode(mode);
    const config = formData.configuration || {};
    const theme = config.theme || { primaryColor: '#6366f1', borderRadius: '8px', fontFamily: 'Inter, sans-serif', template: 'modern' };
    const currentTemplate = theme.template || 'modern';
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

    // Helper to darken a color for hover states (matching logic in StandaloneProvider)
    const darkenColor = (hex: string, percent: number) => {
        try {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    };

    const primaryHover = darkenColor(theme.primaryColor, 10);
    const primaryGhost = theme.primaryColor + '15';

    return (
        <div className="widget-preview-container sticky-top" style={{ top: '20px' }}>
            {!externalDeviceMode && (
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
            )}

            <div
                className={`widget-mockup-frame widget-container shadow-lg bg-white overflow-hidden border border-light-subtle rounded-4 mx-auto`}
                style={{
                    fontFamily: currentTemplate === 'traditional' ? `'Playfair Display', serif` : (theme.fontFamily || 'Inter, sans-serif'),
                    minHeight: '600px',
                    width: getFrameWidth(),
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    // Inject dynamic variables for preview CSS to pick up
                    '--primary-color': theme.primaryColor || (currentTemplate === 'traditional' ? '#1a3a5f' : '#6366f1'),
                    '--primary-hover': primaryHover,
                    '--primary-ghost': primaryGhost,
                    borderRadius: currentTemplate === 'minimalistic' ? '0 !important' : '1.5rem !important'
                } as any}
            >
                {/* Mock Header */}
                {(isPageBuilder || builder.showLogo) && (
                    <div 
                        className={`preview-mock-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top ${currentTemplate === 'modern' ? 'backdrop-blur-md' : ''}`}
                        style={{
                            borderBottom: currentTemplate === 'traditional' ? `3px double ${theme.primaryColor || '#d4af37'}` : undefined,
                            borderRadius: currentTemplate === 'minimalistic' ? '0' : undefined
                        }}
                    >
                        {builder.logoUrl ? (
                            <img src={builder.logoUrl} alt="Logo" style={{ height: currentTemplate === 'modern' ? '30px' : '20px', objectFit: 'contain' }} />
                        ) : (
                            <div
                                className={`${currentTemplate === 'minimalistic' ? 'rounded-0' : 'rounded-2'} flex-shrink-0`}
                                style={{ width: '32px', height: '32px', backgroundColor: theme.primaryColor || (currentTemplate === 'traditional' ? '#1a3a5f' : '#6366f1') }}
                            ></div>
                        )}
                        <div className="mock-nav d-flex gap-2">
                            <div className={`mock-dot bg-light-subtle ${currentTemplate === 'minimalistic' ? 'rounded-0' : ''}`} style={{ width: '40px', height: '8px', borderRadius: currentTemplate === 'minimalistic' ? '0' : '4px' }}></div>
                            <div className={`mock-dot bg-light-subtle ${currentTemplate === 'minimalistic' ? 'rounded-0' : ''}`} style={{ width: '40px', height: '8px', borderRadius: currentTemplate === 'minimalistic' ? '0' : '4px' }}></div>
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
                <div className="preview-mock-content p-0">
                    {builder.pageTitle && <div className="p-4"><h3 className="h6 fw-bold mb-0">{builder.pageTitle}</h3></div>}

                    {/* Rendering Modular Sections */}
                    {(builder.modules || []).map((module: any) => (
                        <div key={module.id} className="modular-section border-bottom" style={{
                            backgroundColor: module.data?.bgColor || 'transparent',
                            color: module.data?.textColor || 'inherit'
                        }}>
                            {module.type === 'hero-slider' && (
                                <div className="preview-mock-hero p-4 text-center text-white position-relative overflow-hidden" style={{
                                    height: '180px',
                                    backgroundColor: theme.primaryColor,
                                    backgroundImage: module.data?.slides?.[0]?.imageUrl ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${module.data.slides[0].imageUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>
                                    <div className="position-relative z-1">
                                        <div className="fw-bold small mb-1">{module.data?.slides?.[0]?.title || 'Featured Property'}</div>
                                        <div className="opacity-75" style={{ fontSize: '0.6rem' }}>{module.data?.slides?.[0]?.subtitle || 'Premium Living Experience'}</div>
                                    </div>
                                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className={`rounded-circle ${i === 1 ? 'bg-white' : 'bg-white opacity-25'}`} style={{ width: '4px', height: '4px' }}></div>)}
                                    </div>
                                </div>
                            )}

                            {module.type === 'search' && (
                                <div className="p-3 bg-white">
                                    {module.data?.title && <div className="fw-bold extra-small mb-2 text-center">{module.data.title}</div>}
                                    <div className="mock-search-bar p-2 bg-light border rounded-3 d-flex gap-2 align-items-center">
                                        <i className="bi bi-search text-muted small" style={{ fontSize: '0.6rem' }}></i>
                                        <div className="bg-secondary-subtle rounded-pill flex-grow-1" style={{ height: '8px' }}></div>
                                        <div className="btn p-1 rounded-2" style={{ backgroundColor: theme.primaryColor, width: '20px', height: '20px' }}></div>
                                    </div>
                                </div>
                            )}

                            {module.type === 'full-width-image' && (
                                <div className="w-100 position-relative" style={{ height: '160px', overflow: 'hidden' }}>
                                    {module.data?.imageUrl ? (
                                        <img src={module.data.imageUrl} className="w-100 h-100 shadow-sm" style={{ objectFit: 'cover' }} alt="Visual" />
                                    ) : (
                                        <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted small">Full Width Image</div>
                                    )}
                                </div>
                            )}

                            {module.type === 'text-image' && (
                                <div className="p-4 d-flex gap-3 align-items-center">
                                    <div className="flex-grow-1">
                                        <div className="fw-bold extra-small mb-1">{module.data?.title || 'Section Heading'}</div>
                                        <div className="opacity-75" style={{ fontSize: '0.65rem' }}>{module.data?.description || 'Section description and details go here.'}</div>
                                    </div>
                                    <div className="flex-shrink-0 bg-light rounded-3" style={{ width: '80px', height: '60px', overflow: 'hidden' }}>
                                        {module.data.imageUrl && <img src={module.data.imageUrl} className="w-100 h-100" style={{ objectFit: 'cover' }} />}
                                    </div>
                                </div>
                            )}

                            {module.type === 'image-text' && (
                                <div className="p-4 d-flex gap-3 align-items-center">
                                    <div className="flex-shrink-0 bg-light rounded-3" style={{ width: '80px', height: '60px', overflow: 'hidden' }}>
                                        {module.data.imageUrl && <img src={module.data.imageUrl} className="w-100 h-100" style={{ objectFit: 'cover' }} />}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold extra-small mb-1">{module.data?.title || 'Section Heading'}</div>
                                        <div className="opacity-75" style={{ fontSize: '0.65rem' }}>{module.data?.description || 'Section description and details go here.'}</div>
                                    </div>
                                </div>
                            )}

                            {module.type === 'typography' && (
                                <div className="p-4 text-center">
                                    <h4 className="fw-bold mb-2" style={{ fontSize: '1rem' }}>{module.data?.title || 'Custom Heading'}</h4>
                                    <p className="mb-0 opacity-75 mx-auto" style={{ fontSize: '0.7rem', maxWidth: '80%' }}>{module.data?.description || 'This is a dedicated text block for highlighting important messages.'}</p>
                                </div>
                            )}

                            {module.type === 'property-slider' && (
                                <div className="p-4 bg-light bg-opacity-50">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fw-bold extra-small">Featured Collection</div>
                                        <div className="d-flex gap-1">
                                            <div className="bg-white border rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                                            <div className="bg-white border rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2 overflow-hidden">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white rounded-3 shadow-sm border p-1" style={{ width: '120px', flexShrink: 0 }}>
                                                <div className="bg-light rounded-2 mb-2" style={{ height: '60px' }}></div>
                                                <div className="bg-light w-75 mb-1" style={{ height: '6px', borderRadius: '3px' }}></div>
                                                <div className="bg-light w-50" style={{ height: '4px', borderRadius: '2px' }}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {module.type === 'LISTING' && (
                                <div className="p-3">
                                    <div className="row g-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="col-6">
                                                <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                                    <div className="bg-light" style={{ height: '60px' }}></div>
                                                    <div className="p-2">
                                                        <div className="bg-light mb-1 w-75" style={{ height: '5px' }}></div>
                                                        <div className="bg-light w-50" style={{ height: '3px' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {module.type === 'inquiry' && (
                                <div className="p-4">
                                    <div className="bg-white p-3 rounded-4 shadow-sm border border-light-subtle">
                                        <div className="fw-bold extra-small mb-2 text-center">{module.data?.title || 'Get in Touch'}</div>
                                        <div className="bg-light rounded-2 mb-2" style={{ height: '20px' }}></div>
                                        <div className="bg-light rounded-2 mb-2" style={{ height: '20px' }}></div>
                                        <div className="w-100 rounded-3" style={{ height: '30px', backgroundColor: theme.primaryColor }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="p-0">
                        {/* Original Search Mock - Only show if not hidden by settings AND no search module added */}
                        {builder.showSearch !== false && !(builder.modules || []).find((m: any) => m.type === 'search') && (
                            <div className="p-4">
                                <div className="mock-search-bar p-2 bg-light border-0 rounded-4 d-flex gap-2">
                                    <div className="bg-secondary-subtle" style={{ width: '60%', height: '14px', borderRadius: '7px' }}></div>
                                    <div className="bg-secondary-subtle flex-grow-1" style={{ height: '14px', borderRadius: '7px' }}></div>
                                </div>
                            </div>
                        )}

                        {/* Mock Listings - Only show if not hidden by settings AND no LISTING module added */}
                        {(isPageBuilder ? builder.showListing !== false : true) && !(builder.modules || []).find((m: any) => m.type === 'LISTING') && (
                            <div className="p-4 pt-0">
                                <div className={`row g-2`}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className={'col-6'}>
                                            <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                                <div className="mock-img bg-light" style={{ height: '70px' }}></div>
                                                <div className="p-2">
                                                    <div className="mock-line bg-light mb-1 w-75" style={{ height: '6px', borderRadius: '3px' }}></div>
                                                    <div className="mock-line bg-light w-50" style={{ height: '4px', borderRadius: '2px' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mock Inquiry Form - Only show if not hidden by settings AND no inquiry module added */}
                        {(isPageBuilder ? builder.showInquiry !== false : true) && !(builder.modules || []).find((m: any) => m.type === 'inquiry') && (
                            <div className="p-4 pt-0">
                                <div className="mt-0 p-3 bg-light rounded-4 border-dashed">
                                    <div className="bg-white p-2 rounded-3 shadow-sm">
                                        <div className="mock-line bg-light mb-2" style={{ height: '20px', borderRadius: '4px' }}></div>
                                        <div className="mock-btn w-100 rounded-4" style={{ height: '25px', backgroundColor: theme.primaryColor }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mock Footer */}
                {isPageBuilder && builder.showFooter && (
                    <div className="preview-mock-footer p-4 border-top mt-auto text-center position-relative shadow-sm" style={{
                        backgroundColor: (formData.configuration?.footer?.backgroundColor || '#f8f9fa'),
                        color: (formData.configuration?.footer?.textColor || '#212529')
                    }}>
                        {formData.configuration?.footer?.footerText && <p className="extra-small mb-3">{formData.configuration.footer.footerText}</p>}

                        {/* Social Icons Mockup */}
                        <div className="social-icons-mock d-flex justify-content-center gap-3 mb-3">
                            {Object.entries(formData.configuration?.footer?.socials || {}).map(([key, value]) => {
                                if (!value) return null;
                                const icons: any = {
                                    facebook: 'bi-facebook',
                                    instagram: 'bi-instagram',
                                    twitter: 'bi-twitter-x',
                                    linkedin: 'bi-linkedin',
                                    youtube: 'bi-youtube'
                                };
                                return <i key={key} className={`bi ${icons[key]} opacity-75`} style={{ fontSize: '0.8rem' }}></i>;
                            })}
                        </div>

                        <div className="extra-small opacity-50 mb-4" style={{ fontSize: '0.6rem' }}>
                            {formData.configuration?.footer?.copyright || `© ${new Date().getFullYear()} Real Estate Portal`}
                        </div>

                        {/* Non-removable Watermark */}
                        <div
                            className="position-absolute bottom-0 start-50 translate-middle-x mb-2 text-decoration-none d-flex align-items-center w-100 justify-content-center"
                            style={{
                                fontSize: '8px',
                                color: 'rgba(0,0,0,0.2)',
                                userSelect: 'none',
                                pointerEvents: 'none'
                            }}
                        >
                            <img
                                src="/images/Virpnix-logo-icon-svg.svg"
                                alt="Virpanix"
                                style={{ height: '8px', width: 'auto', marginRight: '3px', opacity: 0.2 }}
                            />
                            Powered by Virpanix
                        </div>
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
                            backgroundColor: config.chatbot?.primaryColor || theme.primaryColor
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
