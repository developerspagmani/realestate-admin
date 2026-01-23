'use client';

import React, { useState, useEffect } from 'react';
import { agentService, getAuthToken } from '@/app/services/api';
import { Agent, Commission } from '@/types';
import MainLayout from '@/components/MainLayout';

interface AgentsManagerProps {
    mode: 'owner' | 'admin';
}

export default function AgentsManager({ mode }: AgentsManagerProps) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [viewingCommissions, setViewingCommissions] = useState<Agent | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        specialization: '',
        commissionRate: 2.5,
        status: 1
    });

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        const token = getAuthToken();
        if (!token) return;

        setLoading(true);
        try {
            const res = await agentService.getAgents(token);
            if (res.success && res.data) {
                setAgents(res.data.agents);
            }
        } catch (error) {
            console.error('Failed to load agents', error);

        } finally {
            setLoading(false);
        }
    };

    const loadCommissions = async (agentId: string) => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await agentService.getCommissions(token, agentId);
            if (res.success && res.data) {
                setCommissions(res.data.commissions);
            }
        } catch (error) {
            console.error('Failed to load commissions', error);

        }
    };

    const handleEdit = (agent: Agent) => {
        setEditingAgent(agent);
        setFormData({
            firstName: agent.user?.firstName || '',
            lastName: agent.user?.lastName || '',
            email: agent.user?.email || '',
            phone: agent.user?.phone || '',
            password: '', // Don't fill password
            specialization: agent.specialization || '',
            commissionRate: agent.commissionRate,
            status: agent.status
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingAgent(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            specialization: '',
            commissionRate: 2.5,
            status: 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        try {
            if (editingAgent) {
                // Update
                const res = await agentService.updateAgent(token, editingAgent.id, {
                    specialization: formData.specialization,
                    commissionRate: formData.commissionRate,
                    status: formData.status
                });
                if (res.success) {

                    setShowModal(false);
                    loadAgents();
                } else {

                }
            } else {
                // Create
                const res = await agentService.createAgent(token, formData);
                if (res.success) {

                    setShowModal(false);
                    loadAgents();
                } else {

                }
            }
        } catch (error) {
            console.error('Submit error', error);
            alert('Failed to save agent');
        }
    };

    const handleDeleteAgent = async (agentId: string) => {
        if (!window.confirm('Are you sure you want to delete this agent? This will also delete their login account.')) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await agentService.deleteAgent(token, agentId);
            if (res.success) {
                loadAgents();
            } else {
                alert(res.message || 'Failed to delete agent');
            }
        } catch (error) {
            console.error('Delete error', error);
            alert('Error deleting agent');
        }
    };

    const handleViewCommissions = (agent: Agent) => {
        setViewingCommissions(agent);
        loadCommissions(agent.id);
    };

    return (
        <MainLayout activePage="agents">
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Agent Management</h4>
                        <p className="text-muted small mb-0">Manage your sales team and track performance</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <i className="bi bi-person-plus me-2"></i>Add Agent
                    </button>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Agent Name</th>
                                        <th>Specialization</th>
                                        <th>Commission Rate</th>
                                        <th>Performance</th>
                                        <th>Status</th>
                                        <th className="pe-4 text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5">
                                                <div className="spinner-border text-primary text-sm" role="status"></div>
                                            </td>
                                        </tr>
                                    ) : agents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5 text-muted">
                                                No agents found. Add your first agent to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        agents.map(agent => (
                                            <tr key={agent.id}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center">
                                                        <div className="width-40 height-40 rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center text-primary fw-bold me-3">
                                                            {agent.user?.name?.charAt(0) || 'A'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{agent.user?.name}</div>
                                                            <div className="small text-muted">{agent.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{agent.specialization || '-'}</td>
                                                <td><span className="badge bg-light text-dark border">{agent.commissionRate}%</span></td>
                                                <td>
                                                    <div className="d-flex gap-3 small">
                                                        <span title="Leads Assigned">
                                                            <i className="bi bi-person ms-1 text-muted"></i> {agent.totalLeads}
                                                        </span>
                                                        <span title="Deals Closed">
                                                            <i className="bi bi-check-circle ms-1 text-success"></i> {agent.totalDeals}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill ${agent.status === 1 ? 'bg-success-subtle text-success' :
                                                        agent.status === 2 ? 'bg-secondary-subtle text-secondary' :
                                                            'bg-warning-subtle text-warning'
                                                        }`}>
                                                        {agent.status === 1 ? 'Active' : agent.status === 2 ? 'Inactive' : 'On Leave'}
                                                    </span>
                                                </td>
                                                <td className="pe-4 text-end">
                                                    <button
                                                        className="btn btn-sm btn-light border me-2"
                                                        title="View Commissions"
                                                        onClick={() => handleViewCommissions(agent)}
                                                    >
                                                        <i className="bi bi-cash-stack"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-light border text-primary me-2"
                                                        onClick={() => handleEdit(agent)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-light border text-danger"
                                                        onClick={() => handleDeleteAgent(agent.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Create/Edit Agent Modal */}
                {showModal && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4">
                                    <h5 className="modal-title fw-bold">
                                        {editingAgent ? 'Edit Agent' : 'Add New Agent'}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4 pt-0">
                                        <div className="row g-3">
                                            {!editingAgent && (
                                                <>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">First Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light border-0"
                                                            required
                                                            value={formData.firstName}
                                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Last Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light border-0"
                                                            required
                                                            value={formData.lastName}
                                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Email</label>
                                                        <input
                                                            type="email"
                                                            className="form-control bg-light border-0"
                                                            required
                                                            value={formData.email}
                                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Password</label>
                                                        <input
                                                            type="password"
                                                            className="form-control bg-light border-0"
                                                            required
                                                            minLength={6}
                                                            value={formData.password}
                                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <div className="col-md-6">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Specialization</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    placeholder="e.g. Residential"
                                                    value={formData.specialization}
                                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Commission Rate (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="form-control bg-light border-0"
                                                    required
                                                    value={formData.commissionRate}
                                                    onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small text-muted text-uppercase fw-bold">Status</label>
                                                <select
                                                    className="form-select bg-light border-0"
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>Active</option>
                                                    <option value={2}>Inactive</option>
                                                    <option value={3}>On Leave (Skip Round Robin)</option>
                                                </select>
                                            </div>
                                            {editingAgent && (
                                                <div className="col-12">
                                                    <div className="alert alert-info small mb-0">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        User details (Name, Email) can be updated in the Users module.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 px-4 pb-4">
                                        <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-4">Save Agent</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Commissions Modal */}
                {viewingCommissions && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4">
                                    <div>
                                        <h5 className="modal-title fw-bold">Commission History</h5>
                                        <p className="text-muted small mb-0">For {viewingCommissions.user?.name}</p>
                                    </div>
                                    <button type="button" className="btn-close" onClick={() => { setViewingCommissions(null); setCommissions([]); }}></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="bg-light small text-uppercase">
                                                <tr>
                                                    <th className="ps-4 py-3">Date</th>
                                                    <th className="py-3">Booking ID</th>
                                                    <th className="py-3">Status</th>
                                                    <th className="py-3 text-end pe-4">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {commissions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-5 text-muted">
                                                            No commissions recorded yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    commissions.map(comm => (
                                                        <tr key={comm.id}>
                                                            <td className="ps-4 small text-muted">
                                                                {new Date(comm.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="small fontFamily-monospace">{comm.booking?.id?.substring(0, 8)}...</td>
                                                            <td>
                                                                <span className={`badge rounded-pill ${comm.status === 'PAID' ? 'bg-success-subtle text-success' :
                                                                    comm.status === 'CANCELLED' ? 'bg-danger-subtle text-danger' :
                                                                        'bg-warning-subtle text-warning'
                                                                    }`}>
                                                                    {comm.status}
                                                                </span>
                                                            </td>
                                                            <td className="text-end pe-4 fw-bold">
                                                                ${Number(comm.amount).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4">
                                    <button type="button" className="btn btn-light" onClick={() => { setViewingCommissions(null); setCommissions([]); }}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
