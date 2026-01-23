import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://realestate-api-seven.vercel.app/api';

export async function proxyRequest(request: NextRequest, endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    const method = request.method;

    // Copy all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        // Skip host header to avoid SSL/Routing issues on backend
        if (key.toLowerCase() !== 'host') {
            headers.set(key, value);
        }
    });

    // Ensure connection is closed
    headers.set('Connection', 'close');

    const options: RequestInit = {
        method,
        headers,
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = await request.arrayBuffer();
    }

    try {
        const response = await fetch(url, options);
        const data = await response.arrayBuffer();

        // Construct the forwarding response
        const proxiedResponse = new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
            },
        });

        return proxiedResponse;
    } catch (error: any) {
        console.error(`Proxy error for ${endpoint}:`, error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error in Proxy', error: error.message },
            { status: 500 }
        );
    }
}
