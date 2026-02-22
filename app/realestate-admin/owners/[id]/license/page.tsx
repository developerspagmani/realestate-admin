'use client';

import dynamic from 'next/dynamic';

const OwnerLicense = dynamic(
    () => import('@/components/modules/realestate/owners/Detail/OwnerLicense'),
    {
        ssr: false,
        loading: () => (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3 small">Loading license details...</p>
            </div>
        )
    }
);

export default function OwnerLicensePage() {
    return <OwnerLicense />;
}
