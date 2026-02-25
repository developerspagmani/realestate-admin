'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { userService, getAuthToken } from '@/app/services/api';
import Loader from '@/components/common/Loader';

export default function OwnerUnits() {
    const { id } = useParams();
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUnits = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getOwnerUnits(token, id as string);
                if (response.success) {
                    setUnits(response.data.units);
                }
            } catch (error) {
                console.error('Failed to load units:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUnits();
    }, [id]);

    if (loading) return <Loader message="Loading business units..." />;

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-success-soft text-success rounded-4 px-3 py-2">Available</span>;
            case 2: return <span className="badge bg-primary-soft text-primary rounded-4 px-3 py-2">Occupied</span>;
            case 3: return <span className="badge bg-warning-soft text-warning rounded-4 px-3 py-2">Maintenance</span>;
            default: return <span className="badge bg-secondary-soft text-secondary rounded-4 px-3 py-2">Inactive</span>;
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="vi-table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Unit Info</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Property</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-center">Category</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-end">Price</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-5 text-muted">No units found for this owner.</td></tr>
                        ) : units.map((unit) => {
                            const price = unit.unitPricing?.[0]?.price || 0;
                            const currency = unit.unitPricing?.[0]?.currency || 'USD';

                            return (
                                <tr key={unit.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-bold text-dark">{unit.unitCode}</div>
                                        {unit.name && <div className="text-muted small">{unit.name}</div>}
                                    </td>
                                    <td className="py-3">
                                        <div className="text-dark small">{unit.property?.title || 'Unknown Property'}</div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="text-muted small">
                                            {unit.unitCategory === 1 ? 'Residential' : 'Commercial'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-end fw-bold text-dark">
                                        {currency} {Number(price).toLocaleString()}
                                    </td>
                                    <td className="py-3">
                                        {getStatusBadge(unit.status)}
                                    </td>
                                    <td className="px-4 py-3 text-end text-muted small">
                                        {new Date(unit.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
            `}</style>
        </div>
    );
}
