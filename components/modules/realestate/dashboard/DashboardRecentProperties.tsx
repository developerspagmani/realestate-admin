import React from 'react';
import { Property } from '@/app/services/types';

interface DashboardRecentPropertiesProps {
    properties: Property[];
    loading: boolean;
}

export default function DashboardRecentProperties({ properties, loading }: DashboardRecentPropertiesProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
                <h5 className="fw-bold mb-0">Recently Added Properties</h5>
            </div>
            <div className="card-body p-4 pt-0">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="d-flex align-items-center mb-3">
                            <div className="skeleton rounded-3 me-3" style={{ width: '60px', height: '60px' }}></div>
                            <div className="flex-grow-1">
                                <div className="skeleton h-1rem w-75 mb-1"></div>
                                <div className="skeleton h-1rem w-50"></div>
                            </div>
                        </div>
                    ))
                ) : properties.length === 0 ? (
                    <div className="text-center py-5 text-muted small">No recent properties</div>
                ) : (
                    <div>
                        {properties.map((property) => (
                            <div key={property.id} className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0 me-3">
                                    {property.mainImage?.url ? (
                                        <img
                                            src={property.mainImage.url}
                                            alt={property.title}
                                            className="rounded-3"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                            <i className="bi bi-building text-muted"></i>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                    <h6 className="mb-0 fw-bold small text-truncate">{property.title}</h6>
                                    <div className="extra-small text-muted text-truncate">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {property.city}, {property.state}
                                    </div>
                                    <div className="mt-1 d-flex align-items-center">
                                        <span className={`badge extra-small ${property.status === 1 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                                            }`}>
                                            {property.status === 1 ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="extra-small text-muted ms-2">
                                            {new Date(property.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                .extra-small { font-size: 11px; }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .skeleton {
                    background: rgba(0,0,0,0.05);
                    border-radius: 4px;
                    animation: pulse 1.5s infinite ease-in-out;
                }
                .h-1rem { height: 1rem; }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
