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
        selectedImages
    } = props;

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return null;
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : null;
    };

    return (
        <div style={{ width: '210mm', background: '#fcfcfc', color: textColor, padding: '40px', boxSizing: 'border-box' }}>
            {/* Minimal Cover */}
            <div className="brochure-page" style={{ height: '277mm', display: 'flex', flexDirection: 'column', border: `1px solid ${accentColor}11`, padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ fontSize: '10px', letterSpacing: '10px', opacity: 0.4, marginBottom: '20px' }}>ARCHIVE</div>
                    <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '8px' }}>{property.name?.toUpperCase()}</h1>
                </div>

                <div style={{ flex: 1, padding: '20px' }}>
                    <img
                        src={selectedImages?.cover || property.mainImage?.url || getMediaUrl(property.mainImageId || '') || undefined}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }}
                    />
                </div>

                <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.8', fontStyle: 'italic', opacity: 0.7 }}>
                        {aiTagline}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>$ {property.price?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>{property.city}, {property.state}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
