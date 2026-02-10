'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function OwnerPlotMapEditorPageContent() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get('propertyId') || '';
    const propertyName = searchParams.get('propertyName') || '';

    return (
        <PlotMapManager
            mode="owner"
            propertyId={propertyId}
            propertyName={propertyName}
        />
    );
}

export default function OwnerPlotMapEditorPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <OwnerPlotMapEditorPageContent />
        </Suspense>
    );
}
