'use client';

import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function OwnerPlotMapPageContent() {
    return <PlotMapManager mode="owner" />;
}

export default function OwnerPlotMapPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading Plot Map..." /></div>}>
            <OwnerPlotMapPageContent />
        </Suspense>
    );
}
