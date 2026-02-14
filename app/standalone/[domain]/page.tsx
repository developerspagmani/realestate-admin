import { Metadata } from 'next';
import HomePageClient from './HomePageClient';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001/api';

async function getWebsiteData(slugOrDomain: string) {
    if (!slugOrDomain) return null;
    try {
        const res = await fetch(`${BACKEND_URL}/websites/public/${slugOrDomain}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error('Error fetching website data for metadata:', err);
        return null;
    }
}

export async function generateMetadata(props: any): Promise<Metadata> {
    try {
        const params = await props.params;
        const { domain } = params;
        const data = await getWebsiteData(domain);
        if (!data?.success) return { title: 'Real Estate Portal' };

        const website = data.website;
        const seo = website.configuration?.seo || {};

        return {
            title: seo.title || website.name,
            description: seo.description || `Welcome to ${website.name} real estate portal.`,
            openGraph: {
                title: seo.title || website.name,
                description: seo.description,
                images: website.configuration?.builder?.logoUrl ? [website.configuration.builder.logoUrl] : [],
            }
        };
    } catch (e) {
        return { title: 'Real Estate Portal' };
    }
}

export default async function StandaloneDomainPage(props: any) {
    // Note: domain is used by layout.tsx to fetch website config and provide it to HomePageClient via context.
    return <HomePageClient />;
}
