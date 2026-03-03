'use client';
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface BrochureTemplateProps {
    property: any;
    mode: 'admin' | 'owner';
    companyInfo?: any;
    fontStyle?: string;
    design?: 'modern' | 'luxury' | 'classic' | 'elegant_landscape' | 'premium_landscape';
    accentColor?: string;
    allAmenities?: any[];
    allMedia?: any[];
    aiTagline?: string;
    aiDescription?: string;
    isPreview?: boolean;
    // Advanced
    customContact?: any;
    selectedImages?: any;
    toggles?: any;
}

export default function BrochureTemplate({
    property,
    mode,
    companyInfo,
    fontStyle = "'Outfit', sans-serif",
    design = 'modern',
    accentColor,
    allAmenities = [],
    allMedia = [],
    aiTagline,
    aiDescription,
    isPreview = false,
    customContact,
    selectedImages,
    toggles = { showPrice: true, showAmenities: true, showQRCode: true, showStats: true }
}: BrochureTemplateProps) {
    if (!property) return null;

    // Design Tokens
    const config = {
        modern: { primary: accentColor || '#0d6efd', bg: '#ffffff', text: '#333333', accent: '#f8f9fa', footerBg: '#f0f2f5', isLandscape: false, pattern: 'radial-gradient(#0d6efd11 1px, transparent 1px)' },
        luxury: { primary: accentColor || '#d4af37', bg: '#090909', text: '#f5f5f5', accent: '#1a1a1a', footerBg: '#111111', isLandscape: false, pattern: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a), linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a)' },
        classic: { primary: accentColor || '#1c4d2d', bg: '#fffdfa', text: '#2d3436', accent: '#f1f2f6', footerBg: '#dfe6e9', isLandscape: false, pattern: 'none' },
        elegant_landscape: { primary: accentColor || '#5d4037', bg: '#ffffff', text: '#1a1a1a', accent: '#fdfbf7', footerBg: '#f8f5f0', isLandscape: true, pattern: 'radial-gradient(#5d403708 1px, transparent 1px)' },
        premium_landscape: { primary: accentColor || '#c5a059', bg: '#0a0a0a', text: '#ffffff', accent: '#151515', footerBg: '#0f0f0f', isLandscape: true, pattern: 'radial-gradient(#c5a05915 1px, transparent 1px)' }
    };

    const theme = config[design] || config.modern;
    const isDark = design === 'luxury' || design === 'premium_landscape';
    const isLandscape = theme.isLandscape;
    const pageWidth = isLandscape ? '297mm' : '210mm';
    const pageHeight = isLandscape ? '210mm' : '297mm';

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
    };

    const getVal = (key: string, fallback: any = '—') => {
        // Try top level, then realEstateDetails, then metadata
        return property[key] || property.realEstateDetails?.[key] || property.metadata?.[key] || fallback;
    };

    return (
        <div id={isPreview ? "brochure-preview-area" : "brochure-capture-area"} style={{
            width: pageWidth,
            background: theme.bg,
            color: theme.text,
            fontFamily: fontStyle,
            position: isPreview ? 'relative' : 'static',
            margin: isPreview ? '0' : '0 auto',
            boxSizing: 'border-box'
        }}>
            {/* PAGE 1: COVER */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', background: theme.bg }}>
                {/* 85% Overlay Background Gallery Image */}
                {(selectedImages?.bg1 || property.gallery?.[2]) && (
                    <>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${selectedImages?.bg1 || getMediaUrl(typeof property.gallery[2] === 'string' ? property.gallery[2] : property.gallery[2].url)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.2, // Higher opacity for visible texture
                            filter: 'grayscale(100%) contrast(1.2)'
                        }} />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.8) 100%)'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.85) 100%)'
                        }} />
                    </>
                )}

                {isLandscape ? (
                    <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: '60%', height: '100%', position: 'relative' }}>
                            {(property.mainImage?.url || getMediaUrl(property.mainImageId)) ? (
                                <img
                                    src={property.mainImage?.url || getMediaUrl(property.mainImageId)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    crossOrigin="anonymous"
                                    alt="Main Landscape"
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: theme.accent }} />
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: isDark ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.9))' : 'linear-gradient(to right, transparent, rgba(255,255,255,0.7))' }}></div>
                        </div>
                        <div style={{ width: '45%', height: '100%', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: theme.bg, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `${theme.primary}10`, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                            <div style={{ marginBottom: '30px', borderLeft: `5px solid ${theme.primary}`, paddingLeft: '20px' }}>
                                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '5px', color: theme.primary, marginBottom: '12px', fontWeight: 700 }}>{aiTagline || 'Signature Collection'}</div>
                                <h1 style={{ fontSize: '42px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-1.5px', color: theme.text, lineHeight: 1 }}>{property.title}</h1>
                            </div>
                            <p style={{ opacity: 0.9, fontSize: '15px', lineHeight: '1.6', marginBottom: '40px', fontStyle: 'italic' }}>"{aiDescription?.split('.')[0]}."</p>
                            <div style={{ borderTop: `1px solid ${theme.accent}`, paddingTop: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: theme.primary, letterSpacing: '2px' }}>Curated By</div>
                                        <div style={{ fontWeight: 800, fontSize: '18px' }}>{mode === 'owner' ? companyInfo?.name : 'RealEstate Premium'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: theme.primary, letterSpacing: '2px' }}>Vesting Price</div>
                                        <div style={{ fontSize: '28px', fontWeight: 900 }}>{property.currency || '$'} {property.price ? property.price.toLocaleString() : 'P.O.R'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 2 }}>
                        <div style={{ height: '70%', width: '100%', position: 'relative', overflow: 'hidden' }}>
                            {(selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId)) ? (
                                <img
                                    src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    crossOrigin="anonymous"
                                    alt="Main Property"
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: theme.accent }} />
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))' }}></div>
                            <div style={{ position: 'absolute', top: '30px', left: '30px', width: '60px', height: '4px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}></div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%', background: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.98)', padding: '35px', borderRadius: design === 'modern' ? '25px' : '0px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', borderTop: `6px solid ${theme.primary}`, zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                    {aiTagline && <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px', color: theme.primary, fontWeight: 800 }}>{aiTagline}</div>}
                                    <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', fontFamily: fontStyle, color: theme.text, letterSpacing: '-1.5px', lineHeight: 1 }}>{property.title}</h1>
                                    <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <p style={{ margin: 0, fontSize: '15px', color: isDark ? '#aaa' : '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="bi bi-geo-alt-fill" style={{ color: theme.primary }}></i> {property.city}
                                        </p>
                                        <div style={{ width: '1px', height: '15px', background: isDark ? 'rgba(255,255,255,0.2)' : '#ccc' }}></div>
                                        {toggles.showPrice && <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: theme.primary }}>{property.currency || '$'} {property.price ? property.price.toLocaleString() : 'P.O.R'}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '30px', width: '100%', textAlign: 'center', opacity: 0.3, letterSpacing: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>
                            {mode === 'owner' ? companyInfo?.name : 'Signature Series'}
                        </div>
                    </div>
                )}
            </div>

            {/* PAGE 2: DETAILS (Property Essence) */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', background: theme.bg }}>
                {/* 90% Overlay Background Gallery Image */}
                {(selectedImages?.bg2 || property.gallery?.[0]) && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${selectedImages?.bg2 || getMediaUrl(typeof property.gallery[0] === 'string' ? property.gallery[0] : property.gallery[0].url)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.1,
                        filter: 'grayscale(70%) contrast(0.8)'
                    }} />
                )}

                <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: isLandscape ? '15mm 20mm' : '20mm 25mm', display: 'flex', flexDirection: 'column' }}>
                    {isLandscape ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '50px', flex: 1, alignItems: 'center' }}>
                            <div>
                                <div style={{ width: '60px', height: '2px', background: theme.primary, marginBottom: '20px' }}></div>
                                <h2 style={{ fontSize: '48px', fontWeight: 900, color: theme.text, marginBottom: '30px', letterSpacing: '-2px', textTransform: 'uppercase', lineHeight: 0.9 }}>
                                    The <span style={{ color: theme.primary }}>Essence</span> <br />Of Living
                                </h2>
                                <p style={{ lineHeight: '1.8', fontSize: '15px', color: isDark ? '#ddd' : '#555', borderLeft: `1px solid ${theme.primary}44`, paddingLeft: '25px' }}>
                                    {aiDescription || property.description}
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ padding: '30px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '30px', border: `1px solid ${theme.primary}22`, backdropFilter: 'blur(10px)' }}>
                                        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: theme.primary, marginBottom: '20px' }}>Architectural Specs</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                            {[
                                                { label: 'Area', value: getVal('area') !== '—' ? `${getVal('area').toLocaleString()} Sqft` : '—' },
                                                { label: 'Built', value: getVal('yearBuilt') }
                                            ].map((item, i) => (
                                                <div key={i}><div style={{ fontSize: '10px', opacity: 0.6 }}>{item.label}</div><div style={{ fontWeight: 800, fontSize: '18px' }}>{item.value}</div></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '30px', background: theme.primary, color: '#fff', borderRadius: '30px', boxShadow: `0 20px 40px ${theme.primary}33` }}>
                                        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: 'rgba(255,255,255,0.7)', marginBottom: '15px' }}>Configurations</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('bedrooms', '0')}</div><div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Beds</div></div>
                                            <div><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('bathrooms', '0')}</div><div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Baths</div></div>
                                            <div><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('parkingSpaces', getVal('parkingSlots', '0'))}</div><div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Park</div></div>
                                        </div>
                                    </div>
                                </div>
                                {toggles.showAmenities && (
                                    <div style={{ padding: '30px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '30px', border: `1px solid ${theme.primary}22`, backdropFilter: 'blur(10px)' }}>
                                        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: theme.primary, marginBottom: '25px' }}>Signature Amenities</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(property.propertyAmenities || property.amenities || []).slice(0, 8).map((a: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <i className="bi bi-check2-circle" style={{ color: theme.primary }}></i>
                                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{a.amenity?.name || a.name || (typeof a === 'string' ? a : 'Feature')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ width: '40px', height: '4px', background: theme.primary, marginBottom: '20px' }}></div>
                                <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.9, marginBottom: '30px', textTransform: 'uppercase' }}>
                                    The <span style={{ color: theme.primary }}>Essence</span>
                                </h1>
                                <p style={{ fontSize: '16px', lineHeight: '1.8', color: isDark ? '#ccc' : '#444', maxWidth: '80%' }}>
                                    {aiDescription || property.description}
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    <div style={{ padding: '35px', background: theme.accent, borderRadius: '40px', border: `1px solid ${theme.primary}33`, backdropFilter: 'blur(10px)' }}>
                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: theme.primary, marginBottom: '20px' }}>Dimensions</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div><div style={{ fontSize: '28px', fontWeight: 900 }}>{getVal('area')}</div><div style={{ fontSize: '9px', opacity: 0.5 }}>SQ FT AREA</div></div>
                                            <div><div style={{ fontSize: '28px', fontWeight: 900 }}>{getVal('yearBuilt')}</div><div style={{ fontSize: '9px', opacity: 0.5 }}>YEAR BUILT</div></div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '35px', background: theme.primary, color: '#fff', borderRadius: '40px', boxShadow: `0 30px 60px ${theme.primary}44` }}>
                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>Capacity</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('bedrooms', '0')}</div><div style={{ fontSize: '8px' }}>BEDS</div></div>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('bathrooms', '0')}</div><div style={{ fontSize: '8px' }}>BATHS</div></div>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 900 }}>{getVal('parkingSpaces', getVal('parkingSlots', '0'))}</div><div style={{ fontSize: '8px' }}>CARS</div></div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '35px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.primary}22`, borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: theme.primary, marginBottom: '25px' }}>Exclusive Amenities</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                        {(property.propertyAmenities || property.amenities || []).slice(0, 10).map((a: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '4px', height: '4px', background: theme.primary, borderRadius: '50%' }}></div>
                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.amenity?.name || a.name || (typeof a === 'string' ? a : 'Feature')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.primary}22`, paddingTop: '20px', fontSize: '10px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <div>Ref: PR-{property.id?.substring(0, 8)}</div>
                        <div>Chapter 02 | Essence</div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: GALLERY */}
            <div className="brochure-page" style={{ height: pageHeight, width: pageWidth, position: 'relative', overflow: 'hidden', background: theme.bg }}>
                {/* 90% Overlay Background Gallery Image */}
                {(selectedImages?.bg3 || property.gallery?.[1]) && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${selectedImages?.bg3 || getMediaUrl(typeof property.gallery[1] === 'string' ? property.gallery[1] : property.gallery[1].url)})`,
                        backgroundSize: 'cover',
                        opacity: 0.12,
                        filter: 'grayscale(50%) brightness(0.9)'
                    }} />
                )}

                <div style={{ position: 'relative', zIndex: 2, padding: isLandscape ? '15mm 20mm' : '20mm 25mm', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 900, color: theme.primary, marginBottom: '30px', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>Visual Panorama</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isLandscape ? 'repeat(3, 1fr)' : '1fr 1fr', gap: '20px', height: isLandscape ? '90mm' : '150mm', marginBottom: '40px' }}>
                        {(property.gallery || []).slice(0, isLandscape ? 3 : 4).map((img: any, i: number) => {
                            const url = getMediaUrl(typeof img === 'string' ? img : img.url);
                            return (
                                <div key={i} style={{ overflow: 'hidden', borderRadius: '30px', background: theme.accent, boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }}>
                                    {url ? (
                                        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" alt={`Gallery ${i}`} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                            <i className="bi bi-image" style={{ fontSize: '32px' }}></i>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 'auto', padding: '40px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderRadius: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: isDark ? `1px solid ${theme.primary}44` : 'none', backdropFilter: 'blur(15px)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: theme.primary, fontSize: '24px', textTransform: 'uppercase', letterSpacing: '-1px' }}>Connect With Us</h3>
                            <p style={{ margin: '10px 0 20px 0', opacity: 0.8, fontSize: '14px' }}>Ready to step into your future? Scan the code or reach out to our specialists.</p>
                            <div style={{ fontSize: '16px', fontWeight: 700 }}>
                                <i className="bi bi-telephone-fill me-3" style={{ color: theme.primary }}></i> {customContact?.phone || '+1 (555) 000-0000'}<br />
                                <i className="bi bi-envelope-fill me-3" style={{ color: theme.primary }}></i> {customContact?.email || 'sales@realestate.com'}<br />
                                <i className="bi bi-globe me-3" style={{ color: theme.primary }}></i> {customContact?.website || (typeof window !== 'undefined' ? window.location.host : 'www.realestate.com')}
                            </div>
                        </div>
                        {toggles.showQRCode && (
                            <div style={{ width: '130px', height: '130px', background: '#fff', padding: '15px', borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QRCodeCanvas value={typeof window !== 'undefined' ? `${window.location.origin}/property/${property.id}` : `property/${property.id}`} size={100} level="H" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
