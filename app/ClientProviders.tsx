'use client';

import { ReactNode } from 'react';
import ReduxProvider from '@/components/ReduxProvider';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { ManagementProvider } from '@/app/contexts/ManagementContext';
import { LoadingProvider } from '@/app/contexts/LoadingContext';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ClientProvidersProps {
    children: ReactNode;
}

/**
 * PERF-F01 fix: Client-only providers extracted from root layout.
 * Keeps the root layout as a Server Component for SSR/RSC benefits.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
    const pathname = usePathname();

    useEffect(() => {
        // Initialize Bootstrap JS
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
    }, []);

    // PERF: Bypass heavy providers for legal/public pages to improve load speed
    const isLegalPage = pathname?.startsWith('/legal');

    if (isLegalPage) {
        return <>{children}</>;
    }

    return (
        <ReduxProvider>
            <AuthProvider>
                <ManagementProvider>
                    <LoadingProvider>
                        {children}
                    </LoadingProvider>
                </ManagementProvider>
            </AuthProvider>
        </ReduxProvider>
    );
}
