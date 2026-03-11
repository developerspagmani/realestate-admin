import { Metadata } from 'next';
import ExplorePageClient from './ExplorePageClient';

const BACKEND_URL = process.env.BACKEND_URL

async function getWebsiteData(slugOrDomain: string) {
    if (!slugOrDomain) return null;
    try {
        const res = await fetch(`${BACKEND_URL}/websites/public/${slugOrDomain}`, {
            next: { revalidate: 1 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error('Error fetching website data for exploration:', err);
        return null;
    }
}

export async function generateMetadata(props: any): Promise<Metadata> {
    try {
        const params = await props.params;
        const { domain } = params;
        const data = await getWebsiteData(domain);
        if (!data?.success) return { title: 'Explore Properties' };

        const website = data.website;
        return {
            title: `Explore Properties | ${website.name}`,
            description: `Browse all available properties at ${website.name}.`
        };
    } catch (e) {
        return { title: 'Explore Properties' };
    }
}

export default async function ExplorePage(props: any) {
    const params = await props.params;
    const { domain } = params;
    const data = await getWebsiteData(domain);

    return <ExplorePageClient domain={domain} initialWebsite={data?.website} />;
}
