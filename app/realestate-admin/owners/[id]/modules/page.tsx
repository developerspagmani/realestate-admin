'use client';

import dynamic from 'next/dynamic';

const OwnerModules = dynamic(
    () => import('@/components/modules/realestate/owners/Detail/OwnerModules'),
    {
        ssr: false,
        loading: () => (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3 small">Loading module configuration...</p>
            </div>
        )
    }
);

export default function OwnerModulesPage() {
    return <OwnerModules />;
}
