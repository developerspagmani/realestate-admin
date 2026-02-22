'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { useAuthContext } from '@/app/contexts/AuthContext';

import { automationApi } from '@/lib/api/social';

export default function SocialAutomationPage() {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeLeads: 0,
        matchesFound: 0,
        notificationsSent: 0,
        successRate: '0%'
    });

    const [workflows, setWorkflows] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, workflowsRes] = await Promise.all([
                    automationApi.getStats(),
                    automationApi.getWorkflows()
                ]);

                if (statsRes.success) setStats(statsRes.data);
                if (workflowsRes.success) setWorkflows(workflowsRes.data);
            } catch (error) {
                console.error('Failed to fetch automation data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <MainLayout activePage="social-automation">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">Unified Automation Hub</h2>
                        <p className="text-muted">Global automation dashboard for lead nurturing and matching.</p>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard
                            label="Waiting Leads"
                            value={stats.activeLeads.toString()}
                            icon="bi-people-fill"
                            color="primary"
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Total Matches"
                            value={stats.matchesFound.toString()}
                            icon="bi-lightning-charge-fill"
                            color="warning"
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Alerts Sent"
                            value={stats.notificationsSent.toString()}
                            icon="bi-whatsapp"
                            color="success"
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Success Rate"
                            value={stats.successRate}
                            icon="bi-check-circle-fill"
                            color="info"
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="mb-0 fw-bold">Platform-Wide Automation Rules</h5>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4">Workflow Name</th>
                                            <th>Trigger</th>
                                            <th>Channel</th>
                                            <th>Sent</th>
                                            <th>Status</th>
                                            <th className="text-end px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workflows.map(wf => (
                                            <tr key={wf.id}>
                                                <td className="px-4"><div className="fw-semibold">{wf.name}</div></td>
                                                <td><span className="badge bg-light text-dark border">{wf.trigger}</span></td>
                                                <td>{wf.type}</td>
                                                <td>{wf.sent}</td>
                                                <td><span className="badge bg-success-subtle text-success">{wf.status}</span></td>
                                                <td className="text-end px-4">
                                                    <button className="btn btn-sm btn-light-primary me-2"><i className="bi bi-eye"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
