'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Property3DManager from '@/components/modules/realestate/properties/Property3DManager';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import { getAuthToken } from '@/app/services/api';
import { propertyService } from '@/app/services/api';

// Role-specific logic removed as this is now Admin-only
export default function Property3DManagerWrapper() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const propertyId = searchParams.get('propertyId');
    const propertyName = searchParams.get('propertyName') || 'Property';
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();

    const mode = searchParams.get('mode');
    const basePath = '/realestate-admin';
    const activePage = mode === 'builder' ? 'property-3d-builder' : 'property-3d';

    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!propertyId) {
            loadProperties();
        }
    }, [propertyId, activeTenantId, activeOwnerId, tenantType]);
    const loadProperties = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (token) {
                const industryType = (!activeOwnerId && !activeTenantId) ? tenantType : undefined;

                const response = await propertyService.getProperties(token, {
                    tenantId: activeTenantId || undefined,
                    industryType,
                    ownerId: activeOwnerId || undefined,
                    limit: '100'
                });
                if (response.success) {
                    const rawProps = response.data?.properties || response.data || [];
                    setProperties(rawProps);
                }
            }
        } catch (error) {
            console.error('Failed to load properties', error);
        } finally {
            setLoading(false);
        }
    };

    if (!propertyId) {
        return (
            <MainLayout activePage={activePage}>
                <div className="container-fluid p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="fw-bold mb-1">3D Workspace Architect</h4>
                            <p className="text-muted mb-0">Select a property to configure its 3D layout</p>
                        </div>
                        <Link href={`${basePath}/properties`} className="btn btn-outline-primary">
                            <i className="bi bi-plus-lg me-2"></i>New Property
                        </Link>
                    </div>

                    <div className="card border-0 shadow-sm overflow-hidden">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-muted small text-uppercase fw-bold">
                                        <tr>
                                            <th className="px-4 py-3 border-0">Property</th>
                                            <th className="py-3 border-0">Location</th>
                                            <th className="py-3 border-0 text-end px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5">
                                                    <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                                                    Loading properties...
                                                </td>
                                            </tr>
                                        ) : properties.length > 0 ? (
                                            properties.map((property) => (
                                                <tr key={property.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                <i className="bi bi-building text-primary h5 mb-0"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark">{property.name}</div>
                                                                <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>{property.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="small">{property.city}, {property.state}</div>
                                                    </td>
                                                    <td className="py-3 text-end px-4">
                                                        <Link
                                                            href={`/realestate-admin/property-3d?propertyId=${property.id}&propertyName=${encodeURIComponent(property.name)}`}
                                                            className="btn btn-sm btn-primary rounded-pill px-4"
                                                        >
                                                            <i className="bi bi-box-fill me-2"></i>Launch Architect
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5 text-muted">
                                                    No properties found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage={activePage}>
            <div className="container-fluid p-4">
                <div className="mb-4">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link href={`${basePath}/properties`} className="text-decoration-none">Properties</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">3D Architect</li>
                        </ol>
                    </nav>
                </div>
                <Property3DManager
                    propertyId={propertyId}
                    propertyName={propertyName}
                    initialMode={mode === 'builder' ? 'visual' : 'json'}
                    onClose={() => router.push(`${basePath}/properties`)}
                />
            </div>
        </MainLayout>
    );
}
