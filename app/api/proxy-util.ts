import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://realestate-api-seven.vercel.app/api';


export async function proxyRequest(request: NextRequest, endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    const method = request.method;

    // Copy essential headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        // Skip headers that should not be forwarded or might cause issues
        if (!['host', 'connection', 'content-length', 'cookie', 'transfer-encoding'].includes(lowerKey)) {
            headers.set(key, value);
        }
    });

    // Ensure connection is handled correctly
    headers.set('Connection', 'keep-alive');

    // Extract tags from custom header
    const tagsHeader = request.headers.get('x-cache-tags');
    const tags = tagsHeader ? tagsHeader.split(',').map(t => t.trim()) : [];

    const options: RequestInit = {
        method,
        headers,
        // If it's a GET request with tags, we use the server-side data cache
        cache: (method === 'GET' && tags.length > 0) ? 'force-cache' : 'no-store',
        ...(tags.length > 0 ? { next: { tags } } : {}) as any
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            options.body = await request.arrayBuffer();
        } catch (e) {
            console.error('Error reading request body:', e);
        }
    }

    try {
        const response = await fetch(url, options);
        const data = await response.arrayBuffer();

        // Construct the forwarding response
        const proxiedResponse = new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
                // Don't copy other headers as they might conflict with Next.js/Vercel
            },
        });

        return proxiedResponse;
    } catch (error: any) {
        // SEC-F04 fix: Log details server-side only, don't expose to client
        console.error(`Proxy error for ${method} ${endpoint}:`, error.message);
        return NextResponse.json(
            {
                success: false,
                message: 'Service temporarily unavailable. Please try again.',
            },
            { status: 502 }
        );
    }
}
