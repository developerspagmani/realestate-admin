import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * Body: { slug: string }
 *
 * Forces Next.js to purge the ISR cache for all standalone pages
 * belonging to the given website slug. Called from the WebsiteForm
 * "Clear Cache" button so admins can immediately see setting changes
 * (e.g. currency, theme, hero content) on the public-facing site.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const slug = body?.slug as string | undefined;

        if (!slug) {
            return NextResponse.json(
                { success: false, message: 'slug is required' },
                { status: 400 }
            );
        }

        // Revalidate all standalone routes that use this website slug
        const paths = [
            `/standalone/${slug}`,
            `/standalone/${slug}/p/[propertySlug]`,
            `/standalone/${slug}/u/[unitSlug]`,
        ];

        for (const path of paths) {
            revalidatePath(path);
        }

        return NextResponse.json({
            success: true,
            revalidated: true,
            paths,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[revalidate] Error:', err);
        return NextResponse.json(
            { success: false, message: err?.message || 'Revalidation failed' },
            { status: 500 }
        );
    }
}
