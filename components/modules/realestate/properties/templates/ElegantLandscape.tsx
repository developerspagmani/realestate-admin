import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BaseTemplateProps } from './types';

export default function ElegantLandscapeTemplate(props: BaseTemplateProps) {
    const {
        property,
        mode,
        companyInfo,
        fontStyle,
        accentColor = '#5d4037',
        textColor = '#1a1a1a',
        allMedia = [],
        aiTagline,
        aiDescription,
        isPreview,
        customContact,
        selectedImages,
        toggles = { showPrice: true, showAmenities: true, showQRCode: true, showStats: true },
        bgColor
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
            background: bgColor || '#ffffff',
            color: textColor,
            fontFamily: fontStyle,
            margin: '0 auto',
            boxSizing: 'border-box',
            textAlign: 'left'
        }}>
            {/* PAGE 1: COVER - PANORAMIC ELEGANCE */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '60%', height: '100%', position: 'relative' }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                        alt="Hero"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.7) 85%, rgba(255,255,255,1))' }}></div>
                </div>
                <div style={{ width: '40%', height: '100%', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: bgColor || '#ffffff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '8px', color: accentColor, marginBottom: '30px', textTransform: 'uppercase' }}>PREMIUM HORIZON</div>
                    <h1 style={{ fontSize: '64px', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 0.85, letterSpacing: '-3px', color: textColor }}>{property.name || property.title}</h1>
                    <p style={{ margin: '40px 0', fontSize: '20px', lineHeight: '1.7', color: getAlphaColor(textColor, '99'), fontWeight: 300 }}>{aiTagline || 'Experience a new level of sophisticated living.'}</p>
                    <div style={{ width: '80px', height: '1px', background: accentColor, marginBottom: '40px' }}></div>
                    {toggles.showPrice && <div style={{ fontSize: '38px', fontWeight: 900, color: accentColor }}>{props.currency || '$'} {Number(property.price || 0).toLocaleString()}</div>}
                </div>
            </div>

            {/* PAGE 2: PANORAMA - ARCHITECTURAL DEPTH */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '60px', height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '38px', fontWeight: 900, margin: 0, color: textColor, letterSpacing: '-1.5px' }}>PROPERTY OVERVIEW</h2>
                            <div style={{ flex: 1, height: '2px', background: getAlphaColor(accentColor, '22') }}></div>
                        </div>
                        
                        <p style={{ 
                            fontSize: '17px', 
                            lineHeight: '2.1', 
                            color: getAlphaColor(textColor, 'CC'), 
                            marginBottom: '50px',
                            textAlign: 'justify' 
                        }}>
                            {aiDescription || property.description}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', marginBottom: '60px' }}>
                            {[
                                { label: 'TOTAL AREA', value: `${property.area || 0} SQFT` },
                                { label: 'BEDROOMS', value: property.bedrooms },
                                { label: 'BATHROOMS', value: property.bathrooms },
                                { label: 'YEAR BUILT', value: property.yearBuilt }
                            ].map((item, i) => (
                                <div key={i} style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: '20px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: getAlphaColor(textColor, '66'), letterSpacing: '2px', marginBottom: '8px' }}>{item.label}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: textColor }}>{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 'auto', borderRadius: '40px', overflow: 'hidden', height: '280px', boxShadow: '0 30px 60px rgba(0,0,0,0.05)' }}>
                            <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ flex: 1.2, borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.08)' }}>
                            <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ 
                            flex: 1, 
                            background: getAlphaColor(textColor, '03'), 
                            borderRadius: '40px', 
                            padding: '50px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            border: `1px solid ${getAlphaColor(textColor, '08')}`
                        }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: accentColor, letterSpacing: '4px', marginBottom: '25px' }}>INQUIRIES</h4>
                            <div style={{ fontSize: '16px', lineHeight: '2' }}>
                                <div style={{ fontWeight: 800, fontSize: '20px', marginBottom: '10px' }}>{customContact?.name}</div>
                                <div style={{ color: getAlphaColor(textColor, '99') }}>{customContact?.phone}</div>
                                <div style={{ color: getAlphaColor(textColor, '99'), wordBreak: 'break-all' }}>{customContact?.email}</div>
                                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                                    {toggles.showQRCode && (
                                        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={110} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
