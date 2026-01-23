'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { userService, getAuthToken } from '@/app/services/api';

export default function OwnerOverview() {
    const { id } = useParams();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getOwnerStats(token, id as string);
                if (response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [id]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const statCards = [
        { label: 'Properties', value: stats?.propertyCount || 0, icon: 'bi-building', color: 'primary' },
        { label: 'Units', value: stats?.unitCount || 0, icon: 'bi-grid-3x3-gap', color: 'success' },
        { label: 'Bookings', value: stats?.bookingCount || 0, icon: 'bi-calendar-check', color: 'info' },
        { label: 'Sub-Users', value: stats?.userCount || 0, icon: 'bi-people', color: 'warning' },
        { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: 'bi-currency-dollar', color: 'danger' },
    ];

    return (
        <div className="row g-4">
            {statCards.map((card, idx) => (
                <div key={idx} className="col-md-4 col-lg">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hvr-float shadow-sm bg-white">
                        <div className="d-flex align-items-center gap-3">
                            <div className={`bg-${card.color}-soft p-3 rounded-circle`}>
                                <i className={`bi ${card.icon} text-${card.color} fs-4`}></i>
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">{card.label}</div>
                                <div className="fs-3 fw-bold">{card.value}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="col-12 mt-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h5 className="fw-bold mb-4">Quick Insights</h5>
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="p-4 bg-light rounded-4">
                                <h6 className="text-muted small text-uppercase fw-bold mb-3">Portfolio Performance</h6>
                                <p className="mb-0 text-dark">This owner manages <strong>{stats?.propertyCount}</strong> properties with a total of <strong>{stats?.unitCount}</strong> bookable units.</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="p-4 bg-light rounded-4">
                                <h6 className="text-muted small text-uppercase fw-bold mb-3">Team Management</h6>
                                <p className="mb-0 text-dark">Currently has <strong>{stats?.userCount}</strong> standard users registered under their business entity.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
            `}</style>
        </div>
    );
}
