'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Property3DManager from '@/components/modules/realestate/properties/Property3DManager';
import MainLayout from '@/components/MainLayout';

function Property3DManagerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const propertyId = searchParams.get('propertyId');
    const propertyName = searchParams.get('propertyName') || 'Property';

    if (!propertyId) {
        return (
            <MainLayout activePage="properties">
                <div className="container-fluid p-4">
                    <div className="alert alert-warning shadow-sm border-0 rounded-4 p-4 text-center">
                        <i className="bi bi-exclamation-triangle-fill text-warning fs-1 mb-3 d-block"></i>
                        <h4 className="fw-bold">No Property Selected</h4>
                        <p className="text-muted">Please select a property from the Properties list to configure its 3D Workspace.</p>
                        <Link href="/realestate-admin/properties" className="btn btn-primary rounded-4 px-4">Go to Properties</Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="properties">
            <div className="container-fluid p-4">
                <div className="mb-4">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link href="/realestate-admin/properties" className="text-decoration-none">Properties</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">3D Architect</li>
                        </ol>
                    </nav>
                </div>
                <Property3DManager
                    propertyId={propertyId}
                    propertyName={propertyName}
                    onClose={() => router.push('/realestate-admin/properties')}
                />
            </div>
        </MainLayout>
    );
}

export default function Property3DManagerWrapper() {
    return (
        <Suspense fallback={
            <MainLayout activePage="properties">
                <div className="container-fluid p-4 text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-3 text-muted">Loading 3D workspace...</p>
                </div>
            </MainLayout>
        }>
            <Property3DManagerContent />
        </Suspense>
    );
}

