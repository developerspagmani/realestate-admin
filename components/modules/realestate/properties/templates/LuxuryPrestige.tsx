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

    return (
        <div style={{
            width: pageWidth,
            background: '#0a0a0a',
            color: textColor,
            fontFamily: fontStyle,
            margin: '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* PAGE 1: COVER */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                }}></div>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                    zIndex: 1
                }}></div>

                <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ borderLeft: `5px solid ${accentColor}`, paddingLeft: '30px', marginBottom: '40px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '8px', color: accentColor, marginBottom: '20px' }}>{aiTagline || 'Exclusive Collection'}</div>
                        <h1 style={{ fontSize: '64px', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 0.85, letterSpacing: '-3px' }}>{property.name || property.title}</h1>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>{property.city} | {property.state}</div>
                            {toggles.showPrice && <div style={{ fontSize: '32px', fontWeight: 900, color: accentColor }}>$ {property.price?.toLocaleString()}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '3px', color: accentColor }}>THE PRESTIGE SERIES</div>
                            <div style={{ fontSize: '10px', opacity: 0.5 }}>By {mode === 'owner' ? companyInfo?.name : 'RealEstate Premium'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2: ARCHITECTURE */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '80px 60px' }}>
                <div style={{ position: 'absolute', top: '40px', right: '40px', opacity: 0.05, fontSize: '120px', fontWeight: 900, color: accentColor, pointerEvents: 'none' }}>02</div>

                <div style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-2px', textTransform: 'uppercase', marginBottom: '30px' }}>ART OF <span style={{ color: accentColor }}>LIVING</span></h2>
                    <p style={{ fontSize: '18px', lineHeight: '2', color: 'rgba(255,255,255,0.8)', maxWidth: '90%', borderBottom: `1px solid ${accentColor}33`, paddingBottom: '40px' }}>
                        {aiDescription || property.description}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '60px' }}>
                    {[
                        { label: 'Area', value: `${property.area || '—'} sqft` },
                        { label: 'Year', value: property.yearBuilt || '—' },
                        { label: 'Type', value: property.propertyType || '—' }
                    ].map((item, i) => (
                        <div key={i} style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}22`, borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: accentColor, letterSpacing: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>{item.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 700 }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: '-10px', border: `1px solid ${accentColor}44`, zIndex: 0 }}></div>
                        <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} style={{ width: '100%', height: '400px', objectFit: 'cover', position: 'relative', zIndex: 1 }} />
                    </div>
                    <div style={{ width: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '40px' }}>
                        <div><div style={{ fontSize: '42px', fontWeight: 900, color: accentColor }}>{property.bedrooms || '0'}</div><div style={{ fontSize: '12px', letterSpacing: '4px' }}>BEDS</div></div>
                        <div><div style={{ fontSize: '42px', fontWeight: 900, color: accentColor }}>{property.bathrooms || '0'}</div><div style={{ fontSize: '12px', letterSpacing: '4px' }}>BATHS</div></div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: LEGACY */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', padding: '60px' }}>
                <div style={{ height: '500px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '40px' }}>
                    <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ borderTop: `1px solid ${accentColor}`, paddingTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ maxWidth: '60%' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: accentColor, marginBottom: '20px' }}>INQUIRIES</h3>
                        <div style={{ fontSize: '16px', lineHeight: '2' }}>
                            <div style={{ fontWeight: 800 }}>{customContact?.name}</div>
                            <div style={{ opacity: 0.7 }}>{customContact?.phone}</div>
                            <div style={{ opacity: 0.7 }}>{customContact?.email}</div>
                            <div style={{ color: accentColor }}>{customContact?.website}</div>
                        </div>
                    </div>
                    {toggles.showQRCode && (
                        <div style={{ background: '#fff', padding: '15px', borderRadius: '4px' }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={120} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
