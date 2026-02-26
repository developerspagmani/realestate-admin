'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ReduxProvider from '@/components/ReduxProvider';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { ManagementProvider } from '@/app/contexts/ManagementContext';
import { LoadingProvider } from '@/app/contexts/LoadingContext';

interface ClientProvidersProps {
    children: ReactNode;
}

/**
 * PERF-F01 fix: Client-only providers extracted from root layout.
 * Keeps the root layout as a Server Component for SSR/RSC benefits.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
    const pathname = usePathname();

    // Initialize QueryClient once per session
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute stale time
                refetchOnWindowFocus: false, // Prevent re-fetching on tab switch
            },
        },
    }));

    useEffect(() => {
        // Initialize Bootstrap JS
        require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }, []);

    // PERF: Bypass heavy providers for legal/public pages to improve load speed
    const isLegalPage = pathname?.startsWith('/legal');

    if (isLegalPage) {
        return <>{children}</>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ReduxProvider>
                <AuthProvider>
                    <ManagementProvider>
                        <LoadingProvider>
                            {children}
                        </LoadingProvider>
                    </ManagementProvider>
                </AuthProvider>
            </ReduxProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
