'use client';

import { Suspense } from 'react';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function AdminPlotMapPageContent() {
    return <PlotMapManager mode="admin" />;
}

export default function AdminPlotMapPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <AdminPlotMapPageContent />
        </Suspense>
    );
}
