'use client';

import React, { useState, useEffect } from 'react';
import { agentService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';

export default function AgentCommissions() {
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCommissions();
    }, []);

    const loadCommissions = async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await agentService.getMyCommissions(token);
            if (res.success && res.data) {
                setCommissions(res.data.commissions || []);
            }
        } catch (error) {
            console.error('Failed to load commissions', error);
        } finally {
            setLoading(false);
        }
    };

    const totalEarned = commissions
        .filter(c => c.status === 'PAID')
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalPending = commissions
        .filter(c => c.status === 'PENDING')
        .reduce((sum, c) => sum + Number(c.amount), 0);

    return (
        <MainLayout activePage="commissions">
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <h4 className="fw-bold mb-1">My Commissions</h4>
                    <p className="text-muted small">Track your earnings and payout history</p>
                </div>

                <div className="row g-4 mb-4">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 text-center p-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Total Paid</div>
                            <h2 className="text-success fw-bold mb-0">${totalEarned.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 text-center p-4">
                            <div className="text-muted small text-uppercase fw-bold mb-1">Total Pending</div>
                            <h2 className="text-warning fw-bold mb-0">${totalPending.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-header bg-white border-bottom p-4">
                        <h5 className="fw-bold mb-0">Earning History</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="vi-table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Date</th>
                                        <th>Booking/Property</th>
                                        <th>Deal Value</th>
                                        <th>My Comm.</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5">
                                                <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                                            </td>
                                        </tr>
                                    ) : commissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">No commissions recorded yet.</td>
                                        </tr>
                                    ) : (
                                        commissions.map(item => (
                                            <tr key={item.id}>
                                                <td className="ps-4 small text-muted">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="fw-bold small">{item.booking?.unit?.unitCode || 'Property Deal'}</div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>ID: {item.booking?.id?.substring(0, 8)}...</div>
                                                </td>
                                                <td className="small">${Number(item.booking?.totalPrice || 0).toFixed(2)}</td>
                                                <td className="fw-bold text-dark">${Number(item.amount).toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge rounded-4 ${item.status === 'PAID' ? 'bg-success-subtle text-success' :
                                                        item.status === 'PENDING' ? 'bg-warning-subtle text-warning' :
                                                            'bg-danger-subtle text-danger'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
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
