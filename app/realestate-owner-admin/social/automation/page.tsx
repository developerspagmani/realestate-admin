'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { automationApi } from '@/lib/api/social';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function SocialAutomationPage() {
    return (
        <ModuleGuard moduleSlug="automation_engine">
            <AutomationContent />
        </ModuleGuard>
    );
}

function AutomationContent() {
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
                        <p className="text-muted">Manage your Lead Nurturing sequences and AI matching engine.</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2">
                        <i className="bi bi-plus-lg"></i> Create Automation
                    </button>
                </div>

                {/* Automation Stats */}
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
                    {/* Active Workflows */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">Active Nurture Flows</h5>
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
                                                <td className="px-4">
                                                    <div className="fw-semibold">{wf.name}</div>
                                                </td>
                                                <td><span className="badge bg-light text-dark border">{wf.trigger}</span></td>
                                                <td>
                                                    {wf.type === 'WhatsApp' && <i className="bi bi-whatsapp text-success me-2"></i>}
                                                    {wf.type === 'Email' && <i className="bi bi-envelope text-primary me-2"></i>}
                                                    {wf.type === 'Omni-channel' && <i className="bi bi-shuffle text-info me-2"></i>}
                                                    {wf.type}
                                                </td>
                                                <td>{wf.sent}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${wf.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                        {wf.status}
                                                    </span>
                                                </td>
                                                <td className="text-end px-4">
                                                    <button className="btn btn-sm btn-light-primary me-2"><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-sm btn-light-danger"><i className="bi bi-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* How it works Sidebar */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 bg-success bg-opacity-10 text-dark p-4 h-100">
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-info-circle"></i> Unified Matching
                            </h5>
                            <p className="opacity-75 small mb-4">
                                Our Matching Engine scans leads from your Website Chatbot, Forms, and WhatsApp.
                            </p>

                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        1
                                    </div>
                                    <div>
                                        <div className="fw-bold">Lead Enrichment</div>
                                        <div className="small opacity-75">AI extracts budget/location from any message.</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        2
                                    </div>
                                    <div>
                                        <div className="fw-bold">Continuous Scanning</div>
                                        <div className="small opacity-75">System check inventory 24/7 for new matches.</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        3
                                    </div>
                                    <div>
                                        <div className="fw-bold">Automated Outreach</div>
                                        <div className="small opacity-75">Instantly alerts user via WhatsApp when match found.</div>
                                    </div>
                                </div>
                            </div>

                            <button className="btn btn-light w-100 mt-5 fw-bold text-primary py-2 rounded-3">
                                View Matching Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
