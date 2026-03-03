import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Server-side API Route for on-demand cache revalidation.
 * This route allows the client component (via cacheManager) to trigger
 * the server-only revalidateTag function.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tags } = body;

        if (!tags || !Array.isArray(tags)) {
            return NextResponse.json({
                success: false,
                message: 'No tags provided. Expected an array of tags.'
            }, { status: 400 });
        }

        // We only revalidate valid tag strings
        const validTags = tags.filter(tag => typeof tag === 'string');

        // Execute revalidation for each tag
        for (const tag of validTags) {
            console.log(`[Cache] Server-side revalidation triggered for tag: ${tag}`);
            (revalidateTag as any)(tag);
        }

        return NextResponse.json({
            success: true,
            message: `Revalidated ${validTags.length} tags: ${validTags.join(', ')}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Cache] Revalidation route error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to revalidate cache. Server error.'
        }, { status: 500 });
    }
}
