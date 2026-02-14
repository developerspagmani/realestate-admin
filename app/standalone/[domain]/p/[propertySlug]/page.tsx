import { Metadata } from 'next';
import PropertyDetailClient from './PropertyDetailClient';

const BACKEND_URL = process.env.BACKEND_URL || 'https://realestate-api-seven.vercel.app/api';

async function getPropertyData(idOrSlug: string) {
    if (!idOrSlug) return null;
    try {
        const url = `${BACKEND_URL}/public/properties/${idOrSlug}`;
        console.log(`Fetching property data from: ${url}`);
        const res = await fetch(url, {
            next: { revalidate: 60 }
        });
        if (!res.ok) {
            console.error(`Backend returned ${res.status} for ${url}`);
            return null;
        }
        return res.json();
    } catch (err) {
        console.error('Error fetching property data for SEO:', err);
        return null;
    }
}

export async function generateMetadata(props: any): Promise<Metadata> {
    try {
        const params = await props.params;
        const { propertySlug } = params;

        const data = await getPropertyData(propertySlug);

        if (!data?.success || !data?.data) {
            return { title: 'Property Not Found | Real Estate Portal' };
        }

        const property = data.data;
        const title = `${property.title} | Premium Real Estate`;

        return {
            title,
            description: property.description?.substring(0, 160),
            openGraph: {
                title,
                description: property.description,
                images: property.mainImage ? [property.mainImage.url] : [],
            },
        };
    } catch (e) {
        console.error('Metadata generation error:', e);
        return { title: 'Real Estate Portal' };
    }
}

export default async function PropertyPage(props: any) {
    const params = await props.params;
    const { propertySlug } = params;

    // Fallback if propertySlug is missing
    if (!propertySlug) {
        return <div className="p-5 text-center">Invalid property address.</div>;
    }

    return <PropertyDetailClient propertySlug={propertySlug} />;
}
