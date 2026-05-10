import React, { Suspense, lazy } from 'react';
import StandaloneProvider from './StandaloneProvider';

const BACKEND_URL = process.env.BACKEND_URL;

async function getWebsiteData(slugOrDomain: string) {
    const fetchUrl = `${BACKEND_URL}/api/websites/public/${slugOrDomain}`;
    console.log('DEBUG: Fetching website data from:', fetchUrl);
    try {
        const res = await fetch(fetchUrl, {
            cache: 'no-store'
        });
        if (!res.ok) {
            console.log('DEBUG: Fetch failed with status:', res.status);
            return null;
        }
        const data = await res.json();
        console.log('DEBUG: Fetch success, website found:', !!data?.website);
        return data;
    } catch (err) {
        console.error('DEBUG: Network error fetching website data:', err);
        return null;
    }
}

export default async function StandaloneLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ domain: string }>;
}) {
    const resolvedParams = await params;
    const data = await getWebsiteData(resolvedParams.domain);

    if (!data?.success || !data?.website) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
                <div className="text-center p-5 rounded-5 shadow-2xl border max-w-md">
                    <i className="bi bi-shield-lock display-1 text-danger opacity-25 mb-4 d-block"></i>
                    <h2 className="fw-black text-dark mb-3">Portal Unavailable</h2>
                    <p className="text-muted mb-4">The requested real estate portal could not be found or is currently private.</p>
                </div>
            </div>
        );
    }

    return (
        <StandaloneProvider
            website={data.website}
            initialData={data.data || []}
            slugOrDomain={resolvedParams.domain}
        >
            <Suspense fallback={null}>
                {children}
            </Suspense>
        </StandaloneProvider>
    );
}
