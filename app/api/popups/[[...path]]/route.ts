import { NextRequest } from 'next/server';
import { proxyRequest } from '../../proxy-util';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/popups${path ? `/${path}` : '/'}${searchParams ? `?${searchParams}` : ''}`;
    console.log(`[Proxy] GET ${endpoint}`);
    return proxyRequest(request, endpoint);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/popups${path ? `/${path}` : '/'}${searchParams ? `?${searchParams}` : ''}`;
    console.log(`[Proxy] POST ${endpoint}`);
    return proxyRequest(request, endpoint);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/popups${path ? `/${path}` : '/'}${searchParams ? `?${searchParams}` : ''}`;
    console.log(`[Proxy] PUT ${endpoint}`);
    return proxyRequest(request, endpoint);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const endpoint = `/popups${path ? `/${path}` : '/'}${searchParams ? `?${searchParams}` : ''}`;
    console.log(`[Proxy] DELETE ${endpoint}`);
    return proxyRequest(request, endpoint);
}
