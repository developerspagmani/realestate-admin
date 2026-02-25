'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { userService, getAuthToken } from '@/app/services/api';
import Loader from '@/components/common/Loader';

export default function OwnerProperties() {
    const { id } = useParams();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProperties = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getOwnerProperties(token, id as string);
                if (response.success) {
                    setProperties(response.data.properties);
                }
            } catch (error) {
                console.error('Failed to load properties:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProperties();
    }, [id]);

    if (loading) return <Loader message="Loading portfolio properties..." />;

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="vi-table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Property Name</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Address</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-center">Units</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Created At</th>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {properties.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-5 text-muted">No properties assigned to this owner.</td></tr>
                        ) : properties.map((prop) => (
                            <tr key={prop.id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold text-dark">{prop.title}</div>
                                    <div className="text-muted extra-small">ID: {prop.id.substring(0, 8)}</div>
                                </td>
                                <td className="py-3">
                                    <span className="small text-muted">{prop.addressLine1}, {prop.city}, {prop.state}</span>
                                </td>
                                <td className="py-3 text-center">
                                    <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-4 fw-bold">
                                        {prop._count?.units || 0}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className={`badge rounded-4 px-3 py-2 ${prop.status === 1 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                                        {prop.status === 1 ? 'Active' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-end text-muted small">
                                    {new Date(prop.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-end text-muted small">
                                    {new Date(prop.updatedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .extra-small { font-size: 11px; }
            `}</style>
        </div>
    );
}
