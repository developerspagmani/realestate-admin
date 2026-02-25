'use client';

import dynamic from 'next/dynamic';
import Loader from '@/components/common/Loader';

const OwnerModules = dynamic(
    () => import('@/components/modules/realestate/owners/Detail/OwnerModules'),
    {
        ssr: false,
        loading: () => (
            <div className="text-center py-5">
                <Loader size="md" message="Loading module configuration..." />
            </div>
        )
    }
);

export default function OwnerModulesPage() {
    return <OwnerModules />;
}
