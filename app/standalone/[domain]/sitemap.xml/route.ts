import { websiteService } from '@/app/services/api';

const BACKEND_URL = process.env.BACKEND_URL || 'https://realestate-api-seven.vercel.app/api';

async function getWebsiteFullData(slugOrDomain: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/websites/public/${slugOrDomain}`, {
            next: { revalidate: 300 } // Revalidate every 5 minutes
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error('Error fetching website data for sitemap:', err);
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ domain: string }> }
) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;

    const resData = await getWebsiteFullData(domain);
    if (!resData?.success || !resData?.website) {
        return new Response('Website not found', { status: 404 });
    }

    const { website, data: properties = [] } = resData;

    // Check if sitemap is enabled
    if (website.configuration?.seo?.generateSitemap === false) {
        return new Response('Sitemap is disabled', { status: 404 });
    }

    const baseUrl = website.customDomain
        ? `https://${website.customDomain}`
        : `https://website.virpanix.com/standalone/${domain}`;

    // Generate XML content
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Main Home Page -->
    <url>
        <loc>${baseUrl}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>`;

    // Add properties
    properties.forEach((prop: any) => {
        const propUrl = `${baseUrl}/p/${prop.slug || prop.id}`;
        xml += `
    <url>
        <loc>${propUrl}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    // Add CMS pages if website has them
    // Assuming website.configuration.menus.header/footer might contain pages
    const menus = website.configuration?.menus || { header: [], footer: [] };
    const allMenuItems = [...(menus.header || []), ...(menus.footer || [])];

    const pageSlugs = new Set();
    allMenuItems.forEach((item: any) => {
        if (item.type === 'page' && item.pageSlug) {
            pageSlugs.add(item.pageSlug);
        }
    });

    pageSlugs.forEach(slug => {
        xml += `
    <url>
        <loc>${baseUrl}/page/${slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
    });

    xml += `
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
        }
    });
}
