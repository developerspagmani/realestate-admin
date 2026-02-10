'use client';

import { Property } from '@/types';
import Link from 'next/link';

interface PropertiesListProps {
    properties: Property[];
    isLoading: boolean;
    onEdit: (property: Property) => void;
    onDelete: (id: string) => void;
    onNavigateToUnits: (id: string) => void;
    userRole?: number; // 2=Admin, 3=Owner
}

export default function PropertiesList({
    properties,
    isLoading,
    onEdit,
    onDelete,
    onNavigateToUnits,
    userRole
}: PropertiesListProps) {
    return (
        <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase fw-bold">
                            <tr>
                                <th className="px-4 py-3 border-0">Property</th>
                                <th className="py-3 border-0">Type</th>
                                <th className="py-3 border-0">Location</th>
                                <th className="py-3 border-0">Status</th>
                                <th className="py-3 border-0 text-end px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5">
                                        <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                                        <span className="text-muted">Loading properties...</span>
                                    </td>
                                </tr>
                            ) : properties.length > 0 ? (
                                properties.map((property) => (
                                    <tr key={property.id}>
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                    <i className="bi bi-building text-primary h5 mb-0"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{property.name}</div>
                                                    <div className="text-muted small text-truncate" style={{ maxWidth: '250px' }}>{property.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="badge bg-light text-primary text-capitalize px-3 py-2">
                                                {property.propertyType?.replace('_', ' ') || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="small fw-medium text-dark">{property.city}, {property.state}</div>
                                            <div className="text-muted extra-small">{property.address}</div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge rounded-pill ${property.status === 'active' || (property.status as any) === 1 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'} px-3 py-2`}>
                                                {property.status === 'active' || (property.status as any) === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-end px-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={() => onEdit(property)}
                                                    title="Edit"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={() => onDelete(property.id)}
                                                    title="Delete"
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                                {userRole === 2 && (
                                                    <Link
                                                        href={`/realestate-admin/property-3d?propertyId=${property.id}&propertyName=${encodeURIComponent(property.name)}`}
                                                        className="btn btn-sm btn-outline-info rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Architect 3D Layout"
                                                    >
                                                        <i className="bi bi-tools"></i>
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/realestate-owner-admin/tour/${property.id}`}
                                                    className="btn btn-sm btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    title="Immersive 3D Tour"
                                                >
                                                    <i className="bi bi-eye-fill"></i>
                                                </Link>
                                                <Link
                                                    href={`${userRole === 3 ? '/realestate-owner-admin' : '/realestate-admin'}/plot-map-editor?propertyId=${property.id}&propertyName=${encodeURIComponent(property.name)}`}
                                                    className="btn btn-sm btn-outline-warning rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    title="SVG Plot Map Editor"
                                                >
                                                    <i className="bi bi-map"></i>
                                                </Link>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={() => onNavigateToUnits(property.id)}
                                                    title="Manage Units"
                                                >
                                                    <i className="bi bi-layout-three-columns"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-5">
                                        <div className="mb-3">
                                            <i className="bi bi-building-x text-muted display-4 opacity-25"></i>
                                        </div>
                                        <h5 className="text-muted">No properties found</h5>
                                        <p className="text-muted small">Try adjusting your search or add a new property.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <style jsx>{`
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .extra-small { font-size: 11px; }
      `}</style>
        </div>
    );
}
