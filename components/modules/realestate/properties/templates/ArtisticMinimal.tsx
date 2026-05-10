import React from 'react';
import { BaseTemplateProps } from './types';

export default function ArtisticMinimalTemplate(props: BaseTemplateProps) {
    const {
        property,
        accentColor = '#1a1a1a',
        textColor = '#333333',
        allMedia = [],
        aiTagline,
        aiDescription,
        selectedImages,
        bgColor
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
            background: bgColor || '#fdfdfd', 
            color: textColor, 
            padding: '60px', 
            boxSizing: 'border-box',
            textAlign: 'left'
        }}>
            {/* Minimal Cover - ZEN REFINEMENT */}
            <div className="brochure-page" style={{ 
                height: '267mm', // account for padding
                display: 'flex', 
                flexDirection: 'column', 
                border: `1px solid ${getAlphaColor(accentColor, '11')}`, 
                padding: '80px',
                position: 'relative'
            }}>
                <div style={{ 
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '1px',
                    height: '60px',
                    background: getAlphaColor(accentColor, '33')
                }}></div>

                <div style={{ textAlign: 'center', marginBottom: '80px', marginTop: '40px' }}>
                    <div style={{ 
                        fontSize: '11px', 
                        letterSpacing: '12px', 
                        opacity: 0.5, 
                        marginBottom: '30px',
                        color: textColor,
                        fontWeight: 300
                    }}>CURATED ARCHIVE</div>
                    <h1 style={{ 
                        fontSize: '42px', 
                        fontWeight: 200, 
                        letterSpacing: '12px', 
                        color: textColor,
                        textTransform: 'uppercase',
                        margin: 0,
                        lineHeight: 1.2
                    }}>
                        {property.name || property.title}
                    </h1>
                </div>

                <div style={{ flex: 1, padding: '40px', background: '#f8f8f8', borderRadius: '4px', overflow: 'hidden' }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        crossOrigin="anonymous"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            filter: 'grayscale(15%) contrast(1.05)',
                            transition: 'all 0.5s ease'
                        }}
                        alt="Hero"
                    />
                </div>

                <div style={{ 
                    marginTop: '80px', 
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 1fr', 
                    gap: '60px', 
                    alignItems: 'flex-end',
                    paddingBottom: '20px'
                }}>
                    <div style={{ 
                        fontSize: '16px', 
                        lineHeight: '2.2', 
                        fontStyle: 'italic', 
                        color: getAlphaColor(textColor, '99'),
                        fontWeight: 300,
                        textAlign: 'justify'
                    }}>
                        {aiTagline || 'A quiet intersection of form and function.'}
                        <div style={{ marginTop: '20px', fontSize: '14px', fontStyle: 'normal', opacity: 0.6 }}>
                            Exploring the boundary between traditional architecture and modern lifestyle.
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', letterSpacing: '4px', opacity: 0.5, marginBottom: '10px' }}>OFFERED AT</div>
                        <div style={{ fontSize: '32px', fontWeight: 300, color: accentColor }}>{props.currency || '$'} {Number(property.price || 0).toLocaleString()}</div>
                        <div style={{ 
                            fontSize: '12px', 
                            letterSpacing: '2px', 
                            opacity: 0.6, 
                            marginTop: '15px',
                            textTransform: 'uppercase'
                        }}>
                            {property.city} &nbsp;/&nbsp; {property.state}
                        </div>
                    </div>
                </div>

                <div style={{ 
                    position: 'absolute',
                    bottom: '40px',
                    left: '80px',
                    fontSize: '9px',
                    letterSpacing: '2px',
                    opacity: 0.4
                }}>
                    REF NO: {property.id?.substring(0, 8).toUpperCase()}
                </div>
            </div>
        </div>
    );
}
