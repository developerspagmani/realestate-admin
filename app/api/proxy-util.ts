import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://realestate-api-seven.vercel.app/api';

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

    const options: RequestInit = {
        method,
        headers,
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
        console.error(`Proxy error for ${method} ${endpoint}:`, error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal Server Error in Proxy',
                error: error.message,
                endpoint,
                url,
                method
            },
            { status: 500 }
        );
    }
}
