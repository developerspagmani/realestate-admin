'use client';

import React, { useState, useEffect } from 'react';
import { agentService, getAuthToken, leadService, propertyService } from '@/app/services/api';
import { Agent, Commission } from '@/types';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AgentsManagerProps {
    mode: 'owner' | 'admin';
}

export default function AgentsManager({ mode }: AgentsManagerProps) {
    const queryClient = useQueryClient();
    const { user, tenantId: authTenantId, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();

    // UI states
    const [showModal, setShowModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [viewingCommissions, setViewingCommissions] = useState<Agent | null>(null);
    const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
    const [showAssignModal, setShowAssignModal] = useState<'leads' | 'properties' | null>(null);
    const [targetAgent, setTargetAgent] = useState<Agent | null>(null);
    const [assignedItems, setAssignedItems] = useState<string[]>([]);
    const [newlyCreatedAgent, setNewlyCreatedAgent] = useState<any | null>(null);

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

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const token = typeof window !== 'undefined' ? getAuthToken() : '';
    const tenantId = (mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || (typeof window !== 'undefined' ? localStorage.getItem('tenant-id') : null);

    // --- Queries ---

    const { data: agentsRes, isLoading: agentsLoading } = useQuery({
        queryKey: ['agents', mode, tenantId],
        queryFn: () => agentService.getAgents(token!, { tenantId }),
        enabled: !!token && isAuthenticated && !!tenantId,
    });

    const agents = agentsRes?.data?.agents || [];

    const { data: commissionsRes } = useQuery({
        queryKey: ['commissions', viewingCommissions?.id],
        queryFn: () => agentService.getCommissions(token!, viewingCommissions!.id),
        enabled: !!token && !!viewingCommissions?.id,
    });

    const commissions = commissionsRes?.data?.commissions || [];

    // Assignment Queries
    const { data: unassignedLeadsRes } = useQuery({
        queryKey: ['unassigned-leads', tenantId],
        queryFn: () => leadService.getLeads(token!, { status: '1', tenantId: tenantId || undefined }),
        enabled: !!token && showAssignModal === 'leads' && !!tenantId,
    });

    const unassignedLeads = unassignedLeadsRes?.data?.leads || [];

    const { data: agentLeadsRes } = useQuery({
        queryKey: ['agent-leads', targetAgent?.id],
        queryFn: () => agentService.getAgentLeads(token!, targetAgent!.id),
        enabled: !!token && showAssignModal === 'leads' && !!targetAgent?.id,
    });

    const agentLeads = agentLeadsRes?.data || [];

    const { data: allPropertiesRes } = useQuery({
        queryKey: ['properties', tenantId],
        queryFn: () => propertyService.getProperties(token!, { tenantId: tenantId || undefined }),
        enabled: !!token && showAssignModal === 'properties' && !!tenantId,
    });

    const allProperties = allPropertiesRes?.data?.properties || [];

    const { data: agentPropertiesRes } = useQuery({
        queryKey: ['agent-properties', targetAgent?.id],
        queryFn: () => agentService.getAssignments(token!, targetAgent!.id),
        enabled: !!token && (showAssignModal === 'properties' || !!viewingAgent?.id) && (!!targetAgent?.id || !!viewingAgent?.id),
    });

    const agentProperties = agentPropertiesRes?.data || [];

    // For viewing agent details (leads)
    const { data: viewingAgentLeadsRes } = useQuery({
        queryKey: ['agent-leads', viewingAgent?.id],
        queryFn: () => agentService.getAgentLeads(token!, viewingAgent!.id),
        enabled: !!token && !!viewingAgent?.id,
    });

    const viewingAgentLeads = viewingAgentLeadsRes?.data || [];

    // For viewing agent details (properties)
    const { data: viewingAgentPropertiesRes } = useQuery({
        queryKey: ['agent-properties', viewingAgent?.id],
        queryFn: () => agentService.getAssignments(token!, viewingAgent!.id),
        enabled: !!token && !!viewingAgent?.id,
    });

    const viewingAgentProperties = viewingAgentPropertiesRes?.data || [];

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingAgent) {
                return agentService.updateAgent(token!, editingAgent.id, {
                    specialization: payload.specialization,
                    commissionRate: payload.commissionRate,
                    status: payload.status
                });
            }
            return agentService.createAgent(token!, { ...payload, tenantId });
        },
        onSuccess: (res) => {
            if (res.success) {
                if (!editingAgent) {
                    setNewlyCreatedAgent({ ...formData, id: res.data.agent.id });
                }
                setShowModal(false);
                queryClient.invalidateQueries({ queryKey: ['agents'] });
            } else {
                showToast(res.message || 'Failed to save agent', 'error');
            }
        },
        onError: () => showToast('Failed to save agent', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => agentService.deleteAgent(token!, id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['agents'] });
                showToast('Agent deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete agent', 'error');
            }
        },
        onError: () => showToast('Error deleting agent', 'error')
    });

    const assignMutation = useMutation({
        mutationFn: async ({ toAdd, toRemove, type }: { toAdd: string[], toRemove: any[], type: 'leads' | 'properties' }) => {
            const agentId = targetAgent!.id;
            if (type === 'leads') {
                await Promise.all([
                    ...toAdd.map(leadId => agentService.assignLead(token!, { agentId, leadId })),
                    ...toRemove.map(a => agentService.unassignLead(token!, a.id))
                ]);
            } else {
                await Promise.all([
                    ...toAdd.map(propertyId => agentService.assignProperty(token!, { agentId, propertyId })),
                    ...toRemove.map(a => agentService.unassignProperty(token!, a.id))
                ]);
            }
        },
        onSuccess: () => {
            showToast('Assignments updated successfully');
            setShowAssignModal(null);
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['agent-leads', targetAgent?.id] });
            queryClient.invalidateQueries({ queryKey: ['agent-properties', targetAgent?.id] });
        },
        onError: (err: any) => {
            showToast('Failed to update assignments: ' + (err.response?.data?.message || err.message), 'error');
        }
    });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleAssignClick = (type: 'leads' | 'properties', agent: Agent) => {
        setTargetAgent(agent);
        setShowAssignModal(type);
        setAssignedItems([]); // This will be set by useEffect when data loads
    };

    // Effect to set assigned items when data is ready
    useEffect(() => {
        if (showAssignModal === 'leads' && agentLeads) {
            setAssignedItems(agentLeads.map((a: any) => a.leadId));
        } else if (showAssignModal === 'properties' && agentProperties) {
            setAssignedItems(agentProperties.map((a: any) => a.propertyId));
        }
    }, [showAssignModal, agentLeads, agentProperties]);

    const confirmAssignment = () => {
        if (!targetAgent) return;

        if (showAssignModal === 'leads') {
            const currentLeadIds = agentLeads.map((a: any) => a.leadId);
            const toAdd = assignedItems.filter(id => !currentLeadIds.includes(id));
            const toRemove = agentLeads.filter((a: any) => !assignedItems.includes(a.leadId));
            assignMutation.mutate({ toAdd, toRemove, type: 'leads' });
        } else {
            const currentPropIds = agentProperties.map((a: any) => a.propertyId);
            const toAdd = assignedItems.filter(id => !currentPropIds.includes(id));
            const toRemove = agentProperties.filter((a: any) => !assignedItems.includes(a.propertyId));
            assignMutation.mutate({ toAdd, toRemove, type: 'properties' });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    };

    const handleDeleteAgent = (agentId: string) => {
        if (!window.confirm('Are you sure you want to delete this agent? This will also delete their login account.')) return;
        deleteMutation.mutate(agentId);
    };

    const handleViewCommissions = (agent: Agent) => {
        setViewingCommissions(agent);
    };

    const handleViewDetails = (agent: Agent) => {
        setViewingAgent(agent);
    };

    const loading = agentsLoading;

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

                <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                    <div className="card-body p-0">
                        <div className="vi-vi-table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted">Agent Name</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Specialization</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Commission</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Performance</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-5">
                                                <Loader message="Fetching agents..." />
                                            </td>
                                        </tr>
                                    ) : agents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5 text-muted">
                                                No agents found. Add your first agent to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        agents.map((agent: any) => (
                                            <tr key={agent.id}>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar me-3 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            {agent.user?.firstName?.[0]}{agent.user?.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark cursor-pointer link-primary" onClick={() => handleViewDetails(agent)}>
                                                                {agent.user?.firstName} {agent.user?.lastName}
                                                            </div>
                                                            <div className="text-muted small">{agent.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">{agent.specialization || '-'}</td>
                                                <td className="py-3"><span className="badge bg-light text-dark border">{agent.commissionRate}%</span></td>
                                                <td className="py-3">
                                                    <div className="d-flex gap-3 small">
                                                        <span title="Leads Assigned">
                                                            <i className="bi bi-person ms-1 text-muted"></i> {agent.totalLeads}
                                                        </span>
                                                        <span title="Deals Closed">
                                                            <i className="bi bi-check-circle ms-1 text-success"></i> {agent.totalDeals}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`badge rounded-4 ${agent.status === 1 ? 'bg-success-subtle text-success' :
                                                        agent.status === 2 ? 'bg-secondary-subtle text-secondary' :
                                                            'bg-warning-subtle text-warning'
                                                        }`}>
                                                        {agent.status === 1 ? 'Active' : agent.status === 2 ? 'Inactive' : 'On Leave'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="btn-group">
                                                        <button
                                                            className="btn btn-sm btn-light border"
                                                            title="View Commissions"
                                                            onClick={() => handleViewCommissions(agent)}
                                                        >
                                                            <i className="bi bi-cash-stack"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-light border dropdown-toggle dropdown-toggle-split"
                                                            data-bs-toggle="dropdown"
                                                        ></button>
                                                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2">
                                                            <li><h6 className="dropdown-header small text-uppercase">Management</h6></li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2" onClick={() => handleViewDetails(agent)}>
                                                                    <i className="bi bi-person-badge me-2 text-dark"></i> View Profile
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2" onClick={() => handleEdit(agent)}>
                                                                    <i className="bi bi-pencil me-2 text-primary"></i> Edit Agent
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2" onClick={() => handleAssignClick('leads', agent)}>
                                                                    <i className="bi bi-person-lines-fill me-2 text-info"></i> Assign Leads
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2" onClick={() => handleAssignClick('properties', agent)}>
                                                                    <i className="bi bi-building me-2 text-warning"></i> Assign Properties
                                                                </button>
                                                            </li>
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li><h6 className="dropdown-header small text-uppercase">Account</h6></li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2" onClick={() => copyToClipboard(`Email: ${agent.user?.email}\nPhone: ${agent.user?.phone}`)}>
                                                                    <i className="bi bi-clipboard-check me-2"></i> Copy Login Info
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item rounded-2 text-danger" onClick={() => handleDeleteAgent(agent.id)}>
                                                                    <i className="bi bi-trash me-2"></i> Delete Agent
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
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
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Phone Number (Username)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light border-0"
                                                            required
                                                            placeholder="+1234567890"
                                                            value={formData.phone}
                                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
                                    <button type="button" className="btn-close" onClick={() => { setViewingCommissions(null); }}></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="vi-table-responsive">
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
                                                    commissions.map((comm: any) => (
                                                        <tr key={comm.id}>
                                                            <td className="ps-4 small text-muted">
                                                                {new Date(comm.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="small font-monospace">{comm.booking?.id?.substring(0, 8)}...</td>
                                                            <td>
                                                                <span className={`badge rounded-4 ${comm.status === 'PAID' ? 'bg-success-subtle text-success' :
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
                                    <button type="button" className="btn btn-light" onClick={() => { setViewingCommissions(null); }}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Assignment Modal */}
                {showAssignModal && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4">
                                    <h5 className="modal-title fw-bold">
                                        Assign {showAssignModal === 'leads' ? 'Leads' : 'Properties'} to {targetAgent?.user?.firstName} {targetAgent?.user?.lastName}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAssignModal(null)}></button>
                                </div>
                                <div className="modal-body p-4 pt-0">
                                    <p className="text-muted small mb-3">Select items to assign to this agent.</p>
                                    <div className="list-group rounded-3 max-vh-50 overflow-auto border-0">
                                        {showAssignModal === 'leads' ? (
                                            unassignedLeads.length === 0 ? <p className="text-center py-4 bg-light rounded">No unassigned leads found.</p> :
                                                unassignedLeads.map((lead: any) => (
                                                    <label key={lead.id} className="list-group-item list-group-item-action border-0 mb-1 rounded-3 bg-light d-flex align-items-center">
                                                        <input
                                                            className="form-check-input me-3"
                                                            type="checkbox"
                                                            checked={assignedItems.includes(lead.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setAssignedItems([...assignedItems, lead.id]);
                                                                else setAssignedItems(assignedItems.filter(id => id !== lead.id));
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold">{lead.name}</div>
                                                            <div className="text-muted" style={{ fontSize: '11px' }}>{lead.email} | {lead.property?.title || 'General'}</div>
                                                        </div>
                                                    </label>
                                                ))
                                        ) : (
                                            allProperties.length === 0 ? <p className="text-center py-4 bg-light rounded">No properties found.</p> :
                                                allProperties.map((prop: any) => (
                                                    <label key={prop.id} className="list-group-item list-group-item-action border-0 mb-1 rounded-3 bg-light d-flex align-items-center">
                                                        <input
                                                            className="form-check-input me-3"
                                                            type="checkbox"
                                                            checked={assignedItems.includes(prop.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setAssignedItems([...assignedItems, prop.id]);
                                                                else setAssignedItems(assignedItems.filter(id => id !== prop.id));
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold">{prop.title}</div>
                                                            <div className="text-muted small">{prop.addressLine1}, {prop.city}</div>
                                                        </div>
                                                    </label>
                                                ))
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light" onClick={() => setShowAssignModal(null)}>Cancel</button>
                                    <button
                                        type="button"
                                        className="btn btn-primary px-4"
                                        disabled={assignedItems.length === 0}
                                        onClick={confirmAssignment}
                                    >
                                        Complete Assignment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Newly Created Agent Success Modal */}
                {newlyCreatedAgent && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4 text-center p-4">
                                <div className="mb-4">
                                    <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                        <i className="bi bi-check-lg fs-2"></i>
                                    </div>
                                    <h4 className="fw-bold">Agent Account Created!</h4>
                                    <p className="text-muted">Agent {newlyCreatedAgent.firstName} can now log in with these credentials.</p>
                                </div>
                                <div className="bg-light p-3 rounded-4 mb-4 text-start">
                                    <div className="mb-2">
                                        <label className="small text-muted text-uppercase fw-bold">Login Email</label>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">{newlyCreatedAgent.email}</span>
                                            <button className="btn btn-sm btn-link" onClick={() => copyToClipboard(newlyCreatedAgent.email)}><i className="bi bi-clipboard"></i></button>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <label className="small text-muted text-uppercase fw-bold">Login Phone</label>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">{newlyCreatedAgent.phone}</span>
                                            <button className="btn btn-sm btn-link" onClick={() => copyToClipboard(newlyCreatedAgent.phone)}><i className="bi bi-clipboard"></i></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="small text-muted text-uppercase fw-bold">Password</label>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-bold font-monospace">{newlyCreatedAgent.password}</span>
                                            <button className="btn btn-sm btn-link" onClick={() => copyToClipboard(newlyCreatedAgent.password)}><i className="bi bi-clipboard"></i></button>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-primary w-100 py-2 rounded-3" onClick={() => setNewlyCreatedAgent(null)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agent Detail Modal */}
                {viewingAgent && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1080 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="bg-primary p-4 text-white position-relative">
                                    <button type="button" className="btn-close btn-close-white position-absolute end-0 top-0 m-4" onClick={() => setViewingAgent(null)}></button>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-4 shadow-sm" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                            {viewingAgent.user?.firstName?.[0]}{viewingAgent.user?.lastName?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-1 text-white">{viewingAgent.user?.firstName} {viewingAgent.user?.lastName}</h3>
                                            <div className="badge bg-white text-primary rounded-4 mb-2">Agent ID: {viewingAgent.id.substring(0, 8)}</div>
                                            <div className="d-flex gap-3 small opacity-75">
                                                <span><i className="bi bi-envelope me-1"></i> {viewingAgent.user?.email}</span>
                                                <span><i className="bi bi-telephone me-1"></i> {viewingAgent.user?.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-4">
                                        {/* Left Column: Info & Stats */}
                                        <div className="col-md-5">
                                            <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                                                <h6 className="fw-bold mb-3 border-bottom pb-2">Profile Information</h6>
                                                <div className="mb-3">
                                                    <label className="small text-muted text-uppercase mb-1 fw-bold">Specialization</label>
                                                    <p className="mb-0 fw-medium">{viewingAgent.specialization || 'General Agent'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="small text-muted text-uppercase mb-1 fw-bold">Commission Rate</label>
                                                    <p className="mb-0 fw-medium text-success">{viewingAgent.commissionRate}%</p>
                                                </div>
                                                <div>
                                                    <label className="small text-muted text-uppercase mb-1 fw-bold">Join Date</label>
                                                    <p className="mb-0 fw-medium">{new Date(viewingAgent.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-4 shadow-sm">
                                                <h6 className="fw-bold mb-3 border-bottom pb-2">Performance Metrics</h6>
                                                <div className="row text-center">
                                                    <div className="col-6">
                                                        <div className="h3 fw-bold text-primary mb-0">{viewingAgent.totalLeads}</div>
                                                        <div className="small text-muted text-uppercase">Leads</div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="h3 fw-bold text-success mb-0">{viewingAgent.totalDeals}</div>
                                                        <div className="small text-muted text-uppercase">Deals</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Assigned Properties & Leads */}
                                        <div className="col-md-7">
                                            {/* Assigned Properties Section */}
                                            <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
                                                <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                                    <h6 className="fw-bold mb-0">Assigned Properties ({viewingAgentProperties.length})</h6>
                                                    <button className="btn btn-sm btn-outline-primary rounded-4 py-0" onClick={() => { setViewingAgent(null); handleAssignClick('properties', viewingAgent); }}>
                                                        <i className="bi bi-plus"></i> Manage
                                                    </button>
                                                </div>
                                                <div className="max-vh-50 overflow-auto">
                                                    {viewingAgentProperties.length === 0 ? (
                                                        <div className="p-5 text-center text-muted">
                                                            <i className="bi bi-building fs-1 opacity-25 mb-3 d-block"></i>
                                                            No properties assigned.
                                                        </div>
                                                    ) : (
                                                        <div className="list-group list-group-flush">
                                                            {viewingAgentProperties.map((assign: any) => (
                                                                <div key={assign.id} className="list-group-item p-3">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="rounded-3 bg-light me-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '48px', height: '48px' }}>
                                                                            {assign.property?.mainImage?.url ? (
                                                                                <img src={assign.property.mainImage.url} alt="" className="w-100 h-100 object-fit-cover" />
                                                                            ) : (
                                                                                <i className="bi bi-geo-alt text-muted"></i>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-grow-1 overflow-hidden">
                                                                            <div className="fw-bold text-truncate mb-0" title={assign.property?.title}>{assign.property?.title}</div>
                                                                            <div className="text-muted small text-truncate">{assign.property?.city}, {assign.property?.state}</div>
                                                                        </div>
                                                                        <div className="text-end ms-2">
                                                                            <div className="badge bg-success-subtle text-success">{assign.commissionRate}%</div>
                                                                            {assign.isPrimary && <div className="small text-primary fw-bold" style={{ fontSize: '10px' }}>PRIMARY</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Assigned Leads Section */}
                                            <div className="bg-white rounded-4 shadow-sm overflow-hidden">
                                                <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                                    <h6 className="fw-bold mb-0">Assigned Leads ({viewingAgentLeads.length})</h6>
                                                    <button className="btn btn-sm btn-outline-primary rounded-4 py-0" onClick={() => { setViewingAgent(null); handleAssignClick('leads', viewingAgent); }}>
                                                        <i className="bi bi-plus"></i> Manage
                                                    </button>
                                                </div>
                                                <div className="max-vh-50 overflow-auto">
                                                    {viewingAgentLeads.length === 0 ? (
                                                        <div className="p-5 text-center text-muted">
                                                            <i className="bi bi-person fs-1 opacity-25 mb-3 d-block"></i>
                                                            No leads assigned.
                                                        </div>
                                                    ) : (
                                                        <div className="list-group list-group-flush">
                                                            {viewingAgentLeads.map((assign: any) => (
                                                                <div key={assign.id} className="list-group-item p-3">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="rounded-circle bg-primary-subtle text-primary me-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                                            {assign.lead?.name?.[0]}
                                                                        </div>
                                                                        <div className="flex-grow-1 overflow-hidden">
                                                                            <div className="fw-bold text-truncate mb-0">{assign.lead?.name}</div>
                                                                            <div className="text-muted small text-truncate">{assign.lead?.email}</div>
                                                                        </div>
                                                                        <div className="text-end ms-2">
                                                                            <div className={`badge bg-${assign.status === 1 ? 'success' : 'secondary'}-subtle text-${assign.status === 1 ? 'success' : 'secondary'}`}>
                                                                                {assign.status === 1 ? 'Active' : 'Inactive'}
                                                                            </div>
                                                                            {assign.isPrimary && <div className="small text-primary fw-bold" style={{ fontSize: '10px' }}>PRIMARY</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 bg-white">
                                    <button type="button" className="btn btn-light rounded-4 px-4" onClick={() => setViewingAgent(null)}>Close Profile</button>
                                    <button type="button" className="btn btn-primary rounded-4 px-4" onClick={() => { setViewingAgent(null); handleEdit(viewingAgent); }}>
                                        <i className="bi bi-pencil me-2"></i> Edit Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout >
    );
}
