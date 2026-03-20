'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { automationApi } from '@/lib/api/social';
import ModuleGuard from '@/components/common/ModuleGuard';
import Loader from '@/components/common/Loader';
import Toast from "@/components/common/Toast";

interface Workflow {
    id: string;
    name: string;
    trigger: string;
    type: string;
    status: string;
    sent?: number;
    steps?: any[];
}

interface LeadMatch {
    id: string;
    name: string;
    location: string;
    budget: string;
    type: string;
    date?: string;
    matchedDate?: string;
    matchCount?: number;
    status: string;
}

export default function AutomationModule({ mode = 'admin' }: { mode?: 'admin' | 'owner' }) {
    return (
        <ModuleGuard moduleSlug="automation_engine">
            <AutomationContent mode={mode} />
        </ModuleGuard>
    );
}

function AutomationContent({ mode = 'admin' }: { mode?: 'admin' | 'owner' }) {
    const { user } = useAuthContext();
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeLeads: 0,
        matchesFound: 0,
        notificationsSent: 0,
        successRate: '0%'
    });

    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [waitingLeads, setWaitingLeads] = useState<LeadMatch[]>([]);
    const [matchedLeads, setMatchedLeads] = useState<LeadMatch[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        trigger: 'LEAD_CREATED',
        type: 'WhatsApp',
        status: 'Active',
        steps: [] as any[]
    });

    const fetchData = useCallback(async () => {
        const targetTenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
        if (!user || !targetTenantId) return;
        setLoading(true);
        try {
            const [statsRes, workflowsRes, waitingRes, matchedRes] = await Promise.all([
                automationApi.getStats({ tenantId: targetTenantId }),
                automationApi.getWorkflows({ tenantId: targetTenantId }),
                automationApi.getWaitingLeads({ tenantId: targetTenantId }),
                automationApi.getMatchedLeads({ tenantId: targetTenantId })
            ]);

            if (statsRes.success && statsRes.data) setStats(statsRes.data);
            if (workflowsRes.success && workflowsRes.data) setWorkflows(workflowsRes.data);
            if (waitingRes.success && waitingRes.data) setWaitingLeads(waitingRes.data);
            if (matchedRes.success && matchedRes.data) setMatchedLeads(matchedRes.data);
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
            const targetTenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const payload = { ...formData, tenantId: targetTenantId };

            if (editingWorkflow) {
                res = await automationApi.updateWorkflow(editingWorkflow.id, payload);
            } else {
                res = await automationApi.createWorkflow(payload);
            }

            if (res.success) {
                setShowModal(false);
                setEditingWorkflow(null);
                setFormData({ name: '', trigger: 'LEAD_CREATED', type: 'WhatsApp', status: 'Active', steps: [] });
                fetchData();
            } else {
                setToast({
                    show: true,
                    message: res.message + (res.details ? `: ${res.details}` : ''),
                    type: 'error'
                });
            }
        } catch (error: any) {
            console.error('Failed to save workflow:', error);
            setToast({
                show: true,
                message: 'Failed to save automation: ' + (error.message || 'Unknown error'),
                type: 'error'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this automation?')) {
            try {
                const res = await automationApi.deleteWorkflow(id);
                if (res.success) {
                    setToast({ show: true, message: 'Automation deleted successfully', type: 'success' });
                    fetchData();
                } else {
                    setToast({ show: true, message: res.message || 'Failed to delete automation', type: 'error' });
                }
            } catch (error) {
                console.error('Failed to delete workflow:', error);
                setToast({ show: true, message: 'Delete failed', type: 'error' });
            }
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await automationApi.toggleWorkflowStatus(id);
            if (res.success) {
                setToast({ show: true, message: 'Status updated', type: 'success' });
                fetchData();
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            setToast({ show: true, message: 'Update failed', type: 'error' });
        }
    };

    return (
        <MainLayout activePage="social-automation">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">AI Sales Copilot</h2>
                        <p className="text-muted">Automatically follow up with leads and send property matches via WhatsApp.</p>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => {
                            setEditingWorkflow(null);
                            setFormData({ name: '', trigger: 'LEAD_CREATED', type: 'WhatsApp', status: 'Active', steps: [] });
                            setShowModal(true);
                        }}
                    >
                        <i className="bi bi-plus-lg"></i> Create Automation
                    </button>
                </div>

                {/* Benefits Summary Alert */}
                <div className="alert alert-info border-0 rounded-4 p-4 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)' }}>
                    <div className="d-flex gap-3">
                        <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-rocket-takeoff-fill"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-1 text-dark">Why keep the AI Sales Copilot?</h5>
                            <p className="mb-0 text-muted small">
                                This module converts <strong>cold leads into warm chats</strong> automatically.
                                It finds matching properties and sends them via <strong>WhatsApp</strong> before the lead even closes your website.
                                It saves your team hours of manual searching and messaging!
                            </p>
                        </div>
                    </div>
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
                                <h5 className="mb-0 fw-bold">Active WhatsApp & Email Flows</h5>
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
                                                <th className="px-4">Follow-up Goal</th>
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
                                                            <div className="extra-small text-muted">{wf.steps?.length || 0} sequence steps</div>
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
                                                                        status: wf.status,
                                                                        steps: wf.steps || []
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

                        {/* Detailed Lead Activity */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white py-3 border-0 d-flex align-items-center gap-2">
                                        <i className="bi bi-person-search text-primary"></i>
                                        <h6 className="mb-0 fw-bold">Active Searchers (Waiting)</h6>
                                    </div>
                                    <div className="table-responsive" style={{ maxHeight: '350px' }}>
                                        <table className="table table-sm table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-3">Lead</th>
                                                    <th>Preferences</th>
                                                    <th className="text-end pe-3">Budget</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {waitingLeads.length === 0 ? (
                                                    <tr><td colSpan={3} className="text-center py-4 text-muted small">No leads waiting for matches.</td></tr>
                                                ) : (
                                                    waitingLeads.map(l => (
                                                        <tr key={l.id}>
                                                            <td className="ps-3 py-3">
                                                                <div className="fw-bold small">{l.name}</div>
                                                                <div className="extra-small text-muted">{l.date}</div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-dark extra-small border me-1">{l.location}</span>
                                                                <span className="badge bg-light text-dark extra-small border">{l.type}</span>
                                                            </td>
                                                            <td className="text-end pe-3 fw-bold text-primary small">{l.budget}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white py-3 border-0 d-flex align-items-center gap-2">
                                        <i className="bi bi-check2-all text-success"></i>
                                        <h6 className="mb-0 fw-bold">Recent WhatsApp Dispatches</h6>
                                    </div>
                                    <div className="table-responsive" style={{ maxHeight: '350px' }}>
                                        <table className="table table-sm table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-3">Lead</th>
                                                    <th>Properties</th>
                                                    <th className="text-end pe-3">Sent On</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {matchedLeads.length === 0 ? (
                                                    <tr><td colSpan={3} className="text-center py-4 text-muted small">No matches sent recently.</td></tr>
                                                ) : (
                                                    matchedLeads.map(l => (
                                                        <tr key={l.id}>
                                                            <td className="ps-3 py-3">
                                                                <div className="fw-bold small">{l.name}</div>
                                                                <div className="extra-small text-muted">{l.location}</div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-success-soft text-success border-success-subtle extra-small fw-bold">
                                                                    {l.matchCount} Properties
                                                                </span>
                                                            </td>
                                                            <td className="text-end pe-3 small text-muted">{l.matchedDate}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How it works Sidebar */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 bg-success bg-opacity-10 text-dark p-4 h-100">
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-info-circle"></i> How the Copilot Works
                            </h5>
                            <p className="opacity-75 small mb-4 text-primary">
                                Our system automatically works in the background to convert your leads into viewings.
                            </p>

                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        1
                                    </div>
                                    <div>
                                        <div className="fw-bold">Lead Study</div>
                                        <div className="small opacity-75">AI learns what each lead wants from their website activity.</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        2
                                    </div>
                                    <div>
                                        <div className="fw-bold">24/7 Scanning</div>
                                        <div className="small opacity-75">We scan your properties every hour to find perfect matches.</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        3
                                    </div>
                                    <div>
                                        <div className="fw-bold">Instant WhatsApp</div>
                                        <div className="small opacity-75">The system sends a personalized WhatsApp to the lead as soon as a match is found.</div>
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
                                        <label className="form-label small fw-bold">Automation Name (e.g. New Lead Greeting)</label>
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

                                    {/* Sequence Builder */}
                                    <div className="border-top pt-4 mt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0">Workflow Sequence</h6>
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setFormData(prev => ({ 
                                                    ...prev, 
                                                    steps: [...prev.steps, { type: 'DELAY', duration: 1, unit: 'hours' }] 
                                                }))}
                                            >
                                                <i className="bi bi-plus"></i> Add Step
                                            </button>
                                        </div>

                                        <div className="sequence-list d-flex flex-column gap-3">
                                            {formData.steps.map((step, idx) => (
                                                <div key={idx} className="card border p-3 rounded-4 bg-light shadow-sm position-relative">
                                                    <button 
                                                        type="button" 
                                                        className="btn-close position-absolute top-0 end-0 m-2 p-1" 
                                                        style={{ fontSize: '10px' }}
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            steps: prev.steps.filter((_, i) => i !== idx)
                                                        }))}
                                                    ></button>
                                                    
                                                    <div className="row g-2">
                                                        <div className="col-4">
                                                            <select 
                                                                className="form-select form-select-sm" 
                                                                value={step.type}
                                                                onChange={e => {
                                                                    const newSteps = [...formData.steps];
                                                                    newSteps[idx] = { ...step, type: e.target.value };
                                                                    setFormData({ ...formData, steps: newSteps });
                                                                }}
                                                            >
                                                                <option value="DELAY">Wait/Delay</option>
                                                                <option value="WHATSAPP">Send WhatsApp</option>
                                                                <option value="EMAIL">Send Email</option>
                                                            </select>
                                                        </div>
                                                        <div className="col">
                                                            {step.type === 'DELAY' ? (
                                                                <div className="input-group input-group-sm">
                                                                    <input 
                                                                        type="number" 
                                                                        className="form-control" 
                                                                        value={step.duration}
                                                                        onChange={e => {
                                                                            const newSteps = [...formData.steps];
                                                                            newSteps[idx] = { ...step, duration: e.target.value };
                                                                            setFormData({ ...formData, steps: newSteps });
                                                                        }}
                                                                    />
                                                                    <select 
                                                                        className="form-select" 
                                                                        value={step.unit}
                                                                        onChange={e => {
                                                                            const newSteps = [...formData.steps];
                                                                            newSteps[idx] = { ...step, unit: e.target.value };
                                                                            setFormData({ ...formData, steps: newSteps });
                                                                        }}
                                                                    >
                                                                        <option value="minutes">Mins</option>
                                                                        <option value="hours">Hours</option>
                                                                        <option value="days">Days</option>
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control form-control-sm" 
                                                                    placeholder="Message content or Template ID"
                                                                    value={step.content}
                                                                    onChange={e => {
                                                                        const newSteps = [...formData.steps];
                                                                        newSteps[idx] = { ...step, content: e.target.value };
                                                                        setFormData({ ...formData, steps: newSteps });
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {formData.steps.length === 0 && (
                                                <div className="text-center py-4 border border-dashed rounded-4 opacity-50 small">
                                                    No steps added. Lead will only get the default matching alert.
                                                </div>
                                            )}
                                        </div>
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
            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type as any}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
            <style jsx>{`
                .extra-small { font-size: 11px; }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .border-success-subtle { border: 1px solid rgba(25, 135, 84, 0.2); }
                .sequence-list { position: relative; }
                .sequence-list::before {
                    content: '';
                    position: absolute;
                    left: 20px;
                    top: 10px;
                    bottom: 10px;
                    width: 2px;
                    border-left: 2px dashed #dee2e6;
                    z-index: 0;
                }
                .sequence-list .card { z-index: 1; margin-left: 10px; }
            `}</style>
        </MainLayout>
    );
}
