import { Suspense } from 'react';
import UnitsManager from '@/components/modules/realestate/units/UnitsManager';
import Loader from '@/components/common/Loader';

export default function AdminUnitsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="" /></div>}>
            <UnitsManager mode="admin" />
        </Suspense>
    );
}
