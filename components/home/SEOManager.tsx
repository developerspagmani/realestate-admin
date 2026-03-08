'use client';

import { seoData } from '@/utils/seoData';

interface SEOManagerProps {
    pageKey: string;
}

export default function SEOManager({ pageKey }: SEOManagerProps) {
    const config = seoData[pageKey];

    if (!config) return null;

    const schemaData = {
        "@context": "https://schema.org",
        "@type": config.schemaType || "SoftwareApplication",
        "name": config.title,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": config.description,
        ...(config.ogUrl && { "url": config.ogUrl }),
        ...(config.ratingValue && {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": config.ratingValue,
                "ratingCount": config.ratingCount || "0"
            }
        })
    };

    return (
        <>
            <title>{config.title}</title>
            <meta name="description" content={config.description} />
            <meta name="keywords" content={config.keywords} />

            {/* Open Graph / Social */}
            <meta property="og:title" content={config.ogTitle || config.title} />
            <meta property="og:description" content={config.ogDescription || config.description} />
            <meta property="og:type" content="website" />
            {config.ogUrl && <meta property="og:url" content={config.ogUrl} />}
            <meta property="og:image" content="/images/og-image.png" />

            {/* Schema.org Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(schemaData)
                }}
            />
        </>
    );
}
