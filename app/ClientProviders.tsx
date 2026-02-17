'use client';

import { ReactNode } from 'react';
import ReduxProvider from '@/components/ReduxProvider';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { ManagementProvider } from '@/app/contexts/ManagementContext';
import { LoadingProvider } from '@/app/contexts/LoadingContext';
import { useEffect } from 'react';

interface ClientProvidersProps {
    children: ReactNode;
}

/**
 * PERF-F01 fix: Client-only providers extracted from root layout.
 * Keeps the root layout as a Server Component for SSR/RSC benefits.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
    useEffect(() => {
        // Initialize Bootstrap JS
        require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }, []);

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
