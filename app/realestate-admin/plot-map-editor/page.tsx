'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/common/Loader';
import PlotMapManager from '@/components/modules/realestate/properties/PlotMapManager';

function AdminPlotMapEditorPageContent() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get('propertyId') || '';
    const propertyName = searchParams.get('propertyName') || '';

    return (
        <PlotMapManager
            mode="admin"
            propertyId={propertyId}
            propertyName={propertyName}
        />
    );
}

export default function AdminPlotMapEditorPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading Plot Map Editor..." /></div>}>
            <AdminPlotMapEditorPageContent />
        </Suspense>
    );
}
