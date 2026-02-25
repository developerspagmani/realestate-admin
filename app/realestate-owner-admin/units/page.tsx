import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import UnitsManager from '@/components/modules/realestate/units/UnitsManager';

export default function OwnerUnitsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading Units..." /></div>}>
            <UnitsManager mode="owner" />
        </Suspense>
    );
}
