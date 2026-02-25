'use client';

import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function AdminPlotMapPageContent() {
    return <PlotMapManager mode="admin" />;
}

export default function AdminPlotMapPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading Plot Map..." /></div>}>
            <AdminPlotMapPageContent />
        </Suspense>
    );
}
