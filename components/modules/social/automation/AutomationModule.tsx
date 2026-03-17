'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { automationApi } from '@/lib/api/social';
import ModuleGuard from '@/components/common/ModuleGuard';
import Loader from '@/components/common/Loader';

interface Workflow {
    id: string;
    name: string;
    trigger: string;
    type: string;
    status: string;
    sent?: number;
}

export default function AutomationModule() {
    return (
        <ModuleGuard moduleSlug="social_manual">
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

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        trigger: 'LEAD_CREATED',
        type: 'WhatsApp',
        status: 'Active'
    });

    const fetchData = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const [statsRes, workflowsRes] = await Promise.all([
                automationApi.getStats({ tenantId: user.tenantId }),
                automationApi.getWorkflows({ tenantId: user.tenantId })
            ]);

            if (statsRes.success && statsRes.data) setStats(statsRes.data);
            if (workflowsRes.success && workflowsRes.data) setWorkflows(workflowsRes.data);
        } catch (error) {
            console.error('Failed to fetch automation data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let res;
            const payload = { ...formData, tenantId: user?.tenantId };

            if (editingWorkflow) {
                res = await automationApi.updateWorkflow(editingWorkflow.id, payload);
            } else {
                res = await automationApi.createWorkflow(payload);
            }

            if (res.success) {
                setShowModal(false);
                setEditingWorkflow(null);
                setFormData({ name: '', trigger: 'LEAD_CREATED', type: 'WhatsApp', status: 'Active' });
                fetchData();
            } else {
                alert(res.message + (res.details ? `: ${res.details}` : ''));
            }
        } catch (error: any) {
            console.error('Failed to save workflow:', error);
            alert('Failed to save automation: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this automation?')) {
            try {
                const res = await automationApi.deleteWorkflow(id);
                if (res.success) fetchData();
            } catch (error) {
                console.error('Failed to delete workflow:', error);
            }
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await automationApi.toggleWorkflowStatus(id);
            if (res.success) fetchData();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    return (
        <MainLayout activePage="social-automation">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">Unified Automation Hub</h2>
                        <p className="text-muted">Manage your Lead Nurturing sequences and AI matching engine.</p>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => {
                            setEditingWorkflow(null);
                            setFormData({ name: '', trigger: 'LEAD_CREATED', type: 'WhatsApp', status: 'Active' });
                            setShowModal(true);
                        }}
                    >
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
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Loader size="md" message="Loading automation flows..." />
                                    </div>
                                ) : (
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
                                            {workflows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4 text-muted">No automation workflows found.</td>
                                                </tr>
                                            ) : (
                                                workflows.map(wf => (
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
                                                        <td>{wf.sent || 0}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={wf.status === 'Active'}
                                                                    onChange={() => handleToggleStatus(wf.id)}
                                                                />
                                                                <span className={`small ms-1 ${wf.status === 'Active' ? 'text-success' : 'text-muted'}`}>
                                                                    {wf.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="text-end px-4">
                                                            <button
                                                                className="btn btn-sm btn-light-primary me-2"
                                                                onClick={() => {
                                                                    setEditingWorkflow(wf);
                                                                    setFormData({
                                                                        name: wf.name,
                                                                        trigger: wf.trigger,
                                                                        type: wf.type,
                                                                        status: wf.status
                                                                    });
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-light-danger"
                                                                onClick={() => handleDelete(wf.id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">{editingWorkflow ? 'Edit' : 'Create'} Automation</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Workflow Name</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3"
                                            placeholder="e.g. New Lead Welcome"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Trigger Event</label>
                                        <select
                                            className="form-select rounded-3"
                                            value={formData.trigger}
                                            onChange={e => setFormData({ ...formData, trigger: e.target.value })}
                                        >
                                            <option value="LEAD_CREATED">New Lead</option>
                                            <option value="MATCH_FOUND">Match Found</option>
                                            <option value="STATUS_CHANGED">Status Changed</option>
                                            <option value="PROPERTY_ADDED">Property Added</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Channel</label>
                                        <select
                                            className="form-select rounded-3"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Email">Email</option>
                                            <option value="Omni-channel">Omni-channel</option>
                                        </select>
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label small fw-bold">Initial Status</label>
                                        <select
                                            className="form-select rounded-3"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary rounded-3 px-4">
                                        {editingWorkflow ? 'Update' : 'Create'} Workflow
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
