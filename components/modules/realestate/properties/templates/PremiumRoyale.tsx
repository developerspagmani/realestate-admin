import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BaseTemplateProps } from './types';

export default function PremiumRoyaleTemplate(props: BaseTemplateProps) {
    const {
        property,
        accentColor = '#c5a059',
        textColor = '#ffffff',
        allMedia = [],
        aiTagline,
        aiDescription,
        customContact,
        selectedImages,
        toggles = { showPrice: true, showAmenities: true, showQRCode: true, showStats: true }
    } = props;

    const pageWidth = '297mm';
    const pageHeight = '210mm';

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
            background: '#050505', 
            color: textColor, 
            boxSizing: 'border-box',
            textAlign: 'left'
        }}>
            {/* PAGE 1: COVER - RADIANT ROYALE */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'grayscale(30%) brightness(0.8)' }}
                        crossOrigin="anonymous"
                        alt="Background"
                    />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 35% 50%, transparent 0%, #050505 85%)' }}></div>

                <div style={{ position: 'relative', zIndex: 1, padding: '100px 80px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '55%' }}>
                    <div style={{ width: '120px', height: '2px', background: accentColor, marginBottom: '40px', boxShadow: `0 0 20px ${getAlphaColor(accentColor, '66')}` }}></div>
                    <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '12px', color: accentColor, marginBottom: '25px', textTransform: 'uppercase' }}>ROYALE</div>
                    <h1 style={{ 
                        fontSize: '84px', 
                        fontWeight: 900, 
                        margin: 0, 
                        lineHeight: 0.8, 
                        letterSpacing: '-5px',
                        color: textColor
                    }}>
                        {(property.name || property.title)?.toUpperCase()}
                    </h1>
                    <p style={{ marginTop: '50px', fontSize: '22px', opacity: 0.8, fontStyle: 'italic', color: getAlphaColor(textColor, 'E6'), lineHeight: '1.6', fontWeight: 300 }}>
                        "{aiTagline || 'A new standard of architectural excellence.'}"
                    </p>
                    <div style={{ marginTop: '60px', display: 'flex', gap: '60px' }}>
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '3px', marginBottom: '10px' }}>VALUATION</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: accentColor }}>{props.currency || '$'} {Number(property.price || 0).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '3px', marginBottom: '10px' }}>DESTINATION</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: textColor }}>{(property.city || 'GLOBAL')?.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2: ANALYTICS - IMMERSIVE DATA */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, display: 'flex', background: '#000000', overflow: 'hidden' }}>
                <div style={{ width: '45%', padding: '100px 80px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '48px', fontWeight: 900, color: accentColor, marginBottom: '50px', letterSpacing: '-2px' }}>DATA POINTS</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
                        {[
                            { label: 'LIVING AREA', v: `${property.area || 0} SQFT` },
                            { label: 'BEDROOMS', v: property.bedrooms },
                            { label: 'BATHROOMS', v: property.bathrooms },
                            { label: 'PARKING', v: property.parkingSpaces }
                        ].map((s, i) => (
                            <div key={i} style={{ borderBottom: `1px solid ${getAlphaColor(textColor, '0D')}`, paddingBottom: '20px' }}>
                                <div style={{ fontSize: '11px', color: getAlphaColor(textColor, '66'), letterSpacing: '3px', marginBottom: '8px' }}>{s.label}</div>
                                <div style={{ fontSize: '26px', fontWeight: 700, color: textColor }}>{s.v || '0'}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ 
                        lineHeight: '2.2', 
                        color: getAlphaColor(textColor, 'B3'), 
                        fontSize: '17px', 
                        textAlign: 'justify',
                        marginTop: 'auto'
                    }}>
                        {aiDescription || property.description}
                    </p>
                </div>
                
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: '#050505', borderLeft: `1px solid ${getAlphaColor(textColor, '0D')}` }}>
                    <div style={{ overflow: 'hidden' }}>
                        <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ 
                        padding: '60px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        textAlign: 'center',
                        background: '#000000'
                    }}>
                        {toggles.showQRCode && (
                            <div style={{ 
                                background: '#ffffff', 
                                padding: '25px', 
                                borderRadius: '30px', 
                                marginBottom: '40px',
                                boxShadow: `0 15px 30px ${getAlphaColor(accentColor, '22')}`
                            }}>
                                <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={120} />
                            </div>
                        )}
                        <div style={{ fontSize: '11px', fontWeight: 800, color: accentColor, letterSpacing: '3px', marginBottom: '15px' }}>ADVISORY CONTACT</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: textColor }}>{customContact?.name}</div>
                        <div style={{ fontSize: '16px', color: getAlphaColor(textColor, '66'), marginTop: '8px' }}>{customContact?.phone}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
