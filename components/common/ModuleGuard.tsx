'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ModuleGuardProps {
    children: ReactNode;
    moduleSlug: string;
    fallbackUrl?: string;
}

/**
 * ModuleGuard protects components or pages based on the user's active modules.
 * It uses the AuthContext's hasModule helper.
 */
export default function ModuleGuard({
    children,
    moduleSlug,
    fallbackUrl = '/unauthorized'
}: ModuleGuardProps) {
    const { hasModule, isAuthenticated, loading } = useAuthContext();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            const authorized = hasModule(moduleSlug);
            setIsAuthorized(authorized);

            if (!authorized) {
                router.push(fallbackUrl);
            }
        }
    }, [loading, isAuthenticated, hasModule, moduleSlug, router, fallbackUrl]);

    if (loading || isAuthorized === null) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary pulse" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
