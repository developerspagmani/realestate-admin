import { Suspense } from 'react';
import UnitsManager from '@/components/modules/realestate/units/UnitsManager';

export default function OwnerUnitsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <UnitsManager mode="owner" />
        </Suspense>
    );
}
