'use client';

import dynamic from 'next/dynamic';
import Loader from '@/components/common/Loader';

const OwnerLicense = dynamic(
    () => import('@/components/modules/realestate/owners/Detail/OwnerLicense'),
    {
        ssr: false,
        loading: () => (
            <div className="text-center py-5">
                <Loader size="md" message="Loading license details..." />
            </div>
        )
    }
);

export default function OwnerLicensePage() {
    return <OwnerLicense />;
}
