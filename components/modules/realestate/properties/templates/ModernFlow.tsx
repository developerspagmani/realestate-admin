import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BaseTemplateProps } from './types';

export default function ModernFlowTemplate(props: BaseTemplateProps) {
    const {
        property,
        mode,
        companyInfo,
        fontStyle,
        accentColor = '#6366f1',
        textColor = '#333333',
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

    const getVal = (key: string, fallback: any = '0') => {
        return (property as any)[key] || (property as any).realEstateDetails?.[key] || (property as any).metadata?.[key] || fallback;
    };

    // Helper to get translucent versions of colors
    const getAlphaColor = (hex: string, alpha: string) => {
        if (!hex || hex.length < 7) return hex;
        return hex + alpha;
    };

    return (
        <div style={{
            width: pageWidth,
            background: '#ffffff',
            color: textColor,
            fontFamily: fontStyle,
            margin: '0 auto',
            boxSizing: 'border-box',
            textAlign: 'left'
        }}>
            {/* PAGE 1: COVER - REFINED DESIGN */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '65%',
                    height: '100%',
                    background: accentColor,
                    clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    zIndex: 0,
                    opacity: 0.95
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, padding: '80px 60px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '60px' }}>
                        <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            letterSpacing: '6px', 
                            color: accentColor,
                            marginBottom: '5px'
                        }}>Exquisite Living</div>
                        <div style={{ width: '40px', height: '2px', background: accentColor }}></div>
                    </div>

                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            width: '100%',
                            height: '580px',
                            borderRadius: '45px',
                            overflow: 'hidden',
                            boxShadow: '0 50px 100px rgba(0,0,0,0.12)',
                            position: 'relative',
                            zIndex: 2,
                            border: `8px solid #ffffff`
                        }}>
                            <img
                                src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                crossOrigin="anonymous"
                                alt="Main"
                            />
                        </div>

                        <div style={{
                            position: 'absolute',
                            bottom: '-20px',
                            left: '40px',
                            background: '#ffffff',
                            padding: '60px',
                            borderRadius: '40px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.08)',
                            maxWidth: '75%',
                            zIndex: 3,
                            borderLeft: `12px solid ${accentColor}`
                        }}>
                            <div style={{ 
                                fontSize: '13px', 
                                fontWeight: 800, 
                                textTransform: 'uppercase', 
                                letterSpacing: '3px', 
                                color: getAlphaColor(textColor, '99'), 
                                marginBottom: '15px' 
                            }}>
                                {aiTagline || 'A Masterpiece of Design'}
                            </div>
                            <h1 style={{ 
                                fontSize: '56px', 
                                fontWeight: 900, 
                                color: textColor,
                                textTransform: 'uppercase', 
                                margin: 0, 
                                lineHeight: 1.0, 
                                letterSpacing: '-2px' 
                            }}>
                                {property.name || property.title}
                            </h1>
                            <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '30px', borderTop: `1px solid ${getAlphaColor(textColor, '11')}`, paddingTop: '20px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: getAlphaColor(textColor, '77') }}>
                                    <i className="bi bi-geo-alt-fill me-2" style={{ color: accentColor }}></i>
                                    {property.city}, {property.state}
                                </div>
                                {toggles.showPrice && (
                                    <div style={{ fontSize: '28px', fontWeight: 900, color: accentColor }}>
                                        {props.currency || '$'} {Number(property.price || 0).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ 
                            padding: '20px 30px', 
                            background: getAlphaColor(accentColor, '15'), 
                            borderRadius: '20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px',
                            border: `1px solid ${getAlphaColor(accentColor, '22')}`
                        }}>
                            <span style={{ fontWeight: 900, fontSize: '28px', color: accentColor }}>{companyInfo?.name?.charAt(0) || property.name?.charAt(0) || 'E'}</span>
                            <div style={{ width: '1px', height: '30px', background: getAlphaColor(accentColor, '33') }}></div>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: textColor, letterSpacing: '1px' }}>CERTIFIED PROPERTY</span>
                        </div>
                        <div style={{ textAlign: 'right', opacity: 0.6 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: textColor }}>EDITION {(new Date()).getFullYear()}</div>
                            <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: accentColor }}>{mode === 'owner' ? companyInfo?.name : 'PREMIUM ESTATES'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2: ESSENCE - IMPROVED SPACING */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '80px 60px' }}>
                <div style={{ display: 'flex', gap: '50px', height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ width: '50px', height: '4px', background: accentColor }}></div>
                            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '4px', color: accentColor }}>THE PREVIEW</span>
                        </div>
                        
                        <h2 style={{ 
                            fontSize: '64px', 
                            fontWeight: 900, 
                            letterSpacing: '-4px', 
                            lineHeight: 0.85, 
                            marginBottom: '40px',
                            color: textColor 
                        }}>
                            THE <br /><span style={{ color: accentColor }}>ESSENCE</span>
                        </h2>
                        
                        <p style={{ 
                            fontSize: '17px', 
                            lineHeight: '1.9', 
                            color: getAlphaColor(textColor, 'CC'), 
                            marginBottom: '50px',
                            textAlign: 'justify'
                        }}>
                            {aiDescription || property.description}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '50px' }}>
                            <div style={{ background: '#fcfcfc', border: `1px solid ${getAlphaColor(textColor, '08')}`, padding: '35px', borderRadius: '35px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: accentColor, letterSpacing: '3px', marginBottom: '15px' }}>LAND AREA</div>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: textColor }}>{getVal('area')} <span style={{ fontSize: '13px', color: getAlphaColor(textColor, '66') }}>SQ FT</span></div>
                            </div>
                            <div style={{ background: accentColor, padding: '35px', borderRadius: '35px', color: '#ffffff', boxShadow: `0 20px 40px ${getAlphaColor(accentColor, '33')}` }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '3px', marginBottom: '15px' }}>AVAILABILITY</div>
                                <div style={{ fontSize: '28px', fontWeight: 900 }}>{String(property.status || 'ACTIVE').toUpperCase()}</div>
                            </div>
                        </div>

                        {toggles.showAmenities && (
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: accentColor, letterSpacing: '3px', marginBottom: '25px' }}>SIGNATURE AMENITIES</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                                    {(property as any).propertyAmenities?.slice(0, 10).map((pa: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', background: accentColor, borderRadius: '2px', transform: 'rotate(45deg)' }}></div>
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: getAlphaColor(textColor, 'EE') }}>{pa.amenity?.name || 'High-End Feature'}</span>
                                        </div>
                                    )) || (
                                        <div style={{ fontSize: '14px', fontStyle: 'italic', color: getAlphaColor(textColor, '66') }}>Premium features throughout</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ height: '45%', borderRadius: '40px', overflow: 'hidden', background: '#eee', border: `1px solid ${getAlphaColor(textColor, '08')}` }}>
                            <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ 
                            flex: 1, 
                            borderRadius: '40px', 
                            background: getAlphaColor(textColor, '03'), 
                            padding: '50px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            textAlign: 'center',
                            border: `1px solid ${getAlphaColor(textColor, '05')}`
                        }}>
                            <div style={{ marginBottom: '35px' }}>
                                <div style={{ fontSize: '56px', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{getVal('bedrooms', '0')}</div>
                                <div style={{ fontWeight: 800, letterSpacing: '4px', fontSize: '13px', color: textColor, marginTop: '10px' }}>BEDROOMS</div>
                            </div>
                            <div style={{ width: '40px', height: '1px', background: getAlphaColor(textColor, '15'), margin: '0 auto 35px' }}></div>
                            <div>
                                <div style={{ fontSize: '56px', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{getVal('bathrooms', '0')}</div>
                                <div style={{ fontWeight: 800, letterSpacing: '4px', fontSize: '13px', color: textColor, marginTop: '10px' }}>BATHROOMS</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: LEGACY - DYNAMIC FOOTER */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '80px 60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '38px', fontWeight: 900, color: textColor, letterSpacing: '-2px', margin: 0 }}>VISUAL <span style={{ color: accentColor }}>JOURNEY</span></h2>
                    <div style={{ flex: 1, height: '1px', background: getAlphaColor(textColor, '08') }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '25px', height: '420px', marginBottom: '50px' }}>
                    <div style={{ borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                        <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={getMediaUrl(property.gallery?.[3] as any) || undefined} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>

                <div style={{ 
                    marginTop: 'auto', 
                    background: textColor, 
                    borderRadius: '50px', 
                    padding: '60px', 
                    color: '#ffffff', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    boxShadow: `0 30px 60px ${getAlphaColor(textColor, '33')}`
                }}>
                    <div style={{ maxWidth: '65%' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '4px', color: accentColor, marginBottom: '15px' }}>CONSULTATION</div>
                        <h3 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-1px' }}>LET'S CONNECT</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '35px', lineHeight: '1.6' }}>Contact our prestige advisors to schedule a private viewing or technical orientation of this estate.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 800 }}>{customContact?.name}</div>
                            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{customContact?.phone}</div>
                            <div style={{ fontSize: '16px', color: accentColor, fontWeight: 800, textDecoration: 'none' }}>{customContact?.website}</div>
                        </div>
                    </div>
                    {toggles.showQRCode && (
                        <div style={{ 
                            background: '#ffffff', 
                            padding: '25px', 
                            borderRadius: '35px',
                            boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
                        }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={120} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
