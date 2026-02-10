'use client';

import { Suspense } from 'react';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function OwnerPlotMapPageContent() {
    return <PlotMapManager mode="owner" />;
}

export default function OwnerPlotMapPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <OwnerPlotMapPageContent />
        </Suspense>
    );
}
