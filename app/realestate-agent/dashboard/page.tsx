'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { agentService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/app/hooks/useAuth';
import Loader from '@/components/common/Loader';
import Link from 'next/link';

export default function AgentDashboard() {
    const { user } = useAuthContext();
    const [stats, setStats] = useState({
        totalLeads: 0,
        activeLeads: 0,
        totalCommission: 0,
        pendingCommission: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const [leadsRes, commsRes] = await Promise.all([
                agentService.getMyLeads(token),
                agentService.getMyCommissions(token)
            ]);

            if (leadsRes.success && commsRes.success) {
                const leads = leadsRes.data.leads || [];
                const commissions = commsRes.data.commissions || [];

                const totalComm = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
                const pendingComm = commissions
                    .filter((c: any) => c.status === 'PENDING')
                    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

                setStats({
                    totalLeads: leads.length,
                    activeLeads: leads.filter((l: any) => l.status < 4).length, // Status 4 is converted, 5 is lost
                    totalCommission: totalComm,
                    pendingCommission: pendingComm
                });
            }
        } catch (error) {
            console.error('Error loading dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout activePage="dashboard">
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <h3 className="fw-bold text-dark mb-1">Welcome back, {user?.name}!</h3>
                    <p className="text-muted">Here's an overview of your sales performance.</p>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <Loader size="md" message="Loading dashboard data..." />
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Stats Cards */}
                        <div className="col-12 col-md-6 col-lg-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-primary text-white">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fs-5 fw-bold">My Leads</div>
                                        <i className="bi bi-person-lines-fill fs-3 opacity-50"></i>
                                    </div>
                                    <h2 className="display-6 fw-bold mb-1">{stats.totalLeads}</h2>
                                    <div className="small opacity-75">{stats.activeLeads} active leads</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-success text-white">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fs-5 fw-bold">Earnings</div>
                                        <i className="bi bi-wallet2 fs-3 opacity-50"></i>
                                    </div>
                                    <h2 className="display-6 fw-bold mb-1">${stats.totalCommission.toFixed(2)}</h2>
                                    <div className="small opacity-75">Accumulated so far</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-warning text-dark">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fs-5 fw-bold">Pending</div>
                                        <i className="bi bi-clock-history fs-3 opacity-50"></i>
                                    </div>
                                    <h2 className="display-6 fw-bold mb-1">${stats.pendingCommission.toFixed(2)}</h2>
                                    <div className="small opacity-75">Awaiting payout</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-3">
                            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                                <div className="card-body text-dark">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fs-5 fw-bold text-muted">Conversion</div>
                                        <i className="bi bi-graph-up-arrow fs-3 text-primary opacity-50"></i>
                                    </div>
                                    <h2 className="display-6 fw-bold mb-1">
                                        {stats.totalLeads > 0
                                            ? ((stats.totalLeads - stats.activeLeads - (stats.totalLeads - stats.totalLeads)) / stats.totalLeads * 100).toFixed(0)
                                            : 0}%
                                    </h2>
                                    <div className="small text-muted">Lead closure rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity or Quick Actions */}
                        <div className="col-12 mt-5">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-4">Quick Actions</h5>
                                    <div className="d-flex flex-wrap gap-3">
                                        <Link href="/realestate-agent/leads" className="btn btn-primary px-4 py-2 rounded-3 shadow-sm">
                                            <i className="bi bi-person-check me-2"></i>Manage Leads
                                        </Link>
                                        <Link href="/realestate-agent/commissions" className="btn btn-outline-primary px-4 py-2 rounded-3">
                                            <i className="bi bi-cash-stack me-2"></i>My Commissions
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
