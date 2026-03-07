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
        toggles = { showPrice: true, showAmenities: true, showQRCode: true, showStats: true }
    } = props;

    const isLandscape = true;
    const pageWidth = '297mm';
    const pageHeight = '210mm';

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
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
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '60%', height: '100%', position: 'relative' }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,1))' }}></div>
                </div>
                <div style={{ width: '40%', height: '100%', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '6px', color: accentColor, marginBottom: '20px' }}>PREMIUM HORIZON</div>
                    <h1 style={{ fontSize: '56px', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 0.9, letterSpacing: '-2px' }}>{property.name || property.title}</h1>
                    <p style={{ margin: '30px 0', fontSize: '18px', lineHeight: '1.6', opacity: 0.8 }}>{aiTagline || 'Experience a new level of sophisticated living.'}</p>
                    {toggles.showPrice && <div style={{ fontSize: '32px', fontWeight: 900, color: accentColor }}>$ {property.price?.toLocaleString()}</div>}
                </div>
            </div>

            {/* PAGE 2: PANORAMA */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', height: '100%' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '30px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '10px', display: 'inline-block' }}>PROPERTY OVERVIEW</h2>
                        <p style={{ fontSize: '16px', lineHeight: '2', color: '#444', marginBottom: '40px' }}>{aiDescription || property.description}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {[
                                { label: 'AREA', value: property.area },
                                { label: 'BEDS', value: property.bedrooms },
                                { label: 'BATHS', value: property.bathrooms },
                                { label: 'YEAR', value: property.yearBuilt }
                            ].map((item, i) => (
                                <div key={i} style={{ borderLeft: `1px solid ${accentColor}`, paddingLeft: '15px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5 }}>{item.label}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '60px', borderRadius: '30px', overflow: 'hidden', height: '250px' }}>
                            <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden' }}>
                            <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, background: '#f8f9fa', borderRadius: '30px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: accentColor }}>INQUIRIES</h4>
                            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                                <div style={{ fontWeight: 800 }}>{customContact?.name}</div>
                                <div>{customContact?.phone}</div>
                                <div style={{ wordBreak: 'break-all' }}>{customContact?.email}</div>
                                <div style={{ marginTop: '20px' }}>
                                    {toggles.showQRCode && <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={100} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
