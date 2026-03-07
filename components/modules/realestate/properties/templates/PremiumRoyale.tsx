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

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
    };

    return (
        <div style={{ width: '297mm', background: '#050505', color: textColor, boxSizing: 'border-box' }}>
            {/* Dark Landscape Cover */}
            <div className="brochure-page" style={{ height: '210mm', width: '297mm', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                    />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, transparent 0%, #050505 80%)' }}></div>

                <div style={{ position: 'relative', zIndex: 1, padding: '80px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '50%' }}>
                    <div style={{ width: '100px', height: '1px', background: accentColor, marginBottom: '30px' }}></div>
                    <div style={{ fontSize: '14px', letterSpacing: '10px', color: accentColor, marginBottom: '20px' }}>ROYALE</div>
                    <h1 style={{ fontSize: '72px', fontWeight: 900, margin: 0, lineHeight: 0.8, letterSpacing: '-4px' }}>{property.name?.toUpperCase()}</h1>
                    <p style={{ marginTop: '40px', fontSize: '20px', opacity: 0.7, fontStyle: 'italic' }}>"{aiTagline}"</p>
                    <div style={{ marginTop: '40px', display: 'flex', gap: '40px' }}>
                        <div><div style={{ fontSize: '10px', opacity: 0.5 }}>INVESTMENT</div><div style={{ fontSize: '24px', fontWeight: 700, color: accentColor }}>$ {property.price?.toLocaleString()}</div></div>
                        <div><div style={{ fontSize: '10px', opacity: 0.5 }}>LOCATION</div><div style={{ fontSize: '24px', fontWeight: 700 }}>{property.city?.toUpperCase()}</div></div>
                    </div>
                </div>
            </div>

            {/* Content Page */}
            <div className="brochure-page" style={{ height: '210mm', width: '297mm', display: 'flex', background: '#000' }}>
                <div style={{ width: '50%', padding: '80px', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '42px', fontWeight: 900, color: accentColor, marginBottom: '40px' }}>SPECIFICATIONS</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '60px' }}>
                        {[
                            { label: 'AREA', v: property.area },
                            { label: 'BEDS', v: property.bedrooms },
                            { label: 'BATHS', v: property.bathrooms },
                            { label: 'PARKING', v: property.parkingSpaces }
                        ].map((s, i) => (
                            <div key={i} style={{ borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                                <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>{s.label}</div>
                                <div style={{ fontSize: '24px', fontWeight: 700 }}>{s.v || '0'}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ lineHeight: '2', opacity: 0.8, fontSize: '16px' }}>{aiDescription}</p>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: '#111' }}>
                    <img src={selectedImages?.bg1 || getMediaUrl(property.gallery?.[0] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <img src={selectedImages?.bg2 || getMediaUrl(property.gallery?.[1] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <img src={selectedImages?.bg3 || getMediaUrl(property.gallery?.[2] as any) || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ background: '#fff', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                            <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${property.id}`} size={120} />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{customContact?.name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>{customContact?.phone}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
