import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BaseTemplateProps } from './types';

export default function LuxuryPrestigeTemplate(props: BaseTemplateProps) {
    const {
        property,
        mode,
        companyInfo,
        fontStyle,
        accentColor = '#d4af37',
        textColor = '#ffffff',
        allMedia = [],
        aiTagline,
        aiDescription,
        isPreview,
        customContact,
        selectedImages,
        toggles = { showPrice: true, showAmenities: true, showQRCode: true, showStats: true }
    } = props;

    const pageWidth = '210mm';
    const pageHeight = '297mm';

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
    };

    const getAlphaColor = (hex: string, alpha: string) => {
        if (!hex || hex.length < 7) return hex;
        return hex + alpha;
    };

    return (
        <div style={{
            width: pageWidth,
            background: '#0a0a0a',
            color: textColor,
            fontFamily: fontStyle,
            margin: '0 auto',
            boxSizing: 'border-box',
            textAlign: 'left'
        }}>
            {/* PAGE 1: COVER - IMMERSIVE LUXURY */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    transform: 'scale(1.05)',
                    filter: 'contrast(1.1) brightness(0.9)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.9) 100%)',
                    zIndex: 1
                }}></div>

                <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ borderLeft: `6px solid ${accentColor}`, paddingLeft: '40px', marginBottom: '50px' }}>
                        <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            letterSpacing: '10px', 
                            color: accentColor, 
                            marginBottom: '25px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            {aiTagline || 'Exclusive Collection'}
                        </div>
                        <h1 style={{ 
                            fontSize: '72px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            margin: 0, 
                            lineHeight: 0.8, 
                            letterSpacing: '-4px',
                            color: textColor
                        }}>
                            {property.name || property.title}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '30px', borderTop: `1px solid ${getAlphaColor(accentColor, '33')}` }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                                <i className="bi bi-geo-alt me-2" style={{ color: accentColor }}></i>
                                {property.city} | {property.state}
                            </div>
                            {toggles.showPrice && (
                                <div style={{ fontSize: '38px', fontWeight: 900, color: accentColor }}>
                                    {props.currency || '$'} {Number(property.price || 0).toLocaleString()}
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '4px', color: accentColor, marginBottom: '5px' }}>THE PRESTIGE SERIES</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>Curated by {mode === 'owner' ? companyInfo?.name : 'RealEstate Premium'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2: ARCHITECTURE - LUXURY SPACING */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '100px 70px' }}>
                <div style={{ 
                    position: 'absolute', 
                    top: '50px', 
                    right: '60px', 
                    opacity: 0.08, 
                    fontSize: '160px', 
                    fontWeight: 900, 
                    color: accentColor, 
                    pointerEvents: 'none',
                    lineHeight: 1
                }}>02</div>

                <div style={{ marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-3px', textTransform: 'uppercase', marginBottom: '40px', color: textColor }}>
                        ART OF <span style={{ color: accentColor }}>LIVING</span>
                    </h2>
                    <p style={{ 
                        fontSize: '20px', 
                        lineHeight: '2.1', 
                        color: getAlphaColor(textColor, 'CC'), 
                        maxWidth: '95%', 
                        borderBottom: `2px solid ${getAlphaColor(accentColor, '15')}`, 
                        paddingBottom: '50px',
                        textAlign: 'justify'
                    }}>
                        {aiDescription || property.description}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '80px' }}>
                    {[
                        { label: 'Area', value: `${(property as any).area || (property as any).sizeSqft || '—'} sqft` },
                        { label: 'Year Built', value: property.yearBuilt || '—' },
                        { label: 'Configuration', value: property.propertyType || '—' }
                    ].map((item, i) => (
                        <div key={i} style={{ 
                            padding: '40px 30px', 
                            background: 'rgba(255,255,255,0.02)', 
                            border: `1px solid ${getAlphaColor(accentColor, '1A')}`, 
                            borderRadius: '2px', 
                            textAlign: 'center',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: accentColor, letterSpacing: '5px', marginBottom: '15px', textTransform: 'uppercase' }}>{item.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: textColor }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '50px', alignItems: 'center' }}>
                    <div style={{ flex: 1.5, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: '-15px', border: `1px solid ${getAlphaColor(accentColor, '22')}`, zIndex: 0 }}></div>
                        <img 
                            src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} 
                            style={{ 
                                width: '100%', 
                                height: '420px', 
                                objectFit: 'cover', 
                                position: 'relative', 
                                zIndex: 1,
                                boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
                            }} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '50px', paddingLeft: '20px' }}>
                        <div style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: '25px' }}>
                            <div style={{ fontSize: '56px', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{property.bedrooms || '0'}</div>
                            <div style={{ fontSize: '13px', letterSpacing: '6px', color: getAlphaColor(textColor, '99'), marginTop: '8px' }}>BEDROOMS</div>
                        </div>
                        <div style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: '25px' }}>
                            <div style={{ fontSize: '56px', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{property.bathrooms || '0'}</div>
                            <div style={{ fontSize: '13px', letterSpacing: '6px', color: getAlphaColor(textColor, '99'), marginTop: '8px' }}>BATHROOMS</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: LEGACY - DARK ELEGANCE */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '80px 60px' }}>
                <div style={{ height: '520px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '60px' }}>
                    <div style={{ borderRadius: '2px', overflow: 'hidden' }}>
                        <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} style={{ width: '100%', height: 'calc(50% - 10px)', objectFit: 'cover' }} />
                        <img src={getMediaUrl(property.gallery?.[3] as any) || undefined} style={{ width: '100%', height: 'calc(50% - 10px)', objectFit: 'cover' }} />
                    </div>
                </div>

                <div style={{ borderTop: `2px solid ${accentColor}`, paddingTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ maxWidth: '65%' }}>
                        <h3 style={{ fontSize: '28px', fontWeight: 900, color: accentColor, marginBottom: '30px', letterSpacing: '2px' }}>EXECUTIVE INQUIRIES</h3>
                        <div style={{ fontSize: '18px', lineHeight: '2.2' }}>
                            <div style={{ fontWeight: 800, fontSize: '22px', marginBottom: '10px' }}>{customContact?.name}</div>
                            <div style={{ color: getAlphaColor(textColor, 'B3') }}>
                                <i className="bi bi-telephone-fill me-3" style={{ color: accentColor }}></i>
                                {customContact?.phone}
                            </div>
                            <div style={{ color: getAlphaColor(textColor, 'B3') }}>
                                <i className="bi bi-envelope-fill me-3" style={{ color: accentColor }}></i>
                                {customContact?.email}
                            </div>
                            <div style={{ color: accentColor, fontWeight: 700, marginTop: '10px' }}>
                                <i className="bi bi-globe2 me-3"></i>
                                {customContact?.website?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                    {toggles.showQRCode && (
                        <div style={{ 
                            background: '#ffffff', 
                            padding: '30px', 
                            borderRadius: '4px',
                            boxShadow: `0 0 50px ${getAlphaColor(accentColor, '33')}`
                        }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={130} />
                            <div style={{ textAlign: 'center', fontSize: '9px', color: '#000', marginTop: '15px', fontWeight: 800, letterSpacing: '2px' }}>SCAN FOR ACCESS</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
