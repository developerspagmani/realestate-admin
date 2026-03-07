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

    const isLandscape = false;
    const pageWidth = '210mm';
    const pageHeight = '297mm';

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
    };

    const getVal = (key: string, fallback: any = '—') => {
        return (property as any)[key] || (property as any).realEstateDetails?.[key] || (property as any).metadata?.[key] || fallback;
    };

    return (
        <div style={{
            width: pageWidth,
            background: '#ffffff',
            color: textColor,
            fontFamily: fontStyle,
            margin: '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* PAGE 1: COVER */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '70%',
                    height: '100%',
                    background: accentColor,
                    clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, padding: '60px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', color: accentColor }}>Portfolio Series</div>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                            width: '100%',
                            height: '600px',
                            borderRadius: '40px',
                            overflow: 'hidden',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.15)',
                            position: 'relative',
                            zIndex: 2
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
                            bottom: '-40px',
                            left: '40px',
                            background: '#ffffff',
                            padding: '50px',
                            borderRadius: '30px',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                            maxWidth: '70%',
                            zIndex: 3,
                            borderLeft: `10px solid ${accentColor}`
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: accentColor, marginBottom: '10px' }}>{aiTagline || 'Prestige Residence'}</div>
                            <h1 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 0.9, letterSpacing: '-2px' }}>{property.name || property.title}</h1>
                            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#666' }}>{property.city}, {property.state}</div>
                                {toggles.showPrice && <div style={{ fontSize: '24px', fontWeight: 900, color: accentColor }}>$ {property.price?.toLocaleString()}</div>}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ width: '100px', height: '100px', background: '#f8f9fa', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 900, fontSize: '24px', color: accentColor }}>E.</span>
                        </div>
                        <div style={{ textAlign: 'right', opacity: 0.5 }}>
                            <div style={{ fontSize: '10px', fontWeight: 800 }}>ESTABLISHED {(new Date()).getFullYear()}</div>
                            <div style={{ fontSize: '10px', fontWeight: 800 }}>{mode === 'owner' ? companyInfo?.name : 'PREMIUM ESTATES'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2: ESSENCE */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '60px' }}>
                <div style={{ display: 'flex', gap: '60px', height: '100%' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ width: '40px', height: '4px', background: accentColor, marginBottom: '20px' }}></div>
                        <h2 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.9, marginBottom: '40px' }}>THE <br /><span style={{ color: accentColor }}>ESSENCE</span></h2>
                        <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#555', marginBottom: '40px' }}>
                            {aiDescription || property.description}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '30px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: accentColor, letterSpacing: '2px', marginBottom: '15px' }}>DIMENSIONS</div>
                                <div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('area')} <span style={{ fontSize: '12px' }}>SQ FT</span></div>
                            </div>
                            <div style={{ background: accentColor, padding: '30px', borderRadius: '30px', color: '#fff' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', marginBottom: '15px' }}>STATUS</div>
                                <div style={{ fontSize: '24px', fontWeight: 900 }}>{String(property.status || 'ACTIVE').toUpperCase()}</div>
                            </div>
                        </div>

                        {toggles.showAmenities && (
                            <div style={{ marginTop: '60px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: accentColor, letterSpacing: '2px', marginBottom: '20px' }}>AMENITIES</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {(property.gallery || []).slice(0, 10).map((a: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '6px', height: '6px', background: accentColor, borderRadius: '20%' }}></div>
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{a.name || 'Feature'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ height: '50%', borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, borderRadius: '30px', background: '#f8f9fa', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 900, color: accentColor }}>{getVal('bedrooms', '0')}</div>
                            <div style={{ fontWeight: 800, letterSpacing: '2px', fontSize: '12px' }}>BEDROOMS</div>
                            <div style={{ height: '30px' }}></div>
                            <div style={{ fontSize: '48px', fontWeight: 900, color: accentColor }}>{getVal('bathrooms', '0')}</div>
                            <div style={{ fontWeight: 800, letterSpacing: '2px', fontSize: '12px' }}>BATHROOMS</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: CONTACT */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '60px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: accentColor, marginBottom: '30px' }}>VISUAL JOURNEY</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '400px', marginBottom: '40px' }}>
                    <div style={{ borderRadius: '30px', overflow: 'hidden' }}>
                        <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={getMediaUrl(property.gallery?.[3] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', background: '#000', borderRadius: '40px', padding: '60px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '10px' }}>LET'S CONNECT</h3>
                        <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '30px' }}>Schedule a private tour of this magnificent property.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontWeight: 700 }}>{customContact?.name}</div>
                            <div style={{ opacity: 0.8 }}>{customContact?.phone}</div>
                            <div style={{ color: accentColor, fontWeight: 700 }}>{customContact?.website}</div>
                        </div>
                    </div>
                    {toggles.showQRCode && (
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '30px' }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={120} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
