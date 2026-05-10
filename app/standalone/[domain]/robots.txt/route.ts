const BACKEND_URL = process.env.BACKEND_URL;

async function getWebsiteFullData(slugOrDomain: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/websites/public/${slugOrDomain}`, {
            next: { revalidate: 300 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error('Error fetching website data for robots:', err);
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
        return new Response('User-agent: *\nDisallow: /', { status: 404 });
    }

    const { website } = resData;
    const isRobotsEnabled = website.configuration?.seo?.enableRobots !== false;

    const baseUrl = website.customDomain
        ? `https://${website.customDomain}`
        : `https://website.virpanix.com/standalone/${domain}`;

    let robots = `User-agent: *\n`;

    if (isRobotsEnabled) {
        robots += `Allow: /\n`;
        robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    } else {
        robots += `Disallow: /\n`;
    }

    // Exclude API or admin calls from standalone
    robots += `Disallow: /auth/\n`;
    robots += `Disallow: /admin/\n`;

    return new Response(robots, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
        }
    });
}
