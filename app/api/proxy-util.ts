import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;


export async function proxyRequest(request: NextRequest, endpoint: string) {
    if (!BACKEND_URL) {
        console.error('CRITICAL: BACKEND_URL environment variable is missing.');
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    // Ensure endpoint doesn't start with double slash if BACKEND_URL ends with one
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

    // Fix: Automatically append /api to the base URL if it's missing, as our backend 
    // routes (app.js) are all registered under /api/* by default.
    // This allows BACKEND_URL to be set to just the domain (common for AWS/deployments).
    const needsApiPrefix = !cleanBase.endsWith('/api') && !cleanEndpoint.startsWith('/api') && cleanEndpoint !== '/health';
    const finalEndpoint = needsApiPrefix ? `/api${cleanEndpoint}` : cleanEndpoint;
    
    const url = `${cleanBase}${finalEndpoint}`;
    
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
    
    // Skip ngrok browser warning for free tier
    headers.set('ngrok-skip-browser-warning', 'true');

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
        console.log(`[Proxy] Forwarding ${method} to: ${url}`);
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
        console.error(`[Proxy Error] ${method} ${url}: ${error.message || error}`);
        
        // Check for specific common Docker network errors
        if (error.message?.includes('ECONNREFUSED')) {
            console.error(`DOCKER HINT: Ensure BACKEND_URL points to the container name (e.g. http://virpanix-backend:3001/api) instead of localhost.`);
        }
        
        return NextResponse.json(
            {
                success: false,
                message: 'Service temporarily unavailable. Please try again.',
            },
            { status: 502 }
        );
    }
}
